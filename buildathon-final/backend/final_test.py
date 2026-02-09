import requests
import json

# Test with the exact patient_id
patient_id = "JXajgduEvDMN5yZZ0xh9FJdI9Bt2"
url = f"http://localhost:8003/get_appointments?patient_id={patient_id}"

print(f"Testing: {url}")
response = requests.get(url)
print(f"Status: {response.status_code}")
print(f"Headers: {dict(response.headers)}")
print(f"Body length: {len(response.text)}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
