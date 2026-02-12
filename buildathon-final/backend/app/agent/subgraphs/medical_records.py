from langgraph.graph import StateGraph, END
from app.agent.state import TriageState
from app.core.firebase import firebase_service
import uuid
from datetime import datetime

class MedicalRecordsSubgraph:
    def create_case_node(self, state: TriageState) -> dict:
        """
        Node 1: Create/Link Case (The Golden Spine)
        Ensures a 'cases' document exists for this interaction.
        """
        print("DEBUG: Executing create_case_node")
        try:
            # 1. Identity Resolution
            profile_id = state.get("profile_id")
            user_id = state.get("user_id") # [NEW]
            if not profile_id:
                # Fallback for now, though V1.0 assumes strict profiles
                profile_id = state.get("session_id", "anon_profile")
            
            # 2. Case Resolution
            case_id = state.get("case_id")
            if not case_id:
                # New Case (e.g. starting a chat)
                # [STANDARDIZED] Match main.py format
                unique_id = uuid.uuid4().hex[:12].upper()
                case_id = f"CASE-{unique_id}"
                print(f"DEBUG: Creating NEW Case ID: {case_id}")
                
                case_data = {
                    "case_id": case_id,
                    "profile_id": profile_id,
                    "user_id": user_id, # [NEW]
                    "patient_id": profile_id, # Ensure patient_id maps to profile_id
                    "status": "AI_TRIAGE",
                    "is_emergency": state.get("triage_decision") == "EMERGENCY",
                    "created_at": datetime.utcnow().isoformat(),
                    "generated_at": datetime.utcnow().isoformat(), # [ADDED] For consistency
                    "last_updated_at": datetime.utcnow().isoformat()
                }
                # Save to 'cases' collection
                firebase_service.save_record("cases", case_data)
            else:
                print(f"DEBUG: Using EXISTING Case ID: {case_id}")
                # Optional: Update 'last_updated_at' here
            
            return {"case_id": case_id, "profile_id": profile_id}
            
        except Exception as e:
            print(f"Create Case Error: {e}")
            return {"case_id": None}

    def save_summaries_node(self, state: TriageState) -> dict:
        """
        Node 2: Save AI Summaries
        Splits the payload into 'case_ai_patient_summaries' and 'case_pre_doctor_summaries'.
        """
        print("DEBUG: Executing save_summaries_node")
        try:
            case_id = state.get("case_id")
            profile_id = state.get("profile_id")
            user_id = state.get("user_id") # [NEW]
            payload = state.get("full_summary_payload", {})
            
            if not case_id:
                print("ERROR: No case_id found for saving summaries.")
                return {}

            # --- A. Patient Summary ---
            patient_summary_data = payload.get("patient_summary")
            # If payload is just raw text/dict from simple chat, standardize it
            if not isinstance(patient_summary_data, dict):
                 # Handling legacy or simple structure
                 patient_summary_data = {
                     "clinical_guidelines": state.get("final_advice", "No advice"),
                     "triage_level": state.get("triage_decision", "Green")
                 }

            patient_summary_record = {
                "summary_id": f"sum_{uuid.uuid4()}",
                "case_id": case_id,
                "profile_id": profile_id,
                "user_id": user_id, # [NEW]
                "patient_id": profile_id, # [FIX] Added for get_records compatibility
                "type": "AI_SUMMARY", # Standardized Type
                "triage_level": patient_summary_data.get("triage_level", "Green"),
                "symptoms_reported": patient_summary_data.get("symptoms_reported", []),
                "symptoms_denied": patient_summary_data.get("symptoms_denied", []),
                "red_flags_to_watch": patient_summary_data.get("red_flags_to_watch_out_for") or patient_summary_data.get("red_flags", []),
                "guidelines": {
                    "actions": [patient_summary_data.get("clinical_guidelines", "")],
                    "source": "AI_GENERATED"
                },
                "generated_at": datetime.utcnow().isoformat()
            }
            firebase_service.save_record("case_ai_patient_summaries", patient_summary_record)
            print("DEBUG: Saved Patient Summary")

            # --- B. Doctor Summary (If Available) ---
            doctor_summary_data = payload.get("pre_doctor_consultation_summary")
            if doctor_summary_data:
                doctor_summary_record = {
                    "summary_id": f"pre_doc_{uuid.uuid4()}",
                    "case_id": case_id,
                    "profile_id": profile_id,
                    "user_id": user_id, # [NEW]
                    "patient_id": profile_id, # [FIX] Added for get_records compatibility
                    "type": "DOCTOR_SUMMARY", # Standardized Type
                    **doctor_summary_data, # Spread the technical fields (assessment, history, etc)
                    "generated_at": datetime.utcnow().isoformat()
                }
                firebase_service.save_record("case_pre_doctor_summaries", doctor_summary_record)
                print("DEBUG: Saved Doctor Summary")
                
                # Update Case Status
                # In real app, we'd do a patch update. Here we rely on the service.
                # firebase_service.update_status("cases", case_id, "SUMMARY_READY") 

            return {
                "saved_record_id": patient_summary_record["summary_id"],
                "pre_doctor_summary_id": doctor_summary_record["summary_id"] if doctor_summary_data else None
            }
            
        except Exception as e:
            print(f"Save Summaries Error: {e}")
            return {"saved_record_id": None}

    def build(self):
        workflow = StateGraph(TriageState)
        
        workflow.add_node("create_case", self.create_case_node)
        workflow.add_node("save_summaries", self.save_summaries_node)
        
        workflow.set_entry_point("create_case")
        workflow.add_edge("create_case", "save_summaries")
        workflow.add_edge("save_summaries", END)
        
        return workflow.compile()

# Expose the compiled subgraph
medical_records_graph = MedicalRecordsSubgraph().build()
