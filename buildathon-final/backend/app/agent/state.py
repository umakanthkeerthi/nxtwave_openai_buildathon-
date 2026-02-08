
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
    saved_record_id: Optional[str]
    case_id: Optional[str] # The golden thread ID linking chat, summary, and booking
    booking_status: Optional[str] # "pending", "confirmed"
    appointment_id: Optional[str]
    consultation_mode: Optional[str]
    recommended_doctors: List[dict]
    full_summary_payload: Optional[Dict[str, Any]] # Holds the complete rich summary content
    
    # Booking Specific
    patient_name: Optional[str]
    patient_age: Optional[str] # Keeping as str to handle "45" or "45 yrs"
    patient_gender: Optional[str]
    doctor_id: Optional[str]
    appointment_time: Optional[str]
    record_type: Optional[str] # "AI_SUMMARY_DOCTOR", "PRESCRIPTION", etc.
    
    # Meta
    session_id: str
