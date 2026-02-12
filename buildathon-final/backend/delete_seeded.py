
import os
import sys
from dotenv import load_dotenv

# Load .env explicitly
load_dotenv()

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.core.firebase import firebase_service

def delete_seeded_appointments():
    print("Searching for seeded appointments to delete...", flush=True)
    
    # query by patient_id
    patient_ids = ["P-101", "P-104"]
    
    deleted_count = 0
    
    for pid in patient_ids:
        try:
            query = firebase_service.db.collection("appointments").where("patient_id", "==", pid)
            docs = query.stream()
            
            for doc in docs:
                print(f"Deleting appointment {doc.id} for patient {pid}...", flush=True)
                doc.reference.delete()
                deleted_count += 1
                
        except Exception as e:
            print(f"Error querying/deleting for {pid}: {e}", flush=True)

    print(f"Deletion Complete. Removed {deleted_count} records.", flush=True)

if __name__ == "__main__":
    delete_seeded_appointments()
