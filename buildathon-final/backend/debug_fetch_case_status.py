import requests
import json

BASE_URL = "http://localhost:8004"
CASE_ID = "CASE-B66D20666922"

def debug_fetch_case_status():
    url = f"{BASE_URL}/get_case?case_id={CASE_ID}"
    print(f"Fetching: {url}")
    try:
        res = requests.get(url)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("Case Details:")
            print(json.dumps(data, indent=2))
        else:
            print("Error:", res.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_fetch_case_status()
