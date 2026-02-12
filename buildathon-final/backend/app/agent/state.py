
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class PatientProfile(TypedDict):
    age: Optional[int]
    gender: Optional[str]
    symptoms: List[str]
    denied_symptoms: List[str]
    duration: Optional[str]
    medical_history: List[str] # Facts like "diabetes"
    current_meds: List[str]

class TriageState(TypedDict):
    # Standard LangGraph message history
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Patient Data
    patient_profile: PatientProfile
    
    # Agent Reasoning State
    retrieved_protocols: List[str] # Raw text chunks
    differential_diagnosis: List[str] # Hypotheses ["Migraine", "Meningitis"]
    safety_checklist: List[str] # The "Plan" ["Ask about fever", "Ask about stiffness"]
    investigated_symptoms: List[str] # Memory of what has been asked ["fever", "vomiting"]
    investigated_facts: Dict[str, Any] # [New] Structured memory of known facts {"fever_duration": "2 days"}
    

    # Decisions
    triage_decision: str # "PENDING", "EMERGENCY", "COMPLETE"
    final_advice: str
    final_response: str # The actual message sent to the user
    
    # Medical Records & Booking (Phase 1.5)
    # V1.0 Schema Additions
    case_id: Optional[str] # Golden Spine
    user_id: Optional[str] # Account Owner ID
    profile_id: Optional[str] # Linked to 'profiles' collection
    slot_id: Optional[str] # Linked to 'doctor_slots' collection
    
    # Legacy / Compatibility
    saved_record_id: Optional[str]
    booking_status: Optional[str]
    appointment_id: Optional[str]
    consultation_mode: Optional[str]
    recommended_doctors: List[dict]
    full_summary_payload: Optional[Dict[str, Any]]
    
    # Booking Specific
    patient_name: Optional[str]
    patient_age: Optional[str]
    patient_gender: Optional[str]
    doctor_id: Optional[str]
    appointment_time: Optional[str]
    record_type: Optional[str]

    # Meta
    session_id: str
    
    # [NEW] Linked Summaries
    pre_doctor_consultation_summary_id: Optional[str]
    pre_doctor_summary_id: Optional[str]
