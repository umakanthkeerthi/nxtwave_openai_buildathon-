
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

# Setup Firebase
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Init Error: {e}")
        exit(1)

db = firestore.client()

def check_appointments():
    print("--- Checking Appointments ---")
    docs = db.collection("appointments").stream()
    count = 0
    emergency_count = 0
    for doc in docs:
        data = doc.to_dict()
        is_emergency = data.get("is_emergency")
        print(f"ID: {doc.id} | Emergency: {is_emergency} | Triage: {data.get('triage_decision', 'N/A')} | Mode: {data.get('mode')}")
        count += 1
        if is_emergency:
            emergency_count += 1
            
    print(f"Total Appointments: {count}")
    print(f"Total Emergency Appointments: {emergency_count}")

def check_emergencies_logic():
    print("\n--- Testing get_emergencies Logic ---")
    try:
        # Replicating the logic from firebase.py
        apt_query = db.collection("appointments").where("is_emergency", "==", True)
        apt_docs = apt_query.stream()
        found = False
        for doc in apt_docs:
            print(f"Found Emergency Appointment via Query: {doc.id}")
            found = True
        
        if not found:
            print("Query returned NO results.")
    except Exception as e:
        print(f"Query Error: {e}")

if __name__ == "__main__":
    check_appointments()
    check_emergencies_logic()
