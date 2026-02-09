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

print("--- Checking Appointments with Profile IDs ---")
appointments = db.collection("appointments").stream()
for apt in appointments:
    data = apt.to_dict()
    print(f"Appointment ID: {apt.id}")
    print(f"  profile_id: {data.get('profile_id')}")
    print(f"  doctor_id: {data.get('doctor_id')}")
    print(f"  slot_time: {data.get('slot_time')}")
    print("-" * 40)
