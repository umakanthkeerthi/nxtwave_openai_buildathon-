import firebase_admin
from firebase_admin import credentials, firestore
import os

print("Initializing Firebase...")
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# The Profile ID we saw in verify_appointment.py
TARGET_PROFILE_ID = "vZVcKFi5kC3LYw5rLjr9" 

print(f"Testing query for profile_id: {TARGET_PROFILE_ID}")

try:
    docs = db.collection("appointments").where("profile_id", "==", TARGET_PROFILE_ID).stream()
    found = []
    for doc in docs:
        found.append(doc.id)
    
    print(f"Found {len(found)} appointments: {found}")

    if len(found) == 0:
        print("QUERY FAILED to find the appointment, even though we know it exists.")
        print("Checking data types...")
        # Get the doc directly to check the field type
        # We need an appointment ID. Let's get the latest one again.
        latest = db.collection("appointments").order_by("created_at", direction=firestore.Query.DESCENDING).limit(1).get()
        if latest:
            doc = latest[0]
            data = doc.to_dict()
            pid = data.get("profile_id")
            print(f"Latest Doc ID: {doc.id}")
            print(f"Actual stored profile_id: '{pid}' (Type: {type(pid)})")
            print(f"Target profile_id:        '{TARGET_PROFILE_ID}' (Type: {type(TARGET_PROFILE_ID)})")
            
            if pid == TARGET_PROFILE_ID:
                print("IDs MATCH exactly.")
            else:
                print("IDs DO NOT MATCH.")
                
            # Check for whitespace
            print(f"Stored repr: {repr(pid)}")
            print(f"Target repr: {repr(TARGET_PROFILE_ID)}")

except Exception as e:
    print(f"Error: {e}")
