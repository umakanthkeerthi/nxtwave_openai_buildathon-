import os
from datetime import datetime, timedelta
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
        
        # Check for credentials in multiple locations
        potential_paths = [
            os.getenv("FIREBASE_CREDENTIALS_PATH"),
            "serviceAccountKey.json",
            "backend/serviceAccountKey.json",
            "../serviceAccountKey.json",
            "/etc/secrets/serviceAccountKey.json"
        ]
        
        cred_path = None
        for p in potential_paths:
            if p and os.path.exists(p):
                cred_path = p
                print(f"INFO: Found Firebase credentials at: {cred_path}")
                break
        
        if FIREBASE_AVAILABLE and cred_path:
            try:
                # [FIX] Check if already initialized to avoid "Default app already exists" error
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    print("SUCCESS: Firebase initialized (New App).")
                else:
                    print("SUCCESS: Firebase already initialized (Using Existing).")
                
                self.db = firestore.client()
                self.mock_mode = False
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

    def update_record(self, collection, doc_id, data):
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Updating '{collection}/{doc_id}': {data}")
            return True
        else:
            try:
                self.db.collection(collection).document(doc_id).update(data)
                return True
            except Exception as e:
                print(f"Firebase Update Error: {e}")
                return False

    def get_records(self, collection, patient_id=None, case_id=None):
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching from '{collection}'.")
            return []
        else:
            try:
                query = self.db.collection(collection)
                
                # [FIX] Prioritize case_id if available (it is more specific and avoids profile_id mismatches)
                if case_id:
                    query = query.where("case_id", "==", case_id)
                elif patient_id:
                    query = query.where("patient_id", "==", patient_id)
                    
                docs = query.stream()
                return [{**doc.to_dict(), "id": doc.id} for doc in docs]
            except Exception as e:
                print(f"Firebase Fetch Error: {e}")
                return []

    def get_appointments(self, doctor_id=None, patient_id=None, user_id=None):
        """
        Fetch appointments with V1.0 enrichment.
        - If patient_id: Enrich with Doctor details.
        - If doctor_id: Enrich with Patient details (from snapshot).
        - If user_id: Enrich with Doctor details (Account view).
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching appointments for doc={doctor_id} pat={patient_id} usr={user_id}")
            # [MOCK DATA] Return sample appointments for testing
            return [
                {
                    "id": "apt_101",
                    "doctor_id": "doc_mock_001",
                    "patient_id": "P-101",
                    "patient_name": "Rahul Verma",
                    "patient_age": 45,
                    "patient_gender": "Male",
                    "appointment_time": (datetime.now() - timedelta(days=2)).isoformat(),
                    "reason": "Chest Pain",
                    "status": "COMPLETED",
                    "slot_time": "10:00 AM"
                },
                {
                    "id": "apt_104",
                    "doctor_id": "doc_mock_001",
                    "patient_id": "P-104", 
                    "patient_name": "Priya Sharma",
                    "patient_age": 28,
                    "patient_gender": "Female",
                    "appointment_time": datetime.now().isoformat(),
                    "reason": "Severe Migraine",
                    "status": "APPOINTMENT_IN_PROGRESS",
                    "slot_time": "11:30 AM"
                }
            ]
        
        try:
            query = self.db.collection("appointments")
            
            if doctor_id:
                query = query.where("doctor_id", "==", doctor_id)
            if user_id:
                # [NEW] Fetch by Account Owner (Show all family appointments)
                query = query.where("user_id", "==", user_id)
            elif patient_id:
                # Support both profile_id and older patient_id field if needed
                # Ideally V1.0 uses profile_id, but legacy might use patient_id
                # Let's try profile_id first as it's the V1.0 standard
                query = query.where("profile_id", "==", patient_id)
                
            docs = query.stream()
            appointments = [{**doc.to_dict(), "id": doc.id} for doc in docs]
            print(f"DEBUG: Found {len(appointments)} raw appointments")
            
            # Helper to fetch all doctors only if needed
            doctors_map = {}
            if patient_id and appointments:
                 try:
                     doctors_list = self.get_doctors()
                     doctors_map = {d["id"]: d for d in doctors_list}
                     print(f"DEBUG: Loaded {len(doctors_map)} doctors for enrichment")
                 except Exception as e:
                     print(f"DEBUG: Failed to load doctors: {e}")
                     pass

            enriched = []
            for apt in appointments:
                # 1. Enlighten Patient Info (for Doctors)
                if doctor_id:
                    snapshot = apt.get("patient_snapshot", {})
                    apt["patient_name"] = snapshot.get("name") or apt.get("patient_name") or "Unknown"
                    apt["patient_age"] = snapshot.get("age") or apt.get("patient_age")
                    apt["patient_age"] = snapshot.get("age") or apt.get("patient_age")
                    apt["patient_gender"] = snapshot.get("gender") or apt.get("patient_gender")

                # [FIX] Injection of calculated fields for Doctor Dashboard
                if apt.get("is_emergency") is True:
                    apt["severity"] = "red"
                else:
                    apt["severity"] = "green"

                # 2. Enlighten Doctor Info (for Patients)
                if patient_id:
                    doc_id = apt.get("doctor_id")
                    doctor = doctors_map.get(doc_id, {})
                    apt["doctorName"] = doctor.get("name", "Unknown Doctor")
                    apt["specialty"] = doctor.get("specialization", "General")
                    apt["doctorImage"] = doctor.get("image", "")

                enriched.append(apt)
            
            print(f"DEBUG: Returning {len(enriched)} enriched appointments")
            # Sort by time info (descending)
            enriched.sort(key=lambda x: x.get("slot_time", "") or x.get("created_at", ""), reverse=True)
            return enriched

        except Exception as e:
            print(f"Firebase Appointment Error: {e}")
            import traceback
            traceback.print_exc()
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
                        pat_data = data.get("patient_snapshot", {"name": "Unknown", "age": "?", "gender": "?"})
                        pat_data["id"] = pid
                        # [FIX] Inject latest appointment context for "My Patients" list
                        pat_data["mode"] = data.get("mode", "Video")
                        pat_data["appointmentId"] = doc.id
                        pat_data["caseId"] = data.get("case_id")
                        unique_patients[pid] = pat_data
                
                return list(unique_patients.values())
            except Exception as e:
                print(f"Firebase Patient List Error: {e}")
                return []

    def get_emergencies(self):
        if self.mock_mode:
            return []
        else:
            try:
                emergencies = []

                # 1. Fetch Emergency Medical Records (Existing Logic)
                # Query 'cases' where triage_level is Red/Emergency
                # Note: 'cases' collection needs to be populated by the graphs.
                # Fallback: Query medical_records with type 'AI_SUMMARY_DOCTOR' and severity 'CRITICAL'/'HIGH'
                
                try:
                    query = self.db.collection("medical_records").where("type", "==", "AI_SUMMARY_DOCTOR")
                    docs = query.stream()
                    for doc in docs:
                        data = doc.to_dict()
                        # Check inside the nested JSON structure
                        summary = data.get("data", {}).get("pre_doctor_consultation_summary", {})
                        severity = summary.get("assessment", {}).get("severity", "LOW")
                        
                        if severity in ["CRITICAL", "HIGH", "RED"]:
                             emergencies.append({**data, "id": doc.id, "severity": severity, "source_type": "medical_record"})
                except Exception as e:
                    print(f"Error fetching medical records: {e}")

                # 2. [NEW] Fetch Emergency Appointments
                try:
                    apt_query = self.db.collection("appointments").where("is_emergency", "==", True)
                    apt_docs = apt_query.stream()
                    
                    for doc in apt_docs:
                        apt_data = doc.to_dict()
                        # Normalize to match expected structure or mark as appointment
                        # Construct a mock "summary" for the frontend to consume easily
                        
                        summary_payload = {
                            "trigger_reason": "Emergency Appointment Booking",
                            "assessment": {
                                "severity": "HIGH",
                                "severity_score": 99
                            },
                            "vitals_reported": {} 
                        }
                        
                        patient_profile = apt_data.get("patient_snapshot", {})
                        if not patient_profile.get("name"):
                             patient_profile["name"] = apt_data.get("patient_name", "Unknown")

                        emergencies.append({
                            "id": doc.id,
                            "patient_id": apt_data.get("patient_id"),
                            "profile_id": apt_data.get("profile_id"),
                            "case_id": apt_data.get("case_id"),
                            "created_at": apt_data.get("created_at"),
                            "data": {
                                "patient_profile": patient_profile,
                                "pre_doctor_consultation_summary": summary_payload
                            },
                            "source_type": "appointment",
                            "status": apt_data.get("status"), # [FIX] Lift status for filtering
                            "appointment_details": apt_data # Keep original data
                        })
                        
                except Exception as e:
                    print(f"Error fetching emergency appointments: {e}")
                         
                # [FIX] Filter out completed/ended emergencies
                active_emergencies = [
                    e for e in emergencies 
                    if e.get("status") not in ["CONSULTATION_ENDED", "COMPLETED"]
                ]
                
                return active_emergencies
            except Exception as e:
                print(f"Firebase Emergency Error: {e}")
                return []

    # --- GENERIC HELPERS (V1.0) ---
    def get_document(self, collection: str, doc_id: str):
        """
        Generic fetch by ID. Very useful for V1.0 schema (slots, profiles, cases).
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching doc '{doc_id}' from '{collection}'.")
            return {"id": doc_id, "mock_data": True}
        else:
            try:
                doc_ref = self.db.collection(collection).document(doc_id)
                doc = doc_ref.get()
                if doc.exists:
                    return {**doc.to_dict(), "id": doc.id}
                else:
                    return None
            except Exception as e:
                print(f"Firebase Get Doc Error ({collection}/{doc_id}): {e}")
                return None

    def get_case(self, case_id: str):
        """
        Fetch a single case by ID.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching case {case_id}.")
            return {
                "id": case_id,
                "status": "DOCTOR_ASSIGNED", 
                "triage_decision": "PENDING",
                "mock_data": True
            }
        else:
            return self.get_document("cases", case_id)

    def update_document(self, collection: str, doc_id: str, data: dict):
        """
        Generic update by ID.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Updating doc '{doc_id}' in '{collection}': {data}")
            return True
        else:
            try:
                doc_ref = self.db.collection(collection).document(doc_id)
                doc_ref.update(data)
                return True
            except Exception as e:
                print(f"Firebase Update Doc Error ({collection}/{doc_id}): {e}")
                return False

    def upsert_document(self, collection: str, doc_id: str, data: dict):
        """
        Create or Update a document with a specific ID.
        Uses set(..., merge=True).
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Upserting doc '{doc_id}' in '{collection}': {data}")
            return True
        else:
            try:
                doc_ref = self.db.collection(collection).document(doc_id)
                doc_ref.set(data, merge=True)
                return True
            except Exception as e:
                print(f"Firebase Upsert Doc Error ({collection}/{doc_id}): {e}")
                return False

    def get_doctors(self):
        """
        Fetch all available doctors.
        """
        if self.mock_mode:
            print("[MOCK FIREBASE] Fetching all doctors.")
            return []
        else:
            try:
                docs = self.db.collection("doctors").stream()
                return [{**doc.to_dict(), "id": doc.id} for doc in docs]
            except Exception as e:
                print(f"Firebase Doctors Error: {e}")
                return []

    def get_doctor(self, doctor_id: str):
        """
        Fetch a single doctor by ID.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching doctor {doctor_id}.")
            return {"name": "Mock Doctor", "specialization": "General", "id": doctor_id}
        else:
            return self.get_document("doctors", doctor_id)

    def update_doctor(self, doctor_id: str, data: dict):
        """
        Update doctor profile data.
        """
        return self.update_document("doctors", doctor_id, data)

    def get_doctor_slots(self, doctor_id: str, status: str = "AVAILABLE"):
        """
        Fetch available slots for a specific doctor.
        If status="ALL", returns all slots.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching slots for {doctor_id}.")
            return []
        else:
            try:
                query = self.db.collection("doctor_slots").where("doctor_id", "==", doctor_id)
                
                # Only apply status filter if NOT "ALL"
                if status != "ALL":
                    query = query.where("status", "==", status)
                
                docs = query.stream()
                slots = [{**doc.to_dict(), "id": doc.id} for doc in docs]
                
                # Client-side sort by start_time just in case
                slots.sort(key=lambda x: x.get("start_time", ""))
                return slots
            except Exception as e:
                print(f"Firebase Slots Error: {e}")
                return []

    def create_slot(self, slot_data: dict):
        """
        Creates a new slot in 'doctor_slots' collection.
        Input: { "doctor_id": "...", "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "status": "AVAILABLE" }
        """
        # Add timestamp
        if "created_at" not in slot_data:
            slot_data["created_at"] = datetime.utcnow().isoformat()

        if self.mock_mode:
            print(f"[MOCK FIREBASE] Creating slot: {slot_data}")
            return "mock_slot_id"
        else:
            try:
                # Basic validation: Check for overlap? (Skipping for MVP)
                doc_ref = self.db.collection("doctor_slots").add(slot_data)
                return doc_ref[1].id
            except Exception as e:
                print(f"Firebase Create Slot Error: {e}")
                return None

    def delete_slot(self, slot_id: str):
        """
        Deletes a slot by ID.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Deleting slot: {slot_id}")
            return True
        else:
            try:
                self.db.collection("doctor_slots").document(slot_id).delete()
                return True
            except Exception as e:
                print(f"Firebase Delete Slot Error: {e}")
                return False

    def update_case_status(self, case_id: str, status: str):
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Update case {case_id} status to {status}")
            return {"status": "success", "mock": True}
        
        try:
            doc_ref = self.db.collection("cases").document(case_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                # Try query if ID mismatch
                query = self.db.collection("cases").where("case_id", "==", case_id).stream()
                found = False
                for d in query:
                    doc_ref = d.reference
                    doc = d
                    found = True
                    break
                if not found:
                    raise Exception("Case not found")

            current_data = doc.to_dict()
            updates = {
                "status": status,
                "last_updated_at": datetime.utcnow().isoformat()
            }
            
            # [USER REQUEST] Ensure generated_at exists in schema
            if "generated_at" not in current_data:
                # Set to current time if missing (indicating consultation start / generation of this status)
                updates["generated_at"] = datetime.utcnow().isoformat()
            
            doc_ref.update(updates)
            return {"status": "success", "case_id": case_id, "updates": updates}
        
        except Exception as e:
            print(f"Update Case Error: {e}")
            raise e
   
    def delete_slots_for_day(self, doctor_id: str, date: str):
        """
        Deletes all slots for a doctor on a specific date.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Deleting slots for {doctor_id} on {date}")
            return True
        else:
            try:
                # Query all slots for this doctor and date
                slots_ref = self.db.collection("doctor_slots")
                query = slots_ref.where("doctor_id", "==", doctor_id).where("date", "==", date)
                docs = query.stream()

                # Batch delete
                batch = self.db.batch()
                count = 0
                for doc in docs:
                    batch.delete(doc.reference)
                    count += 1
                
                if count > 0:
                    batch.commit()
                
                print(f"Deleted {count} slots for {date}")
                return True
            except Exception as e:
                print(f"Firebase Batch Delete Error: {e}")
                return False

    def delete_all_slots_globally(self):
        """
        Deletes ALL slots for ALL doctors. Use with caution.
        """
        if self.mock_mode:
            print("[MOCK FIREBASE] Deleting ALL slots globally")
            return self.delete_all_mock_data() # Assuming we might want to clear mock data too
        else:
            try:
                # Get all documents in collection
                docs = self.db.collection("doctor_slots").stream()
                
                batch = self.db.batch()
                count = 0
                total_deleted = 0
                
                for doc in docs:
                    batch.delete(doc.reference)
                    count += 1
                    
                    # Firebase batch limit is 500
                    if count >= 400:
                        batch.commit()
                        total_deleted += count
                        batch = self.db.batch()
                        count = 0
                
                if count > 0:
                    batch.commit()
                    total_deleted += count
                    
                print(f"Globally deleted {total_deleted} slots")
                return True
            except Exception as e:
                print(f"Global Delete Error: {e}")
                return False

    def create_batch_slots(self, doctor_id, start_date, end_date, selected_days, start_time, end_time, break_start, break_end, slot_duration=30, time_gap=0):
        """
        Creates slots in batch for a date range.
        Inputs: strings "YYYY-MM-DD", "HH:MM", list ["Mon", "Tue"]
        """
        created_count = 0
        try:
            curr_date = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            
            # Parse times
            start_tm = datetime.strptime(start_time, "%H:%M")
            end_tm = datetime.strptime(end_time, "%H:%M")
            break_start_tm = datetime.strptime(break_start, "%H:%M")
            break_end_tm = datetime.strptime(break_end, "%H:%M")
            
            # Extract time components for slot generation logic
            start_h, start_m = start_tm.hour, start_tm.minute
            end_h, end_m = end_tm.hour, end_tm.minute
            break_s_h, break_s_m = break_start_tm.hour, break_start_tm.minute
            break_e_h, break_e_m = break_end_tm.hour, break_end_tm.minute
            
            while curr_date <= end_dt:
                day_name = curr_date.strftime("%a") # Mon, Tue...
                if day_name in selected_days:
                    # Current Day Start/End as full datetime
                    day_start_dt = curr_date.replace(hour=start_h, minute=start_m, second=0, microsecond=0)
                    day_end_dt = curr_date.replace(hour=end_h, minute=end_m, second=0, microsecond=0)
                    
                    # Current Day Break
                    day_break_start = curr_date.replace(hour=break_s_h, minute=break_s_m, second=0, microsecond=0)
                    day_break_end = curr_date.replace(hour=break_e_h, minute=break_e_m, second=0, microsecond=0)
                    
                    # Generate Slots
                    slot_start = day_start_dt
                    while slot_start + timedelta(minutes=slot_duration) <= day_end_dt:
                        slot_end = slot_start + timedelta(minutes=slot_duration)
                        
                        # Check Overlap: (SlotEnd > BreakStart) AND (SlotStart < BreakEnd)
                        is_overlap = (slot_end > day_break_start) and (slot_start < day_break_end)
                        
                        if not is_overlap:
                            slot_data = {
                                "doctor_id": doctor_id,
                                "date": curr_date.strftime("%Y-%m-%d"),
                                "start_time": slot_start.strftime("%H:%M"),
                                "end_time": slot_end.strftime("%H:%M"),
                                "status": "AVAILABLE"
                            }
                            self.create_slot(slot_data)
                            created_count += 1
                        
                        # Add Duration + GAP for next start
                        slot_start = slot_end + timedelta(minutes=time_gap)

                curr_date += timedelta(days=1)
                
            return created_count

            return created_count
        except Exception as e:
            print(f"Batch Create Error: {e}")
            return 0

    def get_doctors_with_availability(self, lat: float, lon: float):
        """
        Fetches all doctors, calculates distance, and checks immediate availability.
        Returns list sorted by: Available Now (Priority) -> Distance (Ascending).
        """
        if self.mock_mode:
            print("[MOCK FIREBASE] returning mock emergency doctors")
            return []

        try:
            # 1. Fetch all doctors
            doctors = self.get_doctors()
            
            # 2. Fetch ALL slots for TODAY for ALL doctors (Optimization: Query all slots for today date)
            today_str = datetime.now().strftime("%Y-%m-%d")
            
            # In a huge DB, we'd query by doctor. For MVP, one query for today's slots is efficient enough.
            slots_ref = self.db.collection("doctor_slots")
            slots_query = slots_ref.where("date", "==", today_str).where("status", "==", "AVAILABLE")
            slots_docs = slots_query.stream()
            
            # Organize slots by doctor_id
            doctor_slots_map = {}
            current_time = datetime.now()
            
            for doc in slots_docs:
                data = doc.to_dict()
                doc_id = data.get("doctor_id")
                if doc_id not in doctor_slots_map:
                    doctor_slots_map[doc_id] = []
                
                # Check if slot is in the future (or strictly "now" if we want immediate)
                # For "Available Now", allow slots that started within last 15 mins or start in next 30 mins
                # For simplicity MVP: If slot.end_time > current_time AND slot.start_time <= current_time + buffer
                doctor_slots_map[doc_id].append(data)

            # 3. Process Doctors
            enriched_doctors = []
            
            for doc in doctors:
                # Calculate Distance
                # Default doc location if missing (Seed data might not have it)
                doc_lat = doc.get("latitude", 28.6139) # Default Connaught Place
                doc_lon = doc.get("longitude", 77.2090)
                
                dist = self._calculate_distance(lat, lon, doc_lat, doc_lon)
                doc["distance"] = round(dist, 1) # km
                
                # Check Availability
                is_available = False
                doc_slots = doctor_slots_map.get(doc["id"], [])
                
                current_time_str = current_time.strftime("%H:%M")
                
                for slot in doc_slots:
                    # Simple check: Is current time within slot start/end?
                    # OR is there a slot starting very soon?
                    
                    # Using string comparison for "HH:MM" works for same day
                    if slot["start_time"] <= current_time_str < slot["end_time"]:
                        is_available = True
                        break
                    
                    # Also consider "Available" if slot starts in next 20 mins
                    # (Skipping complex time math for MVP, just strict "Now" or "Future today")
                    if slot["start_time"] > current_time_str:
                         # It's available later today
                         pass

                doc["availableTime"] = "Available Now" if is_available else "Next Available: Tomorrow" 
                # If not available now but has slots later today?
                if not is_available and doc_slots:
                     # Find next slot
                     doc_slots.sort(key=lambda x: x["start_time"])
                     next_slot = None
                     for s in doc_slots:
                         if s["start_time"] > current_time_str:
                             next_slot = s
                             break
                     if next_slot:
                         doc["availableTime"] = f"Today, {next_slot['start_time']}"

                # Prioritize Available Now
                doc["is_available_now"] = is_available
                
                enriched_doctors.append(doc)
            
            # 4. Sort
            # Primary: Available Now (True first)
            # Secondary: Distance (Low first)
            enriched_doctors.sort(key=lambda x: (not x["is_available_now"], x["distance"]))
            
            return enriched_doctors

        except Exception as e:
            print(f"Emergency Doctor Fetch Error: {e}")
            return []

    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        # Haversine formula
        import math
        R = 6371  # Earth radius in km

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) * math.sin(dlat / 2) + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(dlon / 2) * math.sin(dlon / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance





    # --- PHARMACY MODULE ---
    def get_medicines(self):
        """
        Fetch all medicines from 'medicines' collection.
        """
        if self.mock_mode:
            print("[MOCK FIREBASE] Fetching all medicines.")
            return [
                {"id": "m1", "name": "Amoxicillin 500mg", "price": 12.50, "category": "Prescription", "in_stock": True, "description": "Antibiotic for bacterial infections."},
                {"id": "m2", "name": "Cetirizine 10mg", "price": 5.00, "category": "OTC", "in_stock": True, "description": "Antihistamine for allergies."},
                {"id": "m3", "name": "Vitamin C 1000mg", "price": 8.00, "category": "Wellness", "in_stock": True, "description": "Immunity booster supplement."},
                {"id": "m4", "name": "Ibuprofen 400mg", "price": 6.50, "category": "OTC", "in_stock": True, "description": "Pain reliever and anti-inflammatory."},
                {"id": "m5", "name": "Paracetamol 500mg", "price": 3.00, "category": "OTC", "in_stock": True, "description": "Fever reducer and mild pain reliever."},
                {"id": "m6", "name": "Baby Diapers (Pack of 12)", "price": 15.00, "category": "Baby Care", "in_stock": True, "description": "Soft and absorbent diapers."}
            ]
        else:
            try:
                docs = self.db.collection("medicines").stream()
                return [{**doc.to_dict(), "id": doc.id} for doc in docs]
            except Exception as e:
                print(f"Firebase Medicines Error: {e}")
                return []

    def create_pharmacy_order(self, order_data: dict):
        """
        Creates a new pharmacy order.
        Input: { "patient_id": "...", "items": [...], "total": 12.50, "status": "PENDING" }
        """
        # Add metadata
        if "created_at" not in order_data:
            order_data["created_at"] = datetime.utcnow().isoformat()
        if "status" not in order_data:
            order_data["status"] = "PENDING" # PENDING, PREPARING, READY, COMPLETED, CANCELLED

        if self.mock_mode:
            print(f"[MOCK FIREBASE] Creating pharmacy order: {order_data}")
            return f"mock_order_{uuid.uuid4().hex[:6]}"
        else:
            try:
                doc_ref = self.db.collection("pharmacy_orders").add(order_data)
                return doc_ref[1].id
            except Exception as e:
                print(f"Firebase Create Order Error: {e}")
                return None

    def get_pharmacy_orders(self, patient_id=None, status=None):
        """
        Fetch pharmacy orders with optional filtering.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching orders pat={patient_id} stat={status}")
            # Return some mock orders
            mock_orders = [
                {
                    "id": "ord_001", "patient_id": "P-101", "patient_name": "Rahul Verma",
                    "items": [{"name": "Amoxicillin", "info": "500mg", "qty": 1, "price": 12.50}],
                    "total": 12.50, "status": "PENDING", "created_at": (datetime.now() - timedelta(hours=1)).isoformat()
                },
                {
                    "id": "ord_002", "patient_id": "P-104", "patient_name": "Priya Sharma",
                    "items": [{"name": "Vitamin C", "info": "1000mg", "qty": 2, "price": 16.00}],
                    "total": 16.00, "status": "READY", "created_at": (datetime.now() - timedelta(hours=4)).isoformat()
                }
            ]
            
            # Simple in-memory filter for mock
            filtered = mock_orders
            if patient_id:
                filtered = [o for o in filtered if o["patient_id"] == patient_id]
            if status:
                filtered = [o for o in filtered if o["status"] == status]
            return filtered

        else:
            try:
                query = self.db.collection("pharmacy_orders")
                
                if patient_id:
                    query = query.where("patient_id", "==", patient_id)
                if status:
                    query = query.where("status", "==", status)
                    
                docs = query.stream()
                orders = [{**doc.to_dict(), "id": doc.id} for doc in docs]
                
                # Sort by created_at desc
                orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return orders
            except Exception as e:
                print(f"Firebase Get Orders Error: {e}")
                return []

    def update_order_status(self, order_id: str, status: str):
        """
        Update status of a pharmacy order.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Updating order {order_id} to {status}")
            return True
        else:
            try:
                self.db.collection("pharmacy_orders").document(order_id).update({"status": status})
                return True
            except Exception as e:
                print(f"Firebase Update Order Error: {e}")
                return False


    def get_patient_medical_history(self, patient_id):
        """
        Retrieves the structured medical history for a patient.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Fetching Medical History for {patient_id}")
            return {}
        else:
            try:
                # We assume 1 history doc per patient, keyed by patient_id
                doc_ref = self.db.collection("patient_medical_history").document(patient_id)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
                return {}
            except Exception as e:
                print(f"Firebase History Fetch Error: {e}")
                return {}

    def update_patient_medical_history(self, patient_id, history_data):
        """
        Updates the structured medical history for a patient.
        """
        if self.mock_mode:
            print(f"[MOCK FIREBASE] Updating Medical History for {patient_id}: {history_data}")
            return True
        else:
            try:
                doc_ref = self.db.collection("patient_medical_history").document(patient_id)
                doc_ref.set(history_data, merge=True)
                return True
            except Exception as e:
                print(f"Firebase History Update Error: {e}")
                return False

# Singleton Instance
firebase_service = FirebaseService()


