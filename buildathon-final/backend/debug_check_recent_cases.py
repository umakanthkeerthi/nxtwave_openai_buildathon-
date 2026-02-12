
import firebase_admin
from firebase_admin import credentials, firestore
import json
from datetime import datetime

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- FETCHING 5 MOST RECENT CASES ---")
try:
    # Order by 'created_at' descending if available, else try 'generated_at'
    # Note: 'created_at' is the standard field we added.
    query = db.collection("cases").order_by("created_at", direction=firestore.Query.DESCENDING).limit(5)
    docs = query.stream()
    
    found = False
    for doc in docs:
        found = True
        data = doc.to_dict()
        print(f"ID: {data.get('case_id')} | Created: {data.get('created_at')} | Status: {data.get('status')}")
        
    if not found:
        print("No cases found with 'created_at'. Dumping any 5 cases...")
        docs = db.collection("cases").limit(5).stream()
        for doc in docs:
             data = doc.to_dict()
             print(f"ID: {data.get('case_id')} | Created: {data.get('created_at')} | Status: {data.get('status')}")

except Exception as e:
    print(f"Error: {e}")
