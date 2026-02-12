import requests
import json

BASE_URL = "http://localhost:8004"
PATIENT_ID = "vZVcKFi5kC3LYw5rLjr9"
CASE_ID = "CASE-B66D20666922"

def debug_fetch_records():
    url = f"{BASE_URL}/get_records?patient_id={PATIENT_ID}&case_id={CASE_ID}"
    print(f"Fetching: {url}")
    try:
        res = requests.get(url)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            records = data.get("records", [])
            print(f"Records Found: {len(records)}")
            for r in records:
                rtype = r.get('type')
                rdata = r.get('data')
                print(f"Record Type: {rtype}")
                if isinstance(rdata, dict):
                    print(f"Data Keys: {list(rdata.keys())}")
                    if 'medicines' in rdata:
                        print(f" - Medicines Count: {len(rdata['medicines'])}")
                    if 'remarks' in rdata:
                        print(f" - Remarks: {rdata['remarks'][:50]}...")
                elif isinstance(rdata, list):
                    print("Data is a List (Unexpected)")
                else:
                    print(f"Data Type: {type(rdata)}")
                print("-" * 20)
        else:
            print("Error:", res.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_fetch_records()
