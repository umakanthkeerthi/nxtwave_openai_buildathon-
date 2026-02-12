
import requests
import json

try:
    resp = requests.get("http://localhost:8004/get_emergencies")
    if resp.status_code == 200:
        data = resp.json()
        print(f"API Returned {len(data)} items")
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"Request Failed: {e}")
