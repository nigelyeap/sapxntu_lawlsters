# ragcore/retrieve.py
from rank_bm25 import BM25Okapi
from datetime import datetime
from ragcore.embed import VectorIndex
from ragcore.ingest import ingest_dir
import numpy as np
# load and chunk your documents
chunks = ingest_dir("data/raw")
if not chunks:
    raise ValueError("No data found in data/raw. Please add documents to index.")
# build embeddings index
vec = VectorIndex("intfloat/e5-base")
vec.build(chunks)

class HybridRetriever:
    def __init__(self, chunks: list[dict], vec: VectorIndex):
        self.vec = vec
        self.chunks = chunks
        self.corpus_tokens = [c["text"].split() for c in chunks]
        if not self.corpus_tokens:
            raise ValueError("No tokens found for BM25. Check your data and ingest logic.")
        self.bm25 = BM25Okapi(self.corpus_tokens)

    def _metadata_filter(self, items, *, after=None, filename_contains=None):
        def ok(meta):
            a = True
            if after:
                # requires you to put ISO date in meta["date"]
                try:
                    a &= datetime.fromisoformat(meta.get("date", "1970-01-01")) >= after
                except Exception:
                    a &= True
            if filename_contains:
                a &= filename_contains.lower() in meta.get("filename", "").lower()
            return a
        return [x for x in items if ok(x["chunk"]["meta"])]

    def retrieve(self, query: str, k_vec=30, k_bm25=30, top_k=20, **filters):
        # semantic
        vec_hits = self.vec.search(query, k_vec)
        # lexical
        scores = self.bm25.get_scores(query.split())
        top_ids = np.argsort(scores)[::-1][:k_bm25]
        bm25_hits = [{"score": float(scores[i]), "chunk": self.chunks[i]} for i in top_ids]

        # fuse (simple sum after z-score; you can use Reciprocal Rank Fusion)
        def zscore(xs):
            xs = np.array(xs); return (xs - xs.mean()) / (xs.std() + 1e-6)
        all_items = vec_hits + bm25_hits
        # normalize per source
        vs = zscore([h["score"] for h in vec_hits]) if vec_hits else []
        bs = zscore([h["score"] for h in bm25_hits]) if bm25_hits else []
        for i, h in enumerate(vec_hits): h["fused"] = float(vs[i])
        for i, h in enumerate(bm25_hits): h["fused"] = float(bs[i])
        fused = sorted(all_items, key=lambda x: -x["fused"])

        # filters
        fused = self._metadata_filter(fused, **filters)

        # dedupe by near-duplicate text
        seen, out = set(), []
        for h in fused:
            sig = h["chunk"]["text"][:200]
            if sig not in seen:
                out.append(h)
                seen.add(sig)
            if len(out) >= top_k: break
        return out
