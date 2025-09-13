# ragcore/rerank.py
from sentence_transformers import CrossEncoder

class Reranker:
    def __init__(self, model_name="BAAI/bge-reranker-base"):
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, candidates: list[dict], top_k=8):
        pairs = [(query, c["chunk"]["text"]) for c in candidates]
        scores = self.model.predict(pairs).tolist()
        for s, c in zip(scores, candidates): c["rerank"] = float(s)
        return sorted(candidates, key=lambda x: -x["rerank"])[:top_k]
