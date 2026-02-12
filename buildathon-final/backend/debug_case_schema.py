
import firebase_admin
from firebase_admin import credentials, firestore
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

CASE_ID = "CASE-784957"

print(f"--- CASE DOCUMENT FOR {CASE_ID} ---")
# Query the 'cases' collection directly for the document with case_id
# Note: The screenshot showed the document ID might be the same as CASE_ID
doc_ref = db.collection("cases").document(CASE_ID)
doc = doc_ref.get()

if doc.exists:
    print(json.dumps(doc.to_dict(), indent=2, default=str))
else:
    print(f"Document {CASE_ID} not found in 'cases' collection. Trying query...")
    query = db.collection("cases").where("case_id", "==", CASE_ID).stream()
    found = False
    for d in query:
        print(f"Found via query (ID: {d.id}):")
        print(json.dumps(d.to_dict(), indent=2, default=str))
        found = True
    if not found:
        print("No matching case found.")
