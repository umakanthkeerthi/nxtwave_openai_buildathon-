import firebase_admin
from firebase_admin import credentials, firestore
import os
import uuid
import sys

# Setup Firebase (standalone script)
# Try to load credentials from env or default location
CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "config/firebase_credentials.json")

def init_firebase():
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
        print(f"✅ Connected to Firebase: {CRED_PATH}")
        return firestore.client()
    except Exception as e:
        print(f"❌ Failed to connect to Firebase: {e}")
        print("Make sure FIREBASE_CREDENTIALS_PATH is set or config/firebase_credentials.json exists.")
        sys.exit(1)

def generate_username(name):
    # logic: "Rajesh Kumar" -> "rajesh.kumar"
    # logic: "Dr. Anjali Singh" -> "anjali.singh"
    clean_name = name.lower().replace("dr.", "").replace("dr ", "").strip()
    return clean_name.replace(" ", ".")

def register_doctor(db):
    print("\n--- 🏥 ADMIN: DOCTOR RECRUITMENT TOOL ---")
    
    name = input("Enter Doctor's Name (e.g. Dr. Rajesh Kumar): ").strip()
    specialization = input("Enter Specialization (e.g. Cardiologist): ").strip()
    location = input("Enter Location (City/Area): ").strip()
    certification_id = input("Enter Certification ID: ").strip()
    
    # Generate System Fields
    username = generate_username(name)
    email = f"{username}@docai.in"
    doctor_id = f"DOC-{str(uuid.uuid4())[:8].upper()}"
    
    print(f"\nPotential Email: {email}")
    confirm = input("Confirm Registration? (y/n): ").lower()
    
    if confirm != 'y':
        print("❌ Canceled.")
        return

    # Check for duplicate email in 'doctor_invites' and 'users'
    # (Simplified check for prototype)
    doc_ref = db.collection('doctor_invites').document(email)
    if doc_ref.get().exists:
        print(f"⚠️ Error: Invite for {email} already exists!")
        return

    invite_data = {
        "name": name,
        "specialization": specialization,
        "location": location,
        "certification_id": certification_id,
        "doctor_id": doctor_id,
        "authorized_email": email,
        "username": username,
        "status": "pending", # Waiting for doctor to 'Sign Up' and set password
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    try:
        doc_ref.set(invite_data)
        print("\n✅ SUCCESS! DOCTOR INVITED.")
        print("------------------------------------------------")
        print(f"Give this Email to Doctor:  {email}")
        print(f"Doctor ID:                  {doctor_id}")
        print("------------------------------------------------")
    except Exception as e:
        print(f"❌ Database Write Error: {e}")

if __name__ == "__main__":
    db = init_firebase()
    while True:
        register_doctor(db)
        again = input("\nRegister another doctor? (y/n): ").lower()
        if again != 'y':
            print("Exiting...")
            break
