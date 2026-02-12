
import firebase_admin
from firebase_admin import credentials, firestore
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

CASE_ID = "CASE-784957"

print(f"--- FULL SUMMARY DUMP FOR {CASE_ID} ---")
query = db.collection("case_pre_doctor_summaries").where("case_id", "==", CASE_ID).stream()

for doc in query:
    data = doc.to_dict()
    # Try to find the inner summary object
    summary = data.get("pre_doctor_consultation_summary", data)
    
    print(json.dumps(summary, indent=2, default=str))
