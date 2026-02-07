import firebase_admin
from firebase_admin import credentials, firestore, auth
import json
import os
import sys
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Setup Firebase
CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
print(f"DEBUG: FIREBASE_CREDENTIALS_PATH = {CRED_PATH}")

def init_firebase():
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
        print(f"✅ Connected to Firebase: {CRED_PATH}")
        return firestore.client()
    except Exception as e:
        print(f"❌ Failed to connect to Firebase: {e}")
        print(f"DEBUG: Tried reading from {CRED_PATH}")
        sys.exit(1)

def seed_doctors():
    db = init_firebase()
    
    # Read Mock Data
    try:
        with open("mock_doctors.json", "r") as f:
            doctors = json.load(f)
    except FileNotFoundError:
        print("❌ 'mock_doctors.json' not found. Run generate_mock_doctors.py first.")
        return

    print(f"🚀 Seeding {len(doctors)} Doctors to Firebase...")

    for doc in doctors:
        email = doc['email']
        password = doc['password']
        uid = None

        # 1. Create Auth User
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=doc['name']
            )
            uid = user.uid
            print(f"   [AUTH] Created: {email} ({uid})")
        except auth.EmailAlreadyExistsError:
            print(f"   [AUTH] Exists: {email}")
            # Fetch UID if exists
            user = auth.get_user_by_email(email)
            uid = user.uid
        except Exception as e:
            print(f"   [AUTH] Error {email}: {e}")
            continue


            # Randomize Shifts for Realism
            SHIFTS = [
                {"start": "08:00", "end": "14:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}, # Morning
                {"start": "09:00", "end": "17:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]},       # Standard
                {"start": "10:00", "end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]},       # Late
                {"start": "14:00", "end": "21:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}, # Evening
            ]
            import random
            assigned_shift = random.choice(SHIFTS)

            user_data = {
                "name": doc['name'],
                "email": email,
                "role": "doctor",
                "specialization": doc['specialization'],
                "certification_id": doc['certification_id'],
                "hospital_id": doc['hospital_id'],
                "location": doc['location'],
                "doctor_id": doc['doctor_id'],
                "onboarding_complete": True, 
                "is_verified": True,
                "availability": assigned_shift 
            }
            
            try:
                db.collection('users').document(uid).set(user_data, merge=True)
                print(f"   [DB]   Saved Profile: {doc['name']}")
            except Exception as e:
                print(f"   [DB]   Error saving profile: {e}")

    print("\n✅ SEEDING COMPLETE.")
    print("------------------------------------------------")
    print("You can now login as any doctor.")
    print(f"Example: {doctors[0]['email']} / {doctors[0]['password']}")
    print("------------------------------------------------")

if __name__ == "__main__":
    seed_doctors()
