# ragcore/generate.py
import os
from openai import OpenAI

SYSTEM = """You are a precise assistant. 
- Use ONLY provided context to answer.
- If missing info, say what’s missing.
- Cite sources inline as [n] where n indexes the context list."""

def build_prompt(query: str, context_chunks: list[  dict]):
    ctx = []
    for i, c in enumerate(context_chunks, 1):
        src = c["chunk"]["meta"].get("filename", "unknown")
        ctx.append(f"[{i}] ({src})\n{c['chunk']['text']}")
    ctx_txt = "\n\n".join(ctx)
    user = f"Question: {query}\n\nContext:\n{ctx_txt}\n\nAnswer with citations like [1], [2]."
    return SYSTEM, user

def call_llm(query: str, context_chunks: list[dict], model="gpt-4o-mini"):
    client = OpenAI(api_key="yourkeyhere")
    system, user = build_prompt(query, context_chunks)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role":"system","content":system},
                  {"role":"user","content":user}],
        temperature=0.2,
    )
    return resp.choices[0].message.content
