from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import base64
import re
import numpy as np
import cv2
from gtts import gTTS
from deepface import DeepFace
from pathlib import Path
import sys

# Import your RAG pipeline functions
from ragcore.ingest import ingest_dir
from ragcore.embed import VectorIndex
from ragcore.retrieve import HybridRetriever
from ragcore.rerank import Reranker
from ragcore.orchestrate import detect_intent, rewrite_query, compress_context
from ragcore.generate import call_llm
from ragcore.verify import self_check

app = Flask(__name__)
CORS(app)
 
# Bootstrap index ONCE at startup
retriever, reranker = None, None

# --- Optional: wire in local career-path pipeline (Python scripts under ../career-path) ---
CAREER_PATH_DIR = Path(__file__).resolve().parents[1] / "career-path"  # Now sapxntu_lawlsters1
if CAREER_PATH_DIR.exists():
    sys.path.insert(0, str(CAREER_PATH_DIR))
    try:
        # Import using filenames inside career-path/
        import app as career_app
        from app import (
            load_user_profile,
            make_docs_from_profile,
            build_query_from_profile,
            parse_table,
            make_graphviz_flow_from_table,
        )
        from rag import load_corpus as cp_load_corpus, build_index as cp_build_index, search as cp_search
        CAREER_PATH_AVAILABLE = True
    except Exception:
        CAREER_PATH_AVAILABLE = False
else:
    CAREER_PATH_AVAILABLE = False

def bootstrap_index(data_dir=None):
    global retriever, reranker
    # Resolve data_dir relative to this file to avoid CWD issues
    if data_dir is None:
        data_dir = str((Path(__file__).parent / "data" / "raw").resolve())
    chunks = ingest_dir(data_dir)
    if not chunks:
        print(f"[bootstrap] No documents found under {data_dir}. RAG endpoints will be disabled.")
        retriever = None
        reranker = None
        return
    vec = VectorIndex("intfloat/e5-base")
    vec.build(chunks)
    retriever = HybridRetriever(chunks, vec)
    reranker = Reranker("BAAI/bge-reranker-base")

def answer(query: str, retriever, reranker, top_k=8):
    intent = detect_intent(query)
    q2 = rewrite_query(query, intent)
    candidates = retriever.retrieve(q2, top_k=40)
    ranked = reranker.rerank(q2, candidates, top_k=top_k)
    ctx = compress_context(ranked, max_chars=3500)
    ans = call_llm(query, ctx, model=os.getenv("RAG_LLM", "gpt-4o-mini"))
    issues = self_check(ans, query)
    return ans, issues


@app.route('/api/upload-pdfs', methods=['POST'])
def upload_pdfs():
    # Ensure upload folder exists
    upload_folder = Path(__file__).parent / 'data' / 'raw'
    upload_folder.mkdir(parents=True, exist_ok=True)
    files = request.files.getlist('pdfs')
    if not files:
        return jsonify({'error': 'No PDF files uploaded'}), 400
    saved = []
    for file in files:
        if file and file.filename.lower().endswith('.pdf'):
            dest = upload_folder / file.filename
            file.save(dest)
            saved.append(file.filename)
    if not saved:
        return jsonify({'error': 'No valid PDF files uploaded'}), 400
    # Trigger RAG ingest after upload
    try:
        chunks = ingest_dir(str(upload_folder))
        msg = f'Successfully uploaded: {", ".join(saved)}. RAG updated with {len(chunks)} new chunks.'
    except Exception as e:
        msg = f'Successfully uploaded: {", ".join(saved)}, but failed to update RAG: {e}'
    return jsonify({'message': msg, 'files': saved})

@app.route('/api/tts', methods=['GET'])
def tts():
    text = "Welcome! Listening has started. Please speak now."  # Your predetermined string
    tts = gTTS(text)
    filename = "tts_output.mp3"
    tts.save(filename)
    return send_file(filename, mimetype="audio/mpeg")

@app.route('/api/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_query = data.get('query', '')
    if not user_query:
        return jsonify({'error': 'No query provided'}), 400
    if retriever is None or reranker is None:
        return jsonify({'error': 'RAG index not initialized'}), 500
    try:
        ans, issues = answer(user_query, retriever, reranker)
        return jsonify({'answer': ans, 'checks': issues})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/advice', methods=['POST'])
def advice():
    data = request.get_json()
    transcript = data.get('transcript', '')
    emotion = data.get('emotion', '')
    if not transcript and not emotion:
        return jsonify({'error': 'No transcript or emotion provided'}), 400
    if retriever is None or reranker is None:
        return jsonify({'error': 'RAG index not initialized'}), 500
    try:
        # Compose a query for the LLM
        user_query = f"Transcript: {transcript}\nEmotion: {emotion}\nBased on this, give advice."
        ans, issues = answer(user_query, retriever, reranker)
        return jsonify({'advice': ans, 'checks': issues})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
"""

@app.route('/api/advice', methods=['POST'])
def advice():
    data = request.get_json()
    transcript = data.get('transcript', '')
    emotion = data.get('emotion', '')
    return jsonify({'advice': f"Transcript: {transcript}, Emotion: {emotion}"})
"""
@app.route('/api/process_webcam', methods=['POST'])
def process_webcam():
    data = request.get_json()
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'No image data provided'}), 400

    # Remove the header of the data URL
    match = re.match(r'data:image/(png|jpeg);base64,(.*)', image_data)
    if not match:
        return jsonify({'error': 'Invalid image data'}), 400

    image_b64 = match.group(2)
    try:
        image_bytes = base64.b64decode(image_b64)
        # Process image_bytes as needed
        result = f"Received image of size: {len(image_bytes)} bytes"
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process-image', methods=['POST'])
def process_image():
    data = request.get_json()
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'No image data provided'}), 400

    # Remove the header of the data URL
    match = re.match(r'data:image/(png|jpeg);base64,(.*)', image_data)
    if not match:
        return jsonify({'error': 'Invalid image data'}), 400

    image_b64 = match.group(2)
    try:
        image_bytes = base64.b64decode(image_b64)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Use DeepFace to analyze emotion
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        if isinstance(result, list):
            result = result[0]
        emotion = result['dominant_emotion']

        return jsonify({'result': f'Detected emotion: {emotion}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process-audio', methods=['POST'])
def process_audio():
    data = request.get_json()
    transcript = data.get('transcript')
    if not transcript:
        return jsonify({'error': 'No transcript provided'}), 400
    # Here you can process the transcript, e.g., analyze sentiment, save, etc.
    return jsonify({'result': f'Received transcript: {transcript}'})


# ---------------- Career Path API ----------------
def _apply_profile_overrides(base_profile: dict, override: dict | None) -> dict:
    if not override:
        return base_profile
    out = dict(base_profile)
    for k, v in override.items():
        out[k] = v
    return out


@app.route('/api/career-path/generate', methods=['POST'])
def career_path_generate():
    if not CAREER_PATH_AVAILABLE:
        return jsonify({
            'error': 'career-path module not available',
            'hint': 'Ensure ../career-path exists and required deps are installed.'
        }), 500

    try:
        payload = request.get_json(silent=True) or {}
        profile_override = payload.get('profile')  # optional overrides

        # Load and extend corpus (best-effort; tolerate failures)
        profile = load_user_profile()
        if isinstance(profile_override, dict):
            profile = _apply_profile_overrides(profile, profile_override)

        hits = []
        try:
            docs = cp_load_corpus()
            docs.extend(make_docs_from_profile(profile))
            industries = profile.get('industries', []) or []
            if industries:
                wanted = {f"industry:{x}".lower() for x in industries}
                wanted.add("industry:cross-sector")
                pre = []
                for d in docs:
                    tags = [str(t).lower() for t in (d.get('tags') or [])]
                    if any(t in wanted for t in tags):
                        pre.append(d)
                if pre:
                    docs = pre
            embs, docs_idx = cp_build_index(docs)
            query = build_query_from_profile(profile)
            include_tags = [f"industry:{x}" for x in industries] if industries else None
            if industries:
                include_tags.append('industry:Cross-sector')
            include_types = [
                'signal', 'pdf', 'web', 'skill', 'mapping',
                'course', 'certification', 'tool', 'soft_skill',
            ] if industries else None
            hits = cp_search(query, docs_idx, embs, top_k=5,
                             include_tags=include_tags, include_types=include_types)
        except Exception as e:
            # Retrieval failed (likely embeddings server). Proceed without hits.
            print(f"[career-path] Retrieval disabled: {e}")

        # Generate markdown table via LLM; fallback to last-saved or stub on failure
        try:
            table_md = career_app.call_llm(hits, profile)
        except Exception as e:
            print(f"[career-path] LLM generation failed: {e}")
            # Try last saved table
            last_md = CAREER_PATH_DIR / 'career_path.md'
            if last_md.exists():
                table_md = last_md.read_text(encoding='utf-8')
            else:
                # Minimal stub table based on profile
                name = profile.get('name') or 'You'
                inds = profile.get('industries') or ['Cross-sector']
                sk = profile.get('skills') or {}
                weak = sorted(sk.items(), key=lambda kv: kv[1])[:2]
                weak_list = ", ".join([w[0] for w in weak]) if weak else "skill gaps"
                timeline = profile.get('timeline') or '12 months'
                role = f"Entry role in {inds[0]}" if inds else "Entry role"
                table_md = (
                    "| Target Role | Gap Skills | Timeline (3/6/12 months) | Next Action | Level |\n"
                    "| --- | --- | --- | --- | --- |\n"
                    f"| {role} | {weak_list} | 3 months: build fundamentals; 6 months: complete a course; 12 months: apply for roles | Create a learning plan and enroll in 1–2 courses | Beginner |\n"
                )

        # Save markdown and attempt to render SVG flowchart
        out_md = CAREER_PATH_DIR / 'career_path.md'
        out_md.write_text(table_md, encoding='utf-8')

        svg_ok = False
        svg_path = CAREER_PATH_DIR / 'career_path_flowchart.svg'
        try:
            make_graphviz_flow_from_table(table_md, out_svg='career_path_flowchart.svg')
            svg_ok = svg_path.exists()
        except Exception:
            svg_ok = False

        headers, rows = parse_table(table_md)
        resp = {
            'table_md': table_md,
            'headers': headers,
            'rows': rows,
            'svg_available': svg_ok,
            'svg_url': '/api/career-path/flowchart.svg' if svg_ok else None,
        }
        return jsonify(resp)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/career-path/flowchart.svg', methods=['GET'])
def career_path_svg():
    svg_path = CAREER_PATH_DIR / 'career_path_flowchart.svg'
    if not svg_path.exists():
        return jsonify({'error': 'SVG not found. Generate first.'}), 404
    return send_file(str(svg_path), mimetype='image/svg+xml')

if __name__ == '__main__':
    bootstrap_index()  # uses backend/data/raw by default
    app.run(debug=True, port=5000)  
