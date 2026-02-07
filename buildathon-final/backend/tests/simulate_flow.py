import requests
import json
import uuid
import time

BASE_URL = "http://localhost:8003"
PATIENT_ID = f"test_patient_{int(time.time())}"
DOCTOR_ID = "doc_mock_001"

def step_1_create_summary():
    print(f"\n[1] Simulating Chat Summary Generation for ({PATIENT_ID})...")
    
    # Payload matching /save_summary endpoint
    payload = {
        "patient_id": PATIENT_ID,
        "patient_profile": {"name": "Test User", "age": 30, "gender": "Male"},
        "patient_summary": {
            "triage_level": "Green",
            "symptoms_reported": ["Headache"],
            "clinical_guidelines": "Rest and hydration."
        },
        "pre_doctor_consultation_summary": {
            "trigger_reason": "Persistent Headache",
            "assessment": {
                "severity": "GREEN",
                "likely_diagnosis": "Tension Headache"
            },
            "history": {"duration": "2 days"}
        }
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/save_summary", json=payload)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        return resp.json().get("saved_record_id")
    except Exception as e:
        print(f"FAILED: {e}")
        return None

def step_2_book_appointment():
    print(f"\n[2] Booking Appointment...")
    
    payload = {
        "patient_id": PATIENT_ID,
        "doctor_id": DOCTOR_ID,
        "patient_name": "Test User",
        "patient_age": "30",
        "patient_gender": "Male",
        "consultation_mode": "VIDEO",
        "appointment_time": "2026-02-08T10:00:00Z",
        "triage_decision": "GREEN"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/book_appointment", json=payload)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        return resp.json().get("appointment_id")
    except Exception as e:
        print(f"FAILED: {e}")
        return None

def step_3_doctor_submit_prescription():
    print(f"\n[3] Doctor Submitting Prescription...")
    
    payload = {
        "patient_id": PATIENT_ID,
        "type": "PRESCRIPTION",
        "data": {
            "remarks": "Patient advised rest.",
            "medicines": [
                {"name": "Paracetamol", "dosage": "500mg", "frequency": "1-0-1", "duration": "3 days"}
            ],
            "timestamp": "2026-02-07T12:00:00Z"
        }
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/upload_record", json=payload)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        return resp.json().get("record_id")
    except Exception as e:
        print(f"FAILED: {e}")
        return None

def step_4_verify_records():
    print(f"\n[4] Verifying Medical Records for Patient...")
    
    try:
        resp = requests.get(f"{BASE_URL}/get_records?patient_id={PATIENT_ID}")
        records = resp.json().get("records", [])
        print(f"Found {len(records)} records.")
        
        types_found = [r.get("type") for r in records]
        print(f"Record Types: {types_found}")
        
        if "PRESCRIPTION" in types_found and "summary" in types_found:
             print("\n✅ SUCCESS: Summary and Prescription both found!")
        elif "PRESCRIPTION" in types_found and "AI_SUMMARY_DOCTOR" in types_found:
             print("\n✅ SUCCESS: Summary (AI_SUMMARY_DOCTOR) and Prescription both found!")
        else:
             print("\n❌ FAILURE: Missing expected records.")
             
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    print("=== STARTING END-TO-END VERIFICATION ===")
    step_1_create_summary()
    step_2_book_appointment()
    step_3_doctor_submit_prescription()
    step_4_verify_records()
    print("\n=== VERIFICATION COMPLETE ===")
