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
# If running from scripts folder, adjust path if needed or rely on env
if not CRED_PATH:
    # Try default relative path if running from backend root
    if os.path.exists("config/firebase_credentials.json"):
        CRED_PATH = "config/firebase_credentials.json"
    elif os.path.exists("../config/firebase_credentials.json"):
        CRED_PATH = "../config/firebase_credentials.json"

print(f"DEBUG: Using Credentials at: {CRED_PATH}")

def init_firebase():
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
        print(f"✅ Connected to Firebase.")
        return firestore.client()
    except Exception as e:
        print(f"❌ Failed to connect to Firebase: {e}")
        sys.exit(1)

def ensure_auth():
    init_firebase()
    
    # Load Mock Data
    try:
        # Check current dir or scripts dir
        if os.path.exists("mock_doctors.json"):
            path = "mock_doctors.json"
        elif os.path.exists("scripts/mock_doctors.json"):
            path = "scripts/mock_doctors.json"
        else:
            print("❌ 'mock_doctors.json' not found.")
            return

        with open(path, "r") as f:
            doctors = json.load(f)
    except Exception as e:
        print(f"❌ Error loading json: {e}")
        return

    print(f"📋 Processing {len(doctors)} doctors...")
    
    success_count = 0
    
    for doc in doctors:
        email = doc['email']
        password = "password123" # Hardcoded for all
        name = doc['name']
        
        try:
            # 1. Try to fetch user
            user = auth.get_user_by_email(email)
            print(f"   🔹 User exists: {email} (UID: {user.uid})")
            
            # 2. Update password to be sure
            auth.update_user(user.uid, password=password, display_name=name)
            print(f"      ✅ Password reset to '{password}'")
            success_count += 1
            
        except auth.UserNotFoundError:
            # 3. Create user if missing
            print(f"   🔸 Creating NEW user: {email}")
            try:
                user = auth.create_user(
                    email=email,
                    email_verified=True,
                    password=password,
                    display_name=name,
                    disabled=False
                )
                print(f"      ✅ Created! (UID: {user.uid})")
                success_count += 1
            except Exception as create_err:
                print(f"      ❌ Creation Failed: {create_err}")
                
        except Exception as e:
            print(f"   ❌ Error processing {email}: {e}")

    print("\n------------------------------------------------")
    print(f"🎉 Completed. {success_count}/{len(doctors)} accounts ready.")
    print("------------------------------------------------")

if __name__ == "__main__":
    ensure_auth()
