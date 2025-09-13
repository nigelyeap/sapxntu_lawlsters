# app.py
import os, argparse
from ragcore.ingest import ingest_dir
from ragcore.embed import VectorIndex
from ragcore.retrieve import HybridRetriever
from ragcore.rerank import Reranker
from ragcore.orchestrate import detect_intent, rewrite_query, compress_context
from ragcore.generate import call_llm
from ragcore.verify import self_check

def bootstrap_index(data_dir="data/raw"):
    chunks = ingest_dir(data_dir)
    vec = VectorIndex("intfloat/e5-base")         # swap to text-embedding-3-large if you want
    vec.build(chunks)
    retriever = HybridRetriever(chunks, vec)
    reranker = Reranker("BAAI/bge-reranker-base")
    return retriever, reranker

def answer(query: str, retriever, reranker, top_k=8):
    intent = detect_intent(query)
    q2 = rewrite_query(query, intent)
    candidates = retriever.retrieve(q2, top_k=40)
    ranked = reranker.rerank(q2, candidates, top_k=top_k)
    ctx = compress_context(ranked, max_chars=3500)
    ans = call_llm(query, ctx, model=os.getenv("RAG_LLM", "gpt-4o-mini"))
    issues = self_check(ans, query)
    return ans, issues

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", required=True)
    parser.add_argument("--data_dir", default="data/raw")
    args = parser.parse_args()

    retriever, reranker = bootstrap_index(args.data_dir)
    ans, issues = answer(args.query, retriever, reranker)
    print("\n=== ANSWER ===\n", ans)
    if issues:
        print("\n=== CHECKS ===")
        for i in issues: print("-", i)
