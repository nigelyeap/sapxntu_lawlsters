# ragcore/orchestrate.py
from rapidfuzz import fuzz

INTENTS = ["fact_lookup", "howto", "summarize", "compare", "reasoning"]

def detect_intent(q: str) -> str:
    ql = q.lower()
    if any(w in ql for w in ["who", "when", "where", "definition", "what is"]): return "fact_lookup"
    if any(w in ql for w in ["how do", "steps", "implement"]): return "howto"
    if "summar" in ql: return "summarize"
    if "compare" in ql or "vs" in ql: return "compare"
    return "reasoning"

def rewrite_query(q: str, intent: str) -> str:
    # lightweight heuristic rewrite; swap out for an LLM if you want
    if intent == "fact_lookup":
        return f"{q} (names, dates, definitions, precise terms)"
    if intent == "howto":
        return f"{q} step-by-step, pitfalls, prerequisites"
    return q

def compress_context(chunks: list[dict], max_chars=4000) -> list[dict]:
    # simple extractive compression by removing very similar chunks
    kept, buf = [], 0
    for c in chunks:
        if not kept:
            kept.append(c); buf += len(c["chunk"]["text"])
            continue
        sim = max(fuzz.token_set_ratio(c["chunk"]["text"], k["chunk"]["text"]) for k in kept)
        if sim < 85 and buf + len(c["chunk"]["text"]) <= max_chars:
            kept.append(c); buf += len(c["chunk"]["text"])
    return kept
