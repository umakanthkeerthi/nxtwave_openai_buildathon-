
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

def test_slot_creation():
    # Init
    cred_path = "serviceAccountKey.json"
    if not os.path.exists(cred_path):
        print(f"Error: {cred_path} not found")
        return

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    print("Firebase Initialized.")
    
    # Data
    test_slot = {
        "doctor_id": "test_doc_123",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "start_time": "10:00",
        "end_time": "10:30",
        "status": "AVAILABLE",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Write
    print(f"Attempting to write to 'doctor_slots'...")
    try:
        ref = db.collection("doctor_slots").add(test_slot)
        print(f"SUCCESS: Written slot with ID: {ref[1].id}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_slot_creation()
