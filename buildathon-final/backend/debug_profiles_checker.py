import firebase_admin
from firebase_admin import credentials, firestore

print("Initializing Firebase...")
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("\n=== DUMPING ALL PROFILES ===")
docs = db.collection("profiles").stream()

for doc in docs:
    data = doc.to_dict()
    print(f"ID: {doc.id}")
    print(data)
    print("-" * 20)
