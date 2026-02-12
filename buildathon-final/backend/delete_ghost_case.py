
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred_path = "serviceAccountKey.json"
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Init Error: {e}")

db = firestore.client()

print("--- Scanning for Ghost Cases (Brute Force) ---")
count = 0

# 1. Query ALL Appointments
print("Scanning Appointments...")
try:
    apts = db.collection("appointments").limit(200).stream()
    for doc in apts:
        data = doc.to_dict()
        pat_name = data.get("patient_name") or data.get("patient_snapshot", {}).get("name") or "Unknown"
        
        # print(f"Checking Appt: {doc.id} | Name={pat_name}")
        
        if "spider" in pat_name.lower() or "simulated" in pat_name.lower() or "new emergency" in pat_name.lower():
            print(f"FOUND IN APPOINTMENTS: {doc.id} | Name={pat_name}")
            db.collection("appointments").document(doc.id).delete()
            print(f" -> DELETED {doc.id}")
            count += 1
except Exception as e:
    print(f"Error scanning appointments: {e}")

# 2. Query Medical Records
print("Scanning Medical Records...")
try:
    recs = db.collection("medical_records").limit(200).stream()
    for doc in recs:
        data = doc.to_dict()
        # Check nested structure
        pat_name = data.get("data", {}).get("patient_profile", {}).get("name") or "Unknown"
        
        # print(f"Checking Record: {doc.id} | Name={pat_name}")
        
        if "spider" in pat_name.lower():
             print(f"FOUND IN MEDICAL_RECORDS: {doc.id} | Name={pat_name}")
             db.collection("medical_records").document(doc.id).delete()
             print(f" -> DELETED {doc.id}")
             count += 1
except Exception as e:
    print(f"Error scanning medical records: {e}")

print(f"Total Deleted: {count}")
