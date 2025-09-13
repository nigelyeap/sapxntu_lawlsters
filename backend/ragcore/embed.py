# ragcore/embed.py
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class VectorIndex:
    def __init__(self, model_name="intfloat/e5-base"):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.store = []   # parallel array of chunks

    def _embed(self, texts: list[str]) -> np.ndarray:
        # e5 expects "query: ..." / "passage: ..." convention
        return np.array(self.model.encode(texts, normalize_embeddings=True))

    def build(self, chunks: list[dict]):
        self.store = chunks
        texts = [f"passage: {c['text']}" for c in chunks if 'text' in c and c['text']]
        if not texts:
            self.index = None
            return

        vecs = self._embed(texts).astype('float32')
        self.index = faiss.IndexFlatIP(vecs.shape[1])
        self.index.add(vecs)

    def search(self, query: str, top_k: int = 20):
        if self.index is None or len(self.store) == 0:
            return []
        q = self._embed([f"query: {query}"]).astype('float32')
        sims, ids = self.index.search(q, top_k)
        if sims.shape[0] == 0 or ids.shape[0] == 0:
            return []
        results = [
            {"score": float(sims[0][i]), "chunk": self.store[idx]}
            for i, idx in enumerate(ids[0]) if idx < len(self.store)
    ]
        return results