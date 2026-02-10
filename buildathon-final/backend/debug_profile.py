
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

def inspect_user_profile(email):
    cred_path = "serviceAccountKey.json"
    if not os.path.exists(cred_path):
        print(f"Error: {cred_path} not found")
        return

    # Init
    try:
        app = firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    print(f"--- Inspecting User: {email} ---")
    
    # 1. Find User by Email (Auth is separate, we need to check 'users' collection or list users if possible)
    # Since we can't easily query Auth by email with Admin SDK without listing all, 
    # let's try to query 'users' collection if email is stored there.
    
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email)
    docs = query.stream()
    
    user_uid = None
    user_found = False
    
    for doc in docs:
        user_found = True
        user_uid = doc.id
        print(f"Found User ID: {user_uid}")
        print(f"User Data: {doc.to_dict()}")
        break
    

    if not user_found:
        print("User not found in 'users' collection by email. Searching all profiles for name 'Baba'...")
        
        profiles_ref = db.collection("profiles")
        # List first 20 profiles to manually check
        docs = profiles_ref.limit(20).stream()
        for doc in docs:
            data = doc.to_dict()
            print(f"Profile ID: {doc.id} | Name: {data.get('fullName')} | Owner: {data.get('owner_uid')}")
            print(json.dumps(data, indent=2, default=str))
        return

if __name__ == "__main__":
    inspect_user_profile("babasai2005lithif@gmail.com")
