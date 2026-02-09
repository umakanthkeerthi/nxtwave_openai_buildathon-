import firebase_admin
from firebase_admin import credentials, firestore, auth
import json
import os
import sys
import uuid
from datetime import datetime, timedelta
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

def seed_v1_database():
    db = init_firebase()
    
    # Read Mock Data
    try:
        with open("mock_doctors.json", "r") as f:
            doctors_data = json.load(f)
    except FileNotFoundError:
        print("❌ 'mock_doctors.json' not found.")
        return

    print(f"🚀 Seeding V1.0 Database with {len(doctors_data)} Doctors...")

    for doc in doctors_data:
        # 1. Create/Update Doctor in 'doctors' collection
        doctor_id = doc['doctor_id']
        email = doc['email']
        
        # Try to find existing Auth User to link UID
        uid = None
        try:
            user = auth.get_user_by_email(email)
            uid = user.uid
        except:
             # Create if missing (simplified)
             try:
                 user = auth.create_user(email=email, password=doc.get('password', 'password123'))
                 uid = user.uid
             except:
                 pass
        
        if uid:
             # 1.5 Create User Doc (Crucial for AuthContext role check)
             try:
                 db.collection('users').document(uid).set({
                     "email": email,
                     "role": "doctor",
                     "doctor_id": doctor_id,
                     "onboarding_completed": True,
                     "created_at": datetime.utcnow().isoformat()
                 }, merge=True)
                 print(f"   [USER] Role set for: {email}")
             except Exception as e:
                 print(f"   [USER] Error: {e}")
        
        doctor_record = {
            "doctor_id": doctor_id,
            "linked_uid": uid,
            "name": doc['name'],
            "email": email,
            "specialization": doc['specialization'],
            "hospital_id": doc['hospital_id'],
            "location": doc.get('location', {}),
            "verified": True,
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            db.collection('doctors').document(doctor_id).set(doctor_record)
            print(f"   [DOCTOR] Saved: {doc['name']}")
        except Exception as e:
            print(f"   [DOCTOR] Error: {e}")

        # 2. Generate Slots (Today & Tomorrow)
        # Create 5 slots for each day
        today = datetime.utcnow().date()
        for day_offset in range(2): # Today and Tomorrow
            current_day = today + timedelta(days=day_offset)
            base_time = datetime(current_day.year, current_day.month, current_day.day, 9, 0, 0) # Start 9 AM
            
            for i in range(5): # 5 slots
                slot_start = base_time + timedelta(hours=i)
                slot_end = slot_start + timedelta(minutes=30)
                
                # Check redundancy logic could go here, but for seed we overwrite
                slot_id = f"slot_{doctor_id}_{day_offset}_{i}"
                
                slot_record = {
                    "slot_id": slot_id,
                    "doctor_id": doctor_id,
                    "start_time": slot_start.isoformat(),
                    "end_time": slot_end.isoformat(),
                    "status": "AVAILABLE",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                try:
                    db.collection('doctor_slots').document(slot_id).set(slot_record)
                    # print(f"       [SLOT] Created: {slot_start.strftime('%H:%M')}") 
                except Exception as e:
                     print(f"       [SLOT] Error: {e}")
            
            print(f"   [SLOTS] Generated 5 slots for Day +{day_offset}")

    print("\n✅ V1.0 SEEDING COMPLETE.")

if __name__ == "__main__":
    seed_v1_database()
