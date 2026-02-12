
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

CASE_ID = "CASE-784957"

print(f"--- CHECKING APPOINTMENT FOR {CASE_ID} ---")
query = db.collection("appointments").where("case_id", "==", CASE_ID).stream()

found = False
for doc in query:
    found = True
    data = doc.to_dict()
    print(f"Appointment ID: {doc.id}")
    print(f"patient_id: {data.get('patient_id')}")
    print(f"case_id: {data.get('case_id')}")
    print(f"pre_doctor_consultation_summary_id: {data.get('pre_doctor_consultation_summary_id')}")
    print(f"triage_decision: {data.get('triage_decision')}")
    print(f"is_emergency: {data.get('is_emergency')}")

if not found:
    print("No appointment found with this Case ID.")
