import firebase_admin
from firebase_admin import credentials, auth
import os
import sys
from dotenv import load_dotenv

# Load env vars
load_dotenv()

PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRED_PATH = os.path.join(PROJ_ROOT, os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json"))

def reset_password(email, new_password):
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
        
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=new_password)
        print(f"✅ Password for {email} reset to: {new_password}")
        return True
    except auth.UserNotFoundError:
        print(f"❌ User not found: {email}")
        return False
    except Exception as e:
        print(f"❌ Error resetting password for {email}: {e}")
        return False

if __name__ == "__main__":
    target_email = "shahrukh.khan@docai.in"
    target_password = "password123"
    
    print(f"Resetting password for {target_email}...")
    reset_password(target_email, target_password)
