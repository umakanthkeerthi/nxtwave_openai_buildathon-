
import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def check_collection(name):
    print(f"\n--- Checking Collection: {name} ---")
    docs = db.collection(name).limit(5).stream()
    count = 0
    for doc in docs:
        count += 1
        data = doc.to_dict()
        print(f"ID: {doc.id}")
        print(f"Type: {data.get('type')}")
        print(f"Case ID: {data.get('case_id')}")
        keys = list(data.keys())
        # Print keys but limit length
        print(f"Keys: {keys[:10]}") 
        print("-" * 20)
    
    if count == 0:
        print("Collection is EMPTY or does not exist.")

check_collection("pre_doctor_consultation_summaries")
check_collection("appointments")
