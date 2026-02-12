import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

email = "shahrukh.khan@docai.in"

print(f"--- Investigating User: {email} ---")

# 1. Get User Doc
users = db.collection("users").where("email", "==", email).stream()
user_doc = None
for u in users:
    user_doc = u
    break

if not user_doc:
    print("ERROR: User not found!")
else:
    u_data = user_doc.to_dict()
    print(f"User UID: {user_doc.id}")
    print(f"User Data: {u_data}")
    
    doctor_id = u_data.get("doctor_id")
    if not doctor_id:
        print("ERROR: No 'doctor_id' field in user document!")
    else:
        print(f"Mapped Doctor ID: {doctor_id}")
        
        # 2. Get Doctor Doc
        doc_ref = db.collection("doctors").document(doctor_id)
        doc_snap = doc_ref.get()
        
        if doc_snap.exists:
            d_data = doc_snap.to_dict()
            print(f"--- Doctor Document ({doctor_id}) ---")
            print(f"Name: {d_data.get('name')}")
            print(f"Email: {d_data.get('email')}")
            
            if d_data.get("name") != "Dr. Shahrukh Khan":
                print(f"MISMATCH DETECTED! User {email} is mapped to {d_data.get('name')}")
        else:
            print("ERROR: Doctor document not found!")
