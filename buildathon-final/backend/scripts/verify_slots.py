
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if cred_path and os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    try:
        app = firebase_admin.get_app()
    except ValueError:
        app = firebase_admin.initialize_app(cred)
else:
    print(f"Error: CREDENTIALS NOT FOUND AT: {cred_path}")
    exit(1)

db = firestore.client()

def check_slots():
    # Fetch all doctor slots
    slots_ref = db.collection("doctor_slots")
    # You might want to filter by a specific doctor_id if known, or just list all recent ones
    docs = slots_ref.stream()
    
    count = 0
    print("\n--- Recent Doctor Slots ---")
    for doc in docs:
        data = doc.to_dict()
        print(f"ID: {doc.id} | Date: {data.get('date')} | Time: {data.get('start_time')} - {data.get('end_time')} | Doc: {data.get('doctor_id')}")
        count += 1
        if count >= 20: # Limit output
            print("... (showing first 20 only)")
            break
            
    print(f"\nTotal Slots Checked: {count}")

if __name__ == "__main__":
    check_slots()
