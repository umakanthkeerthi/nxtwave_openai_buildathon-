
import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

TARGET_CASE_ID = "CASE-784957"

def check_for_case(collection_name):
    print(f"\n--- Searching {collection_name} for case_id='{TARGET_CASE_ID}' ---")
    
    # Try filtering
    try:
        query = db.collection(collection_name).where("case_id", "==", TARGET_CASE_ID).stream()
        found = False
        for doc in query:
            found = True
            print(f"FOUND Document ID: {doc.id}")
            print(f"Data: {doc.to_dict()}")
        
        if not found:
            print("No matching documents found.")
            
    except Exception as e:
        print(f"Error querying {collection_name}: {e}")

check_for_case("case_pre_doctor_summaries")
check_for_case("pre_doctor_consultation_summaries")
check_for_case("case_ai_patient_summaries")
