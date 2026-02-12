
import requests
import json

try:
    url = "http://localhost:8004/get_patients?doctor_id=doc_mock_001"
    print(f"Fetching from: {url}", flush=True)
    response = requests.get(url)
    print(f"Status Code: {response.status_code}", flush=True)
    if response.status_code == 200:
        data = response.json()
        print(f"Data Received ({len(data)} items):")
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {response.text}", flush=True)
except Exception as e:
    print(f"Request Failed: {e}", flush=True)
