
import firebase_admin
from firebase_admin import credentials, firestore
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

CASE_ID = "CASE-784957"

print(f"--- CHECKING ALL SUMMARIES FOR {CASE_ID} ---")

collections = [
    "case_ai_patient_summaries", 
    "case_pre_doctor_summaries", 
    "pre_doctor_consultation_summaries"
]

for col in collections:
    print(f"\n[Collection: {col}]")
    query = db.collection(col).where("case_id", "==", CASE_ID).stream()
    found = False
    for doc in query:
        found = True
        data = doc.to_dict()
        print(f"ID: {doc.id}")
        print(f"Type: {data.get('type')}")
        print(f"Reason: {data.get('trigger_reason') or data.get('triage_level')}")
        
    if not found:
        print("No documents found.")
