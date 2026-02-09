import requests
import json
import uuid
from datetime import datetime
import sys

# Get Base URL from args
BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8003"
DOCTOR_ID = "doc_test_e2e"
PATIENT_ID = "pat_test_e2e"
SESSION_ID = f"sess_{uuid.uuid4().hex[:8]}"

def run_test():
    print(f"Starting E2E Test on {BASE_URL}...")

    # 1. Create a Slot (Doctor)
    print("\n[1] Creating Doctor Slot...")
    slot_date = datetime.now().strftime("%Y-%m-%d")
    slot_payload = {
        "doctor_id": DOCTOR_ID,
        "date": slot_date,
        "start_time": "09:00",
        "end_time": "10:00",
        "status": "AVAILABLE"
    }

    try:
        resp = requests.post(f"{BASE_URL}/create_slot", json=slot_payload)
        resp.raise_for_status()
        slot_data = resp.json()
        slot_id = slot_data.get("slot_id")
        print(f"✅ Slot Created: {slot_id}")
    except Exception as e:
        print(f"❌ Slot Creation Failed: {e}")
        return

    # 2. Simulate Chat (Patient)
    print("\n[2] Simulating Patient Chat...")
    chat_payload = {
        "message": "I have severe chest pain and dizziness.",
        "session_id": SESSION_ID,
        "target_language": "English"
    }
    try:
        resp = requests.post(f"{BASE_URL}/chat", json=chat_payload)
        resp.raise_for_status()
        chat_data = resp.json()
        print(f"✅ Chat Response Received: {chat_data.get('response')[:50]}...")
    except Exception as e:
        print(f"❌ Chat Failed: {e}")
        return

    # 3. Generate Summary (Patient)
    print("\n[3] Generating Summary...")
    history = [{"sender": "user", "text": "I have severe chest pain and dizziness. It started 2 hours ago."}]
    summary_payload = {
        "history": history,
        "target_language": "English"
    }
    try:
        resp = requests.post(f"{BASE_URL}/generate_summary", json=summary_payload)
        resp.raise_for_status()
        summary_data = resp.json()
        
        # Extract Triage
        triage = summary_data.get("patient_summary", {}).get("triage_level", "UNKNOWN")
        print(f"✅ Summary Generated. Triage Level: {triage}")
        
    except Exception as e:
        print(f"❌ Summary Generation Failed: {e}")
        return

    # 4. Book Appointment (Patient)
    print("\n[4] Booking Appointment...")
    booking_payload = {
        "patient_id": PATIENT_ID,
        "profile_id": PATIENT_ID, 
        "doctor_id": DOCTOR_ID,
        "slot_id": slot_id,
        "session_id": SESSION_ID,
        "triage_decision": triage,
        "appointment_time": f"{slot_date} 09:00",
        "consultation_mode": "video",
        "patient_name": "Test Patient E2E",
        "patient_age": 45,
        "patient_gender": "Male"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/book_appointment", json=booking_payload)
        resp.raise_for_status()
        booking_data = resp.json()
        print(f"✅ Appointment Booked: {booking_data}")
    except Exception as e:
        print(f"❌ Booking Failed: {e}")
        return # If booking fails, verify test stops

    # 5. Verify Appointment (Doctor Perspective)
    print("\n[5] Verifying Appointment as Doctor...")
    try:
        resp = requests.get(f"{BASE_URL}/get_appointments?doctor_id={DOCTOR_ID}")
        resp.raise_for_status()
        appointments = resp.json()
        
        # Check if our booking exists
        found = False
        for apt in appointments:
            if apt.get("patient_id") == PATIENT_ID:
                print(f"✅ Found Appointment for {apt.get('patient_name')}")
                found = True
                break
        
        if not found:
            print("❌ Appointment NOT found in Doctor's list.")
            print(f"Expected Patient ID: {PATIENT_ID}")
            print(f"Returned List: {appointments}")
            
    except Exception as e:
        print(f"❌ Verification Failed: {e}")

if __name__ == "__main__":
    run_test()
