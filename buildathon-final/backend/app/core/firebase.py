import os
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("WARNING: firebase-admin not installed.")

class FirebaseService:
    def __init__(self):
        self.db = None
        self.mock_mode = True
        
        # Check for credentials
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        
        if FIREBASE_AVAILABLE and cred_path and os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.mock_mode = False
                print("SUCCESS: Firebase initialized in LIVE mode.")
            except Exception as e:
                print(f"ERROR: Firebase init failed: {e}. Switching to MOCK mode.")
        else:
            print("INFO: No Firebase credentials found. Running in MOCK mode.")

    def save_record(self, collection, data):
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Saving to '{collection}': {data}")
            return "mock_id_123"
        else:
            # Real implementation
            try:
                doc_ref = self.db.collection(collection).add(data)
                return doc_ref[1].id
            except Exception as e:
                print(f"Firebase Error: {e}")
                return None

    def get_records(self, collection, patient_id=None):
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching from '{collection}'.")
            return []
        else:
            try:
                query = self.db.collection(collection)
                if patient_id:
                    query = query.where("patient_id", "==", patient_id)
                docs = query.stream()
                return [{**doc.to_dict(), "id": doc.id} for doc in docs]
            except Exception as e:
                print(f"Firebase Fetch Error: {e}")
                return []

    def get_appointments(self, doctor_id=None, patient_id=None):
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching appointments for doc={doctor_id} pat={patient_id}")
            return []
        else:
            try:
                query = self.db.collection("appointments")
                if doctor_id:
                    query = query.where("doctor_id", "==", doctor_id)
                if patient_id:
                    query = query.where("patient_id", "==", patient_id)
                docs = query.stream()
                return [{**doc.to_dict(), "id": doc.id} for doc in docs]
            except Exception as e:
                print(f"Firebase Appointment Error: {e}")
                return []

    def get_patients(self, doctor_id):
        # In a real app, this might be a separate relationship collection.
        # For now, we derive it from appointments to find unique patients.
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching patients for doc={doctor_id}")
            return []
        else:
            try:
                # Query appointments for this doctor to get unique patient IDs
                query = self.db.collection("appointments").where("doctor_id", "==", doctor_id)
                docs = query.stream()
                
                unique_patients = {}
                for doc in docs:
                    data = doc.to_dict()
                    pid = data.get("patient_id")
                    if pid and pid not in unique_patients:
                        # Use the snapshot if available, otherwise just ID
                        unique_patients[pid] = data.get("patient_snapshot", {"name": "Unknown", "age": "?", "gender": "?"})
                        unique_patients[pid]["id"] = pid
                
                return list(unique_patients.values())
            except Exception as e:
                print(f"Firebase Patient List Error: {e}")
                return []

    def get_emergencies(self):
        if self.mock_mode:
            return []
        else:
            try:
                # Query 'cases' where triage_level is Red/Emergency
                # Note: 'cases' collection needs to be populated by the graphs.
                # Fallback: Query medical_records with type 'AI_SUMMARY_DOCTOR' and severity 'CRITICAL'/'HIGH'
                
                # option A: Query medical_records
                query = self.db.collection("medical_records").where("type", "==", "AI_SUMMARY_DOCTOR")
                docs = query.stream()
                
                emergencies = []
                for doc in docs:
                    data = doc.to_dict()
                    # Check inside the nested JSON structure
                    summary = data.get("data", {}).get("pre_doctor_consultation_summary", {})
                    severity = summary.get("assessment", {}).get("severity", "LOW")
                    
                    if severity in ["CRITICAL", "HIGH", "RED"]:
                         emergencies.append({**data, "id": doc.id, "severity": severity})
                         
                return emergencies
            except Exception as e:
                print(f"Firebase Emergency Error: {e}")
                return []

# Singleton Instance
firebase_service = FirebaseService()
