
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Setup Firebase
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Init Error: {e}")
        exit(1)

db = firestore.client()

def check_doctors():
    print("--- Checking Doctor Schema ---")
    docs = db.collection("doctors").limit(3).stream()
    for doc in docs:
        data = doc.to_dict()
        print(f"ID: {doc.id}")
        # Print keys to find location relevant fields
        print(f"Keys: {list(data.keys())}")
        if 'location' in data:
             print(f"Location: {data['location']}")
        if 'lat' in data:
             print(f"Lat/Lon: {data.get('lat')}, {data.get('lon')}")
        print("-" * 20)

if __name__ == "__main__":
    check_doctors()
