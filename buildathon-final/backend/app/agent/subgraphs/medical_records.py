from langgraph.graph import StateGraph, END
from app.agent.state import TriageState
from app.core.firebase import firebase_service
import uuid
from datetime import datetime

class MedicalRecordsSubgraph:
    def format_summary_node(self, state: TriageState) -> dict:
        """
        Node 1: Format Data
        Ensures we have a valid summary structure before saving.
        If 'final_advice' is missing, it mimics a default summary.
        """
        print("DEBUG: Executing format_summary_node")
        summary_data = {
            "profile": state.get("patient_profile", {}),
            "triage_decision": state.get("triage_decision"),
            "final_advice": state.get("final_advice", "No specific advice generated."),
            "symptoms": state.get("investigated_symptoms", [])
        }
        
        # We return this to be available for the next node (via state update)
        # Note: In TriageState, we might not have a 'formatted_summary' field, 
        # so we'll just pass it internally or rely on the next node reconstructing it 
        # if we don't want to change state schema again.
        # For this implementation, let's pass it as a temporary key if LangGraph allows, 
        # or just re-construct it in the saver for simplicity, 
        # BUT the user asked for a specific "generation" step. 
        # Let's assume we update the state with 'last_generated_summary' if we added it,
        # or we just rely on the node logic flow.
        
        return {"final_advice": summary_data["final_advice"]} # Ensure advice is set

    def save_to_firebase_node(self, state: TriageState) -> dict:
        """
        Node 2: Save to Firebase
        """
        print("DEBUG: Executing save_to_firebase_node")
        try:
            patient_id = state.get("session_id", "anon_patient")
            print(f"DEBUG: Processing save_to_firebase_node for Patient: {patient_id}")
            
            # Re-construct or pull from state
            # IMPROVEMENT: Use the full payload if available to preserve all details
            summary_data = {}
            existing_case_id = None

            if state.get("full_summary_payload"):
                print("DEBUG: Using full_summary_payload")
                summary_data = state.get("full_summary_payload")
                existing_case_id = summary_data.get("case_id") # Extract if passed from frontend
            else:
                print("DEBUG: Constructing summary from partial state")
                summary_data = {
                    "profile": state.get("patient_profile", {}),
                    "triage_decision": state.get("triage_decision"),
                    "final_advice": state.get("final_advice"),
                    "symptoms": state.get("investigated_symptoms", [])
                }

            record_id = str(uuid.uuid4())
            # Use existing case_id (from chat session) if available, else new one
            case_id = existing_case_id if existing_case_id else str(uuid.uuid4())
            print(f"DEBUG: Generated/Used Case ID: {case_id}")

            # Determine Record Type
            record_type = state.get("record_type", "summary")

            record = {
                "record_id": record_id,
                "patient_id": patient_id,
                "case_id": case_id,
                "type": record_type,
                "data": summary_data,
                "created_at": datetime.utcnow().isoformat()
            }
            
            print(f"DEBUG: Saving record to Firebase... Type: {record_type}")
            firebase_service.save_record("medical_records", record)
            print("DEBUG: Record saved successfully.")
            return {"saved_record_id": record_id}
        except Exception as e:
            print(f"Medical Records Subgraph Error: {e}")
            return {"saved_record_id": None}

    def build(self):
        workflow = StateGraph(TriageState)
        
        workflow.add_node("format_summary", self.format_summary_node)
        workflow.add_node("save_to_firebase", self.save_to_firebase_node)
        
        workflow.set_entry_point("format_summary")
        workflow.add_edge("format_summary", "save_to_firebase")
        workflow.add_edge("save_to_firebase", END)
        
        return workflow.compile()

# Expose the compiled subgraph
medical_records_graph = MedicalRecordsSubgraph().build()
