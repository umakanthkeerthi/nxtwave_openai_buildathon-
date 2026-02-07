from langgraph.graph import StateGraph, END
from app.agent.state import TriageState
from app.core.firebase import firebase_service
import uuid
from datetime import datetime

class DoctorConsultationSubgraph:
    def check_availability_node(self, state: TriageState) -> dict:
        """
        Node 1: Check Availability
        Mock availability check.
        """
        print("DEBUG: Executing check_availability_node")
        # In a real system, we'd query the doctor's calendar here.
        # For Phase 1.5, we assume slots are valid.
        return {"booking_status": "checking"}

    def recommend_doctors_node(self, state: TriageState) -> dict:
        """
        Node 2: Recommend
        Decides severity and finds doctors.
        """
        print("DEBUG: Executing recommend_doctors_node")
        severity = state.get("triage_decision", "PENDING")
        if severity == "EMERGENCY":
            mode = "OFFLINE"
            sev_code = "RED"
        else:
            mode = "VIDEO"
            sev_code = "GREEN" 
        
        doctors = self._fetch_mock_doctors(sev_code, mode)
        return {
            "consultation_mode": mode,
            "recommended_doctors": doctors
        }

    def book_appointment_node(self, state: TriageState) -> dict:
        """
        Node 3: Book
        Creates the appointment record.
        """
        print("DEBUG: Executing book_appointment_node")
        try:
            patient_id = state.get("session_id", "anon_patient")
            severity = "GREEN"
            if state.get("triage_decision") == "EMERGENCY":
                severity = "RED"
            
            appt_id = str(uuid.uuid4())
            case_id = str(uuid.uuid4())
            # Use doctor_id from state if available (from Frontend selection)
            doctor_id = state.get("doctor_id", "doc_mock_001") 
            
            # Create Patient Snapshot (Denormalized for performance)
            patient_snapshot = {
                "name": state.get("patient_name", "Unknown Patient"),
                "age": state.get("patient_age", "--"),
                "gender": state.get("patient_gender", "--")
            }

            appointment_record = {
                "appt_id": appt_id,
                "doctor_id": doctor_id,
                "patient_id": patient_id,
                "patient_snapshot": patient_snapshot, # NEW: Grouped snapshot
                "case_id": case_id,
                "status": "confirmed",
                "slot_time": state.get("appointment_time", datetime.utcnow().isoformat()),
                "severity": severity.lower(),
                "mode": state.get("consultation_mode", "VIDEO"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            firebase_service.save_record("appointments", appointment_record)
            
            return {
                "booking_status": "confirmed", 
                "appointment_id": appt_id
            }
        except Exception as e:
            print(f"Doctor Subgraph Error: {e}")
            return {"booking_status": "failed"}

    def _fetch_mock_doctors(self, severity, mode):
        if severity == "RED":
            return [{"id": "doc_red_1", "name": "Dr. A. Emergency", "specialty": "Critical Care"}]
        else:
            return [{"id": "doc_green_1", "name": "Dr. B. General", "specialty": "Online GP"}]

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
