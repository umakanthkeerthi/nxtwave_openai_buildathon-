import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- Searching for Dr. Shahrukh Khan ---")

doctors = db.collection("doctors").where("name", "==", "Dr. Shahrukh Khan").stream()

found_doc = None
for doc in doctors:
    found_doc = doc
    print(f"FOUND: {doc.id} => {doc.to_dict().get('name')}")

if found_doc:
    correct_doctor_id = found_doc.id
    target_user_email = "shahrukh.khan@docai.in"
    
    print(f"\nUpdating user '{target_user_email}' to point to doctor_id '{correct_doctor_id}'...")
    
    users = db.collection("users").where("email", "==", target_user_email).stream()
    for user in users:
        user.reference.update({"doctor_id": correct_doctor_id})
        print(f"SUCCESS: Updated user {user.id}")
        
else:
    print("ERROR: Dr. Shahrukh Khan not found in 'doctors' collection. You may need to create him.")
