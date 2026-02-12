import firebase_admin
from firebase_admin import credentials, firestore
import os

print("Initializing Firebase...")
try:
    # Setup
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    print("Querying latest appointment...")
    # Query
    docs = db.collection("appointments").order_by("created_at", direction=firestore.Query.DESCENDING).limit(5).stream()

    print("\n=== LATEST 5 APPOINTMENTS SNAPSHOT CHECK ===")
    found = False
    for doc in docs:
        found = True
        data = doc.to_dict()
        print(f"Appointment ID: {data.get('appointment_id')}")
        print(f"Case ID:      {data.get('case_id')}")
        print(f"Summary ID:   {data.get('pre_doctor_consultation_summary_id')}") # [NEW]
        print(f"Profile ID:   {data.get('profile_id')}")
        print(f"User ID:      {data.get('user_id')}")
        
        snapshot = data.get('patient_snapshot', {})
        print("\n--- PATIENT SNAPSHOT (Stored in Appointment) ---")
        print(f"Name:   {snapshot.get('name')}")
        print(f"Age:    {snapshot.get('age')}")
        print(f"Gender: {snapshot.get('gender')}")
        print("------------------------------------------------")

    if not found:
        print("No appointments found.")
except Exception as e:
    print(f"Error: {e}")
