import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Example document store
documents = [
    "Ollama is an open-source project for running large language models locally.",
    "Retrieval-Augmented Generation (RAG) combines retrieval and generation for better answers.",
    "You can use Ollama with various models like llama2, llama3, and more.",
    "RAG retrieves relevant documents and feeds them to the language model."
]

def retrieve_context(query, docs, top_k=2):
    vectorizer = TfidfVectorizer().fit(docs + [query])
    doc_vectors = vectorizer.transform(docs)
    query_vector = vectorizer.transform([query])
    similarities = cosine_similarity(query_vector, doc_vectors).flatten()
    top_indices = similarities.argsort()[-top_k:][::-1]
    return [docs[i] for i in top_indices]

def ollama_generate(prompt, model="llama3"):
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()["response"]

def rag_ask(query):
    context = retrieve_context(query, documents)
    prompt = f"Context:\n{chr(10).join(context)}\n\nQuestion: {query}\nAnswer:"
    answer = ollama_generate(prompt)
    return answer

# Example usage
if __name__ == "__main__":
    user_query = "How does RAG work with Ollama?"
    print(rag_ask(user_query))