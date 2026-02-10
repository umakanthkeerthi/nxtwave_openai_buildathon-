
import firebase_admin
from firebase_admin import credentials, firestore
import os

# --- Configuration ---
# Collections to PRESERVE (Acceptlist)
PRESERVED_COLLECTIONS = ["users", "profiles", "doctors"]

def init_firebase():
    """Initializes Firebase Admin SDK"""
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    
    if not os.path.exists(cred_path):
        # Try going up one level if running from scripts dir
        if os.path.exists(f"../{cred_path}"):
            cred_path = f"../{cred_path}"
    
    if os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print(f"SUCCESS: Firebase initialized with {cred_path}")
            return firestore.client()
        except Exception as e:
            print(f"ERROR: Failed to initialize Firebase: {e}")
            return None
    else:
        print(f"ERROR: Credentials key not found at {cred_path}")
        return None

def delete_collection(db, collection_ref, batch_size=400):
    """Recursively deletes a collection in batches."""
    docs = collection_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f"Deleting doc {doc.id} => {doc.reference.path}")
        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return deleted + delete_collection(db, collection_ref, batch_size)
    return deleted

def main():
    print("--- DOC AI DATABASE CLEANUP ---")
    print("WARNING: This will delete all content EXCEPT:", PRESERVED_COLLECTIONS)
    
    db = init_firebase()
    if not db:
        return

    # 1. List all collections
    collections = db.collections()
    
    for collection in collections:
        if collection.id in PRESERVED_COLLECTIONS:
            print(f"Skipping preserved collection: {collection.id}")
            continue
            
        print(f"Cleaning collection: {collection.id}...")
        count = delete_collection(db, collection)
        print(f"Deleted {count} documents from {collection.id}")

    print("\n--- CLEANUP COMPLETE ---")

if __name__ == "__main__":
    main()
