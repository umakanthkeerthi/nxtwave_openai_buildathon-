import requests
import json
import uuid

url = "http://localhost:8004/upload_record"

payload = {
  "patient_id": "P-101",
  "case_id": "CASE-DEBUG-001", 
  "type": "PRESCRIPTION",
  "data": {
    "medicines": [
      {
        "name": "Paracetamol",
        "dosage": "500mg",
        "frequency": "2 times a day",
        "duration": "3 days",
        "instruction": "After food",
        "type": "Tablet",
        "timing": {
          "morning": True,
          "noon": False,
          "evening": False,
          "night": True
        }
      }
    ],
    "remarks": "Patient has mild fever.",
    "advice": "Drink plenty of water.",
    "timestamp": "2026-02-11T10:00:00Z"
  }
}

try:
    print("Sending POST request to /upload_record...")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

except Exception as e:
    print(f"Request failed: {e}")
