
import os
import chromadb
from typing import Dict, Any, List
from langchain_groq import ChatGroq
from app.core.config import settings

# Initialize Clients
# Initialize Clients
chroma_client = chromadb.PersistentClient(path=settings.DB_PATH)

# [FIX] Switch to ONNX/FastEmbed for lightweight execution
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

print("⚡ Using FastEmbed (ONNX) for embeddings...")
ef = ONNXMiniLM_L6_V2()

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
