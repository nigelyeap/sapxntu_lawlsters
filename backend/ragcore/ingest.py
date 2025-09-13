# ragcore/ingest.py
from pathlib import Path
from unstructured.partition.auto import partition
from nltk.tokenize import sent_tokenize

def clean_text(txt: str) -> str:
    # drop boilerplate, normalize whitespace, fix OCR quirks
    lines = [l.strip() for l in txt.splitlines()]
    txt = "\n".join(l for l in lines if l)
    return txt

def parse_to_text(path: Path) -> str:
    # works for PDF, DOCX, HTML, MD, TXT
    elements = partition(filename=str(path))
    txt = "\n".join(e.text for e in elements if e.text)
    return clean_text(txt)

def chunk_text(txt: str, max_tokens=500, overlap=80) -> list[dict]:
    # naïve sentence-based chunking (swap with tiktoken if you prefer token-accurate)
    sents = sent_tokenize(txt)
    chunks, cur = [], []
    cur_len = 0
    for s in sents:
        cur.append(s); cur_len += len(s.split())
        if cur_len >= max_tokens:
            chunks.append(" ".join(cur))
            # overlap
            back = " ".join(" ".join(cur).split()[-overlap:])
            cur, cur_len = [back], len(back.split())
    if cur:
        chunks.append(" ".join(cur))
    # add metadata now; you can enrich later (author, section, dates)
    return [{"text": c, "meta": {}} for c in chunks]

def ingest_dir(raw_dir: str) -> list[dict]:
    docs = []
    print(raw_dir)
    print(Path(raw_dir).resolve())
    abs_dir = Path(raw_dir).resolve()
    print(f"Ingesting from: {abs_dir}")
    if not abs_dir.exists():
        print(f"Directory does not exist: {abs_dir}")
        return docs
    files = list(abs_dir.glob("*"))
    print(f"Files found: {files}")
    for p in files:
        print(f"Found file: {p}")
        if p.suffix.lower() in {".pdf", ".docx", ".html", ".md", ".txt"}:
            txt = parse_to_text(p)
            if not txt:
                print(f"Skipping {p}: no text extracted")
                continue
            for ch in chunk_text(txt):
                ch["meta"].update({"source_path": str(p), "filename": p.name})
                docs.append(ch)
    print(f"Total docs ingested: {len(docs)}")
    return docs