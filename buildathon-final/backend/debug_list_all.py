
import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.getcwd())
from app.core.firebase import firebase_service

def list_all_appointments():
    print("Listing ALL appointments (Limit 10)...", flush=True)
    try:
        # Get all docs
        docs = firebase_service.db.collection("appointments").limit(10).stream()
        count = 0
        for doc in docs:
            data = doc.to_dict()
            print(f"Doc ID: {doc.id} | Doctor: {data.get('doctor_id')} | Patient: {data.get('patient_name')}", flush=True)
            count += 1
        
        if count == 0:
            print("Database is EMPTY (0 appointments).", flush=True)
            
    except Exception as e:
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    list_all_appointments()
