
import firebase_admin
from firebase_admin import credentials, firestore

# Setup Firebase
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Init Error: {e}")
        exit(1)

db = firestore.client()

def update_doctor_locations():
    print("--- Updating Doctor Locations ---")
    
    # Target Coordinates (Bangalore, matching frontend demo)
    BANGALORE_COORDS = {
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    
    docs = db.collection("doctors").stream()
    count = 0
    for doc in docs:
        try:
            doc_ref = db.collection("doctors").document(doc.id)
            doc_ref.update(BANGALORE_COORDS)
            print(f"Updated Doctor {doc.id} with {BANGALORE_COORDS}")
            count += 1
        except Exception as e:
            print(f"Error updating {doc.id}: {e}")
            
    print(f"Total Updated: {count}")

if __name__ == "__main__":
    update_doctor_locations()
