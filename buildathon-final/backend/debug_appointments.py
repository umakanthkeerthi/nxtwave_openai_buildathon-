
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Setup specific for this environment
cred_path = "c:\\Users\\polur\\.gemini\\antigravity\\scratch\\toplabs_docai_v2\\buildathon-final\\backend\\serviceAccountKey.json"

if os.path.exists(cred_path):
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized.")
    except Exception as e:
        print(f"Init Error: {e}")
        exit(1)
else:
    print(f"Creds not found at {cred_path}")
    exit(1)

print("\n--- Fetching recent appointments ---")
print("\n--- Fetching Specific Appointment ---")
doc = db.collection("appointments").document("rR6X40Ky13jBXsfnCt1c").get()
if doc.exists:
    data = doc.to_dict()
    print(f"ID: {doc.id}")
    print(f"DATA: {data}")
else:
    print("Doc not found")
