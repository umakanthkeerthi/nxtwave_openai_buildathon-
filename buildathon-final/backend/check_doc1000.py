
import os
import sys
from dotenv import load_dotenv

# Load .env explicitly
load_dotenv()

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.core.firebase import firebase_service

def check_doc1000():
    doctor_id = "DOC-1000"
    print(f"Checking appointments for {doctor_id}...", flush=True)
    
    try:
        appointments = firebase_service.get_appointments(doctor_id=doctor_id)
        print(f"Found {len(appointments)} appointments.", flush=True)
        for apt in appointments:
            print(f" - ID: {apt.get('id')} | Patient: {apt.get('patient_name')} | Status: {apt.get('status')}", flush=True)
            
    except Exception as e:
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    check_doc1000()
