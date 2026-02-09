import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- Syncing Users Collection ---")

# 1. Get all Doctors
doctors = db.collection("doctors").stream()
doctor_map = {} # email -> doctor_data
for doc in doctors:
    data = doc.to_dict()
    email = data.get("email")
    if email:
        doctor_map[email] = {
            "doctor_id": doc.id,
            "name": data.get("name"),
            "role": "doctor"
        }

print(f"Found {len(doctor_map)} doctors with emails.")

# 2. Iterate through Auth Users and Link
# Note: In a large app, listing all users might be heavy, but fine for dev/hackathon
page = auth.list_users()
count = 0
while page:
    for user in page.users:
        if user.email in doctor_map:
            doc_data = doctor_map[user.email]
            
            # Create/Update user doc
            user_ref = db.collection("users").document(user.uid)
            user_ref.set({
                "email": user.email,
                "role": "doctor",
                "doctor_id": doc_data["doctor_id"],
                "name": doc_data["name"]
            }, merge=True)
            
            print(f"Linked {user.email} (UID: {user.uid}) -> Doctor ID: {doc_data['doctor_id']}")
            count += 1
            
    # Get next page
    page = page.get_next_page()

print(f"Successfully linked {count} users.")
