import urllib.request
import json
import urllib.error

BASE_URL = "http://localhost:8004"

def test_log_medication():
    print("Testing /log_medication...")
    payload = {
        "profile_id": "test_patient",
        "medicine_name": "TestMeds",
        "slot": "morning",
        "date": "2026-02-14",
        "status": "TAKEN",
        "prescription_id": "rx_123"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/log_medication", data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as res:
            print(f"Status: {res.status}")
            print(f"Response: {res.read().decode('utf-8')}")
            if res.status == 200:
                return True
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")
    return False

def test_get_medication_logs():
    print("\nTesting /get_medication_logs...")
    try:
        url = f"{BASE_URL}/get_medication_logs?profile_id=test_patient&date=2026-02-14"
        with urllib.request.urlopen(url) as res:
            print(f"Status: {res.status}")
            body = res.read().decode('utf-8')
            print(f"Response: {body}")
            
            data = json.loads(body)
            logs = data.get("logs", [])
            found = any(l.get("medicine_name") == "TestMeds" for l in logs)
            if found:
                print("SUCCESS: Log entry found!")
                return True
            else:
                print("FAILURE: Log entry not found.")
                
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} {e.reason}")
    except Exception as e:
        print(f"Error: {e}")
    return False

if __name__ == "__main__":
    if test_log_medication() and test_get_medication_logs():
        print("\nALL TESTS PASSED")
    else:
        print("\nTESTS FAILED")
