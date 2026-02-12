
import os
import chromadb
from typing import Dict, Any, List
from langchain_groq import ChatGroq
from app.core.config import settings

# Initialize Clients
# Initialize Clients
chroma_client = chromadb.PersistentClient(path=settings.DB_PATH)

# [FIX] Use local model path if available
from chromadb.utils import embedding_functions
local_model_path = os.path.join(settings.project_root, "app", "models", "all-MiniLM-L6-v2")

if os.path.exists(local_model_path):
    print(f"📂 Using LOCAL embedding model from: {local_model_path}")
    # We must instantiate SentenceTransformer directly to use local path
    # Chroma's wrapper doesn't support 'path' easily in older versions, 
    # but we can trick it or just letting it use cache if we moved it there.
    # Actually, the cleanest way is a custom EF or relying on cache.
    # Let's try pointing to the absolute path string as the model_name
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=local_model_path)
else:
    print("☁️ Using DEFAULT embedding model (downloading...)")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

col_rules = chroma_client.get_collection("decision_rules", embedding_function=ef)
col_summaries = chroma_client.get_collection("protocol_summaries", embedding_function=ef)

def retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Intelligent Retrieval:
    1. Checks if we need new data (Context Persistence).
    2. Retrieves Protocol Summaries (Context).
    3. Retrieves Decision Rules (Actionable Logic).
    """
    messages = state.get("messages", [])
    last_msg = messages[-1].content
    

        
    print(f"🔎 Retrieving for: {last_msg}")
    
    # 2. Retrieve Decision Rules (The most important part)
    # We query for the user's symptoms
    results = col_rules.query(
        query_texts=[last_msg],
        n_results=3
    )
    
    # Format for LLM
    docs = []
    if results['documents']:
        for i, doc in enumerate(results['documents'][0]):
            meta = results['metadatas'][0][i]
            docs.append(f"[PROTOCOL: {meta['protocol']}] [SECTION: {meta['section']}]\n{doc}")
            
    return {"retrieved_protocols": docs}
