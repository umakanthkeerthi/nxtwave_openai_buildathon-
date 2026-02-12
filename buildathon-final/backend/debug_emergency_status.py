from app.core.firebase import FirebaseService
import json

firebase_service = FirebaseService()
print("Initialized Firebase Service")

print("\n--- Fetching Emergencies (Raw Check) ---")
# Call get_emergencies but inspect what it returns without the filter if possible, 
# or just call it and see what is active.
# Since get_emergencies filters inside, let's call get_appointments directly for recent ones
# or rely on what get_emergencies returns to see if "CONSULTATION_ENDED" slipped through.

emergencies = firebase_service.get_emergencies()
print(f"Found {len(emergencies)} active emergencies via get_emergencies()")

for e in emergencies:
    print(f"ID: {e.get('id')} | Status: {e.get('status')} | Patient: {e.get('patient_id')}")

print("\n--- Checking All Appointments (Last 10) ---")
# Check if the status is actually updated in the DB
apts = firebase_service.get_appointments()
# Sort by created_at desc if possible, or just print last few
print(f"Found {len(apts)} total appointments")
for a in apts[-10:]:
    print(f"ID: {a.get('id')} | Status: {a.get('status')} | Case: {a.get('case_id')}")
