
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Initialize Firebase
if not firebase_admin._apps:
    # Try multiple paths
    possible_paths = [
        os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase_credentials.json"),
        "firebase_credentials.json",
        "../firebase_credentials.json",
        "c:\\buildathon-final-one\\buildathon-final\\backend\\firebase_credentials.json"
    ]
    
    cred_path = None
    for p in possible_paths:
        if os.path.exists(p):
            cred_path = p
            break
            
    if cred_path:
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase initialized with {cred_path}")
        except Exception as e:
            print(f"Init Error: {e}")
            exit(1)
    else:
        print(f"No credentials found. CWD: {os.getcwd()}")
        print("Files in CWD:", os.listdir("."))
        exit(1)

db = firestore.client()

CASE_ID = "CASE-093471"
PATIENT_ID = "JXajgduEvDMN5yZZ0xh9FJdI9Bt2"

print(f"--- INSPECTING CASE: {CASE_ID} ---")

# 1. Check Appointment
print("\n[Appointment]")
appt_query = db.collection("appointments").where("case_id", "==", CASE_ID).stream()
appts = list(appt_query)
if appts:
    for a in appts:
        print(json.dumps(a.to_dict(), indent=2, default=str))
else:
    print("No appointment found for this case.")

# 2. Check Medical Records (Summaries)
print("\n[Medical Records / Summaries]")
# Check AI Summaries collection
sums = db.collection("case_ai_patient_summaries").where("case_id", "==", CASE_ID).stream()
sum_list = list(sums)
print(f"Found {len(sum_list)} summaries in 'case_ai_patient_summaries'")
for s in sum_list:
    print(json.dumps(s.to_dict(), indent=2, default=str))

# Also check generic medical_records if any
recs = db.collection("medical_records").where("case_id", "==", CASE_ID).stream()
rec_list = list(recs)
print(f"Found {len(rec_list)} records in 'medical_records'")

# 3. Check Patient/User Profile
print(f"\n[Patient Profile: {PATIENT_ID}]")
# Check 'users' collection
user_doc = db.collection("users").document(PATIENT_ID).get()
if user_doc.exists:
    print("User Doc:", json.dumps(user_doc.to_dict(), indent=2, default=str))
else:
    print("User Doc not found in 'users'")

# Check 'profiles' collection (maybe ID is a profile ID?)
profile_doc = db.collection("profiles").document(PATIENT_ID).get()
if profile_doc.exists:
    print("Profile Doc:", json.dumps(profile_doc.to_dict(), indent=2, default=str))
else:
    print("Profile Doc not found in 'profiles'")
