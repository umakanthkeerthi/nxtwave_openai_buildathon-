import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Test the exact query the backend is using
patient_id = "JXajgduEvDMN5yZZ0xh9FJdI9Bt2"

print(f"Testing query: profile_id == {patient_id}")
query = db.collection("appointments").where("profile_id", "==", patient_id)
docs = list(query.stream())

print(f"Found {len(docs)} appointments")
for doc in docs:
    data = doc.to_dict()
    print(f"  - ID: {doc.id}")
    print(f"    profile_id: {data.get('profile_id')}")
    print(f"    doctor_id: {data.get('doctor_id')}")
    print(f"    slot_time: {data.get('slot_time')}")
