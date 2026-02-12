
import firebase_admin
from firebase_admin import credentials, firestore
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

CASE_ID = "CASE-784957"

print(f"--- CHECKING SUMMARY FOR {CASE_ID} ---")
query = db.collection("case_pre_doctor_summaries").where("case_id", "==", CASE_ID).stream()

found = False
for doc in query:
    found = True
    print(json.dumps(doc.to_dict(), indent=2, default=str))

if not found:
    print("No summary found in 'case_pre_doctor_summaries'.")

print(f"\n--- CHECKING APPOINTMENT FOR {CASE_ID} ---")
query = db.collection("appointments").where("case_id", "==", CASE_ID).stream()
for doc in query:
    print(json.dumps(doc.to_dict(), indent=2, default=str))
