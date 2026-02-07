from app.core.firebase import firebase_service
import uuid

def test_firebase():
    print("Testing Firebase Service...")
    record_id = str(uuid.uuid4())
    data = {"test": "data", "id": record_id}
    
    try:
        saved_id = firebase_service.save_record("test_collection", data)
        print(f"Saved Record ID: {saved_id}")
        
        if saved_id:
            records = firebase_service.get_records("test_collection")
            print(f"Fetched {len(records)} records.")
            return True
        else:
            print("Failed to save.")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_firebase()
