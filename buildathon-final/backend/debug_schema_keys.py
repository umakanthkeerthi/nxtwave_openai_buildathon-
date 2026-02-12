
import firebase_admin
from firebase_admin import credentials, firestore
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

CASE_ID = "CASE-784957"

print(f"--- CHECKING SCHEMA KEYS FOR {CASE_ID} ---")
query = db.collection("case_pre_doctor_summaries").where("case_id", "==", CASE_ID).stream()

for doc in query:
    data = doc.to_dict()
    summary = data.get("pre_doctor_consultation_summary", {})
    if not summary:
        # Maybe it's flattened?
        summary = data
        
    print(f"ROOT KEYS: {list(data.keys())}")
    print(f"SUMMARY KEYS: {list(summary.keys())}")
    
    # Check deeper
    if "assessment" in summary:
        print(f"ASSESSMENT KEYS: {list(summary['assessment'].keys())}")
