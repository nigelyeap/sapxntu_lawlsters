# ragcore/verify.py
import re

def has_citations(answer: str) -> bool:
    return bool(re.search(r"\[\d+\]", answer))

def self_check(answer: str, query: str) -> list[str]:
    issues = []
    if not has_citations(answer):
        issues.append("Missing citations.")
    if "I don’t know" in answer or "insufficient" in answer.lower():
        # Not necessarily bad; just flag for UX
        issues.append("Model reported insufficient context.")
    # add domain-specific regex checks if needed
    return issues
