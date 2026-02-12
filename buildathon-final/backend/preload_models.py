
import chromadb.utils.embedding_functions as embedding_functions
import os

def preload():
    print("⬇️ Pre-downloading ChromaDB Embedding Model (all-MiniLM-L6-v2)...")
    # This initializes the default embedding function used by Chroma
    # It will download the model to the cache directory if not present
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    # Run a dummy inference to force the lazy-load download
    ef(["Hello world"])
    print("✅ Model download complete.")

if __name__ == "__main__":
    preload()
