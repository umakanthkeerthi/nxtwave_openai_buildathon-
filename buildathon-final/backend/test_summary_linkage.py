import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8004"

def test_linkage():
    print("=== TESTING SUMMARY -> APPOINTMENT LINKAGE ===")
    
    # 1. Generate/Save Summary to get ID
    case_id = f"TEST-CASE-{uuid.uuid4().hex[:6]}"
    user_id = "TEST_USER_LINKAGE"
    profile_id = "TEST_PROFILE_LINKAGE"
    
    summary_payload = {
        "user_id": user_id,
        "profile_id": profile_id,
        "patient_id": profile_id,
        "case_id": case_id,
        "patient_summary": "Test Patient Summary",
        "pre_doctor_consultation_summary": {
            "assessment": {"severity": "LOW"},
            "trigger_reason": "Test Trigger",
            "history": {"symptoms": ["Test Symptom"]}
        },
        "patient_profile": {"name": "Test Linkage Patient"}
    }
    
    print(f"1. Calling /save_summary with case_id={case_id}...")
    try:
        res = requests.post(f"{BASE_URL}/save_summary", json=summary_payload)
        res.raise_for_status()
        data = res.json()
        print("   Response:", json.dumps(data, indent=2))
        
        pre_doc_id = data.get("pre_doctor_summary_id")
        if not pre_doc_id:
            print("❌ FAILED: No pre_doctor_summary_id returned!")
            return
        print(f"✅ Got Summary ID: {pre_doc_id}")
        
    except Exception as e:
        print(f"❌ Error in Save Summary: {e}")
        return

    # 2. Book Appointment with this ID
    print("\n2. Calling /book_appointment with this Summary ID...")
    
    booking_payload = {
        "session_id": case_id,
        "patient_id": profile_id,
        "user_id": user_id,
        "profile_id": profile_id,
        "doctor_id": "doc_001",
        "slot_id": None, # Mock booking
        "pre_doctor_consultation_summary_id": pre_doc_id, # [CRITICAL STEP]
        "patient_name": "Test Linkage Patient",
        "patient_age": 30,
        "patient_gender": "Male"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/book_appointment", json=booking_payload)
        res.raise_for_status()
        data = res.json()
        appt_id = data.get("appointment_id")
        print(f"✅ Appointment Booked: {appt_id}")
        
    except Exception as e:
        print(f"❌ Error in Book Appointment: {e}")
        return

    # 3. Verify in Firestore (using verify script logic or just believing the backend logs)
    # The previous verify_appointment.py prints the latest appointment.
    # Let's run that separately.
    print(f"\n✅ SETUP COMPLETE. Run 'python verify_appointment.py' to see if Appointment {appt_id} has Summary ID {pre_doc_id}")

if __name__ == "__main__":
    test_linkage()
