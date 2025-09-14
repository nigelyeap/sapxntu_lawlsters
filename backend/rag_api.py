from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import base64
import re
import numpy as np
import cv2
from gtts import gTTS
from deepface import DeepFace

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

def bootstrap_index(data_dir="data/raw"):
    global retriever, reranker
    chunks = ingest_dir(data_dir)
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

if __name__ == '__main__':
    bootstrap_index("data/raw")  # or your actual data dir
    app.run(debug=True, port=5000)  