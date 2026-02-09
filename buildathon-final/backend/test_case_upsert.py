from app.core.firebase import firebase_service
import uuid
from datetime import datetime

def test_upsert():
    print("Testing Firebase Service Upsert...")
    test_id = f"test_case_{uuid.uuid4().hex[:8]}"
    print(f"Creating case with ID: {test_id}")
    
    success = firebase_service.upsert_document("cases", test_id, {
        "status": "DOCTOR_ASSIGNED",
        "created_at": datetime.utcnow().isoformat(),
        "test_run": True
    })
    
    if success:
        print("Upsert successful!")
        # Verify fetch
        case = firebase_service.get_case(test_id)
        if case:
            print("Successfully fetched created case:", case)
        else:
            print("ERROR: Upsert reported success but fetch failed!")
    else:
        print("Upsert failed!")

if __name__ == "__main__":
    if not firebase_service.db:
        print("Firebase DB not initialized (Mock Mode?). checking...")
    test_upsert()
