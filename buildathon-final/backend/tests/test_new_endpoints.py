import requests
import json
import time
import sys
import os

BASE_URL = "http://localhost:8006"

def test_get_appointments():
    print("\n[1] Testing GET /get_appointments...")
    try:
        resp = requests.get(f"{BASE_URL}/get_appointments?doctor_id=doc_mock_001")
        print(f"Status: {resp.status_code}")
        print(f"Data: {resp.json()}")
        
        # resp2 = requests.get(f"{BASE_URL}/get_appointments?patient_id=PAT_001")
        # print(f"Status (Patient): {resp2.status_code}")
    except Exception as e:
        print(f"FAILED: {e}")

def test_get_patients():
    print("\n[2] Testing GET /get_patients...")
    try:
        resp = requests.get(f"{BASE_URL}/get_patients?doctor_id=doc_mock_001")
        print(f"Status: {resp.status_code}")
        print(f"Data: {resp.json()}")
    except Exception as e:
        print(f"FAILED: {e}")

def test_get_emergencies():
    print("\n[3] Testing GET /get_emergencies...")
    try:
        resp = requests.get(f"{BASE_URL}/get_emergencies")
        print(f"Status: {resp.status_code}")
        print(f"Data count: {len(resp.json())}")
    except Exception as e:
        print(f"FAILED: {e}")

# Import simulate steps to populate data
# We need to hack the BASE_URL in simulate_flow or just copy the logic. 
# Importing directly executes the module functions but they use their own BASE_URL variable unless we change it.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import tests.simulate_flow_8005 as sim
sim.BASE_URL = BASE_URL # Override port

if __name__ == "__main__":
    print(f"=== POPULATING DATA on {BASE_URL} ===")
    sim.step_1_create_summary()
    sim.step_2_book_appointment()
    
    print("\n=== TESTING NEW ENDPOINTS ===")
    test_get_appointments()
    test_get_patients()
    test_get_emergencies()
