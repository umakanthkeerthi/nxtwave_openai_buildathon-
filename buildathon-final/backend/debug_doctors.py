
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Initialize Firebase
if not firebase_admin._apps:
    try:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase_credentials.json") # Fallback to local
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Initialized")
        else:
             print(f"Error: Credentials not found at {cred_path}")
             exit(1)
    except Exception as e:
        print(f"Init Error: {e}")

db = firestore.client()

print("\n--- DOCTORS ---")
docs = db.collection("doctors").stream()
for d in docs:
    data = d.to_dict()
    print(f"ID: {d.id} | Name: {data.get('name')} | Email: {data.get('email', 'N/A')}")

print("\n--- USERS (Sample) ---")
# List users by email if possible, or just raw
try:
    user = auth.get_user_by_email("shahrukh.khan@docai.in")
    print(f"User: shahrukh.khan@docai.in | UID: {user.uid}")
    
    # Check users/{uid}
    user_doc = db.collection("users").document(user.uid).get()
    if user_doc.exists:
        print(f"Firestore Record: {user_doc.to_dict()}")
    else:
        print("Firestore Record: Not Found")

except Exception as e:
    print(f"User Lookup Error: {e}")
