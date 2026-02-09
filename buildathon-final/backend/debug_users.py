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

print("--- Checking Users Collection ---")
users = db.collection("users").stream()
for user in users:
    data = user.to_dict()
    email = data.get("email", "No Email")
    doctor_id = data.get("doctor_id", "MISSING")
    role = data.get("role", "No Role")
    print(f"User: {email} | Role: {role} | Doctor ID: {doctor_id}")

print("\n--- Checking Doctors Collection ---")
doctors = db.collection("doctors").stream()
for doc in doctors:
    data = doc.to_dict()
    print(f"Doctor: {data.get('name')} | ID: {doc.id}")
