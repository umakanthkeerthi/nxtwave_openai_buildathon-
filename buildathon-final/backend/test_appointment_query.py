import requests

# Test the exact same query the frontend is making
patient_id = "JXajgduEvDMN5yZZ0xh9FJdI9Bt2"
url = f"http://localhost:8003/get_appointments?patient_id={patient_id}"

print(f"Testing URL: {url}")
response = requests.get(url)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
