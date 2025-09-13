from flask import Flask, request, jsonify
from flask_cors import CORS
import os

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

if __name__ == '__main__':
    bootstrap_index("data/raw")  # or your actual data dir
    app.run(debug=True, port=5000)  