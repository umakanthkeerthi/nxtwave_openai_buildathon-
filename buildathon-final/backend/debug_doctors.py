import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except Exception:
        pass

db = firestore.client()

print("--- Checking Doctors Collection ---")
doctors = db.collection("doctors").limit(5).stream()
for doc in doctors:
    data = doc.to_dict()
    print(f"Doctor: {data.get('name')} | ID: {doc.id} | Email: {data.get('email', 'No Email')}")
    # Print keys to be sure
    print(f"Keys: {list(data.keys())}")
    print("-" * 20)
