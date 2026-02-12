
import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.getcwd())
from app.core.firebase import firebase_service

def inspect_appointment():
    doc_id = "xXYPZb5YEUjobn5aK0og"
    print(f"Inspecting doc: {doc_id}...", flush=True)
    try:
        doc = firebase_service.db.collection("appointments").document(doc_id).get()
        if doc.exists:
            print(doc.to_dict(), flush=True)
        else:
            print("Doc not found.", flush=True)
    except Exception as e:
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    inspect_appointment()
