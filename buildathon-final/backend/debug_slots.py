
import firebase_admin
from firebase_admin import credentials, firestore
import os


def list_slots():
    cred_path = "serviceAccountKey.json"
    if not os.path.exists(cred_path):
        print(f"Error: {cred_path} not found")
        return

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    print("--- Counting Slots ---")
    docs = db.collection("doctor_slots").stream()
    count = len(list(docs))
    print(f"Total Slots: {count}")


if __name__ == "__main__":
    list_slots()
