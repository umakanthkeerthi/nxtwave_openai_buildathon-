from langgraph.graph import StateGraph, END
from app.agent.state import TriageState
from app.core.firebase import firebase_service
import uuid
from datetime import datetime

class DoctorConsultationSubgraph:
    def check_availability_node(self, state: TriageState) -> dict:
        """
        Node 1: Check Availability
        Validates the requested 'slot_id' against the 'doctor_slots' collection.
        """
        print("DEBUG: Executing check_availability_node")
        slot_id = state.get("slot_id")
        
        if not slot_id:
            print("WARN: No slot_id provided. Assuming Mock/Test Mode.")
            return {"booking_status": "checking"}
            
        # V1.0: Real Slot Validation
        slot = firebase_service.get_document("doctor_slots", slot_id)
        if not slot:
            print(f"ERROR: Slot {slot_id} not found.")
            return {"booking_status": "failed", "final_advice": "Selected slot is invalid."}
            
        if slot.get("status") != "AVAILABLE":
             print(f"ERROR: Slot {slot_id} is {slot.get('status')}")
             return {"booking_status": "failed", "final_advice": "Selected slot is no longer available."}
             
        return {"booking_status": "available"}

    def recommend_doctors_node(self, state: TriageState) -> dict:
        """
        Node 2: Recommend (Mock for now)
        Fetches doctors based on severity. In V1.0, Frontend usually picks doctor first.
        """
        print("DEBUG: Executing recommend_doctors_node")
        severity = state.get("triage_decision", "PENDING")
        if severity == "EMERGENCY":
            mode = "OFFLINE"
            sev_code = "RED"
        else:
            mode = "VIDEO"
            sev_code = "GREEN" 
        
        # Simplified Mock Logic (In prod, query 'doctors' collection)
        doctors = [{"id": "doc_001", "name": "Dr. Geeta Phogat", "specialty": "Cardiology"}]
        return {
            "consultation_mode": mode,
            "recommended_doctors": doctors
        }

    def book_appointment_node(self, state: TriageState) -> dict:
        """
        Node 3: Book Appointment
        Creates 'appointments' doc and updates 'doctor_slots' & 'cases'.
        """
        try:
            print("DEBUG: Executing book_appointment_node")
            # inputs
            case_id = state.get("case_id")
            
            print(f"DEBUG: book_appointment_node case_id={case_id}")
            
            profile_id = state.get("profile_id") or state.get("session_id", "anon_profile")
            doctor_id = state.get("doctor_id")
            slot_id = state.get("slot_id")
            
            if not case_id or not doctor_id:
                print("ERROR: Missing case_id or doctor_id for booking.")
                return {"booking_status": "failed"}

            appt_id = f"appt_{uuid.uuid4()}"
            
            # 1. Create Appointment Record
            appointment_record = {
                "appointment_id": appt_id,
                "case_id": case_id,
                "profile_id": profile_id,
                "doctor_id": doctor_id,
                "slot_id": slot_id,
                "status": "SCHEDULED", # V1.0 Standard
                "mode": state.get("consultation_mode", "VIDEO"),
                "is_emergency": state.get("triage_decision") == "EMERGENCY",
                
                # Denormalized Snapshot
                "patient_snapshot": {
                    "name": state.get("patient_name", "Unknown"),
                    "age": state.get("patient_age", "Unknown"),
                    "gender": state.get("patient_gender", "Unknown")
                },
                
                "created_at": datetime.utcnow().isoformat(),
                "slot_time": state.get("appointment_time", datetime.utcnow().isoformat())
            }
            
            firebase_service.save_record("appointments", appointment_record)
            print(f"DEBUG: Appointment {appt_id} Created.")
            
            # 2. Lock the Slot (Atomic in prod, sequential here)
            if slot_id:
                firebase_service.update_document("doctor_slots", slot_id, {"status": "BOOKED"})
                print(f"DEBUG: Slot {slot_id} Locked.")
                
            # 3. Update Case Status (Upsert to ensure case exists)
            if case_id:
                 # We don't have update_status in service yet, using generic update
                 firebase_service.upsert_document("cases", case_id, {
                     "status": "DOCTOR_ASSIGNED",
                     "last_updated_at": datetime.utcnow().isoformat(),
                     # Add basic case info if it's new
                     "patient_id": profile_id, 
                     "case_id": case_id
                 })
                 print(f"DEBUG: Case {case_id} Updated/Created as DOCTOR_ASSIGNED.")
            
            return {
                "booking_status": "confirmed", 
                "appointment_id": appt_id
            }
        except Exception as e:
            print(f"Doctor Subgraph Error: {e}")
            return {"booking_status": "failed"}

    def build(self):
        workflow = StateGraph(TriageState)
        
        workflow.add_node("check_availability", self.check_availability_node)
        workflow.add_node("recommend_doctors", self.recommend_doctors_node)
        workflow.add_node("book_appointment", self.book_appointment_node)
        
        workflow.set_entry_point("check_availability")
        workflow.add_edge("check_availability", "recommend_doctors")
        workflow.add_edge("recommend_doctors", "book_appointment")
        workflow.add_edge("book_appointment", END)
        
        return workflow.compile()

# Expose the compiled subgraph
doctor_consultation_graph = DoctorConsultationSubgraph().build()
