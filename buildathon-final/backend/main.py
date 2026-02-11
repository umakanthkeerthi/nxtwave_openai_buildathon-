
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from langchain_core.messages import HumanMessage
from app.agent.graph import agent_graph
import uuid

app = FastAPI(title="Agentic Doctor V2")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: str
    target_language: Optional[str] = "English"

class ChatResponse(BaseModel):
    response: str
    decision: Optional[str] = "PENDING"
    detected_language: Optional[str] = None
    summary_payload: Optional[dict] = None

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    print(f"DEBUG: Chat endpoint called. Target: '{req.target_language}', Message: '{req.message[:20]}...'")
    try:
        config = {"configurable": {"thread_id": req.session_id}}
        
        # Invoke Graph
        result = await agent_graph.ainvoke(
            {"messages": [HumanMessage(content=req.message)]}, 
            config=config
        )
        
        raw_response = result.get("final_response", "Error generating response.")
        final_response = raw_response
        
        # Output Translation Logic
        target_lang = req.target_language
        detected_lang_out = None
        
        # logic for Auto-detect: Detect language from input message if not specified
        if target_lang == "Auto" or target_lang == "English":  # [MODIFIED] Check even if English
            try:
                detect_prompt = f"""
                Detect the language of this text. Return JSON with key 'language'.
                TEXT: "{req.message}"
                """
                detect_completion = client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[{"role": "user", "content": detect_prompt}],
                    response_format={"type": "json_object"},
                    temperature=0
                )
                detected = json.loads(detect_completion.choices[0].message.content).get("language", "English")
                if detected != "English":
                    target_lang = detected
                    detected_lang_out = detected
            except Exception as e:
                print(f"Auto-detect Error: {e}")
                # Keep target_lang as is (English/Auto) on error

        # Perform Translation if needed
        if target_lang and target_lang != "English" and target_lang != "Auto":
            try:
                prompt = f"""
                Translate this medical response to {target_lang}.
                Return JSON with key 'translation' only.
                
                TEXT: "{raw_response}"
                """
                completion = client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0
                )
                final_response = json.loads(completion.choices[0].message.content)["translation"]
            except Exception as e:
                print(f"Translation Error in Chat: {e}")
                # Fallback to English
                pass

        return ChatResponse(
            response=final_response,
            decision=result.get("triage_decision", "PENDING"),
            detected_language=detected_lang_out,
            summary_payload=result.get("full_summary_payload")
        )
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# --- ADDING MISSING ENDPOINTS ---
from fastapi import UploadFile, File, Form
from groq import Groq
from app.core.config import settings
import shutil
import os
import json

# ISO-639-1 Codes for Whisper
LANGUAGE_CODES = {
    "Hindi": "hi",
    "Telugu": "te",
    "Tamil": "ta",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Marathi": "mr",
    "Bengali": "bn",
    "Punjabi": "pa",
    "English": "en"
}

client = Groq(api_key=settings.GROQ_API_KEY)

class TranslationRequest(BaseModel):
    message: str
    session_id: str

class SummaryRequest(BaseModel):
    history: List[dict]
    target_language: str

@app.post("/translate_text")
async def translate_text(req: TranslationRequest):
    print(f"DEBUG: Translate Text called. Message: '{req.message[:20]}...'")
    try:
        # Detect and Translate to English
        prompt = f"""
        Translate the following medical text to English.
        If it is already English, just return it.
        Also detect the source language.
        
        TEXT: "{req.message}"
        
        OUTPUT JSON:
        {{
            "english_text": "...",
            "detected_language": "..."
        }}
        """
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0
        )
        res = json.loads(completion.choices[0].message.content)
        print(f"DEBUG: Translation Result: {res}")
        return res
    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_audio")
async def process_audio(
    audio: UploadFile = File(...), 
    language_hint: str = Form("en"),
    target_language: str = Form("Auto") # New Param
):
    try:
        # Save temp file
        temp_filename = f"temp_{uuid.uuid4()}.wav"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        # Transcribe
        with open(temp_filename, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(temp_filename, file.read()),
                model="whisper-large-v3",
                language=LANGUAGE_CODES.get(language_hint, None)
            )
            
        # Cleanup
        os.remove(temp_filename)
        
        # Logic: 
        # If target_language is specific (e.g. "Telugu"), we force the output to be in that language.
        # Otherwise, we default to the English translation logic.
        
        original_text = transcription.text
        english_text = original_text
        detected_lang = "English"

        if target_language != "Auto" and target_language != "English":
            # Force Transcription to Match Chat Language
            prompt = f"""
            The user is speaking in {target_language}.
            Output their speech strictly in {target_language} script.
            Also provide an English translation.
            
            AUDIO TRANSCRIPT: "{original_text}"
            
            OUTPUT JSON:
            {{
                "native_text": "...",  # Text in {target_language} script
                "english_text": "...",
                "detected_language": "{target_language}"
            }}
            """
        else:
            # Default/Auto Logic (Detect & Translate to English)
            prompt = f"""
            Analyze the following medical text.
            1. Detect the source language.
            2. Translate it to English.
            3. Return the original text as 'native_text'.
            
            TEXT: "{original_text}"
            
            OUTPUT JSON:
            {{
                "native_text": "{original_text}",
                "english_text": "...",
                "detected_language": "..."
            }}
            """

        try:
            completion = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0
            )
            data = json.loads(completion.choices[0].message.content)
            
            # Unpack based on logic
            repaired_text = data.get("native_text", original_text)
            english_text = data.get("english_text", original_text)
            detected_lang = data.get("detected_language", "English")
            
        except Exception as e:
            print(f"Translation/Correction Error in Audio: {e}")
            repaired_text = original_text

        return {
            "repaired_text": repaired_text,
            "english_text": english_text,
            "detected_language": detected_lang
        }
    except Exception as e:
        print(f"Audio Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_summary")
async def generate_summary(req: SummaryRequest):
    try:
        # Convert history to string
        conversation = "\n".join([f"{msg.get('sender', 'user')}: {msg.get('text', '')}" for msg in req.history])
        
        output_prompt = f"""
        Analyze this patient encounter and generate TWO distinct outputs in JSON format.
        
        1. "patient_summary": A complete, self-contained summary FOR THE PATIENT.
           - Language: {req.target_language}
           - Structure:
             - "clinical_guidelines": str (The reassuring advice text)
             - "symptoms_reported": [str] (List of symptoms acknowledged)
             - "symptoms_denied": [str] (List of symptoms denied)
             - "red_flags_to_watch_out_for": [str] (Warning signs to watch for)
             - "triage_level": "Green" | "Yellow" | "Red" (Simple color badge)
        
        2. "pre_doctor_consultation_summary": A structured clinical note FOR THE DOCTOR.
           - Language: ENGLISH ONLY. NEVER translate values here.
           - Format:
             - "trigger_reason": str (Short, bold title, e.g. "Severe Chest Pain")
             - "history": {{ "symptoms": [], "duration": str, "negatives": [] }}
             - "vitals_reported": dict (e.g. {{ "bp": "140/90" }} or {{ "bp": null }})
             - "assessment": {{ 
                  "likely_diagnosis": str, 
                  "severity_level": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                  "severity_score": int (0-100) 
               }}

             - "plan": {{ "immediate_actions": [], "referral_needed": bool }}
        
        SEVERITY SCORING (0-100):
        - CRITICAL (90-100): Life-threatening (Heart Attack, Stroke).
        - HIGH (70-89): Severe (Severe Dehydration, High Fever).
        - MEDIUM (40-69): Moderate (Flu, Migraine).
        - LOW (0-39): Mild (Cold).

        IMPORTANT SAFETY RULE:
        1. If severity is "CRITICAL" or "HIGH":
           - 'clinical_guidelines' MUST ONLY say: "Based on your symptoms, immediate doctor consultation is recommended." (Translated to {req.target_language}).
           - Do NOT mention "Heart Attack", "Stroke", "ER", "Deadly" or any panic-inducing terms in 'patient_summary'.
           - Keep the full specific diagnosis (e.g. "Myocardial Infarction") inside 'pre_doctor_consultation_summary' only.
        
        2. 'red_flags': ALWAYS populate this list with 3-5 specific "Watch for" warning signs relevant to the suspected condition.
        
        CONVERSATION:
        {conversation}
        
        OUTPUT JSON ONLY:
        {{
            "patient_summary": {{
                "clinical_guidelines": "...",
                "symptoms_reported": [...],
                "symptoms_denied": [...],
                "red_flags_to_watch_out_for": [...],
                "triage_level": "..."
            }},
            "pre_doctor_consultation_summary": {{ ... }}
        }}
        """
        
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": output_prompt}],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        res_json = json.loads(completion.choices[0].message.content)
        print(f"DEBUG: Full LLM Response Keys: {list(res_json.keys())}")
        print(f"DEBUG: Full LLM Response: {res_json}")
        
        # Robust Fallback: Check for new key, then old key, then default to empty dict
        doctor_summary = res_json.get("pre_doctor_consultation_summary") or res_json.get("doctor_struct") or {}

        return {
            "patient_summary": res_json.get("patient_summary", "Summary unavailable."),
            "pre_doctor_consultation_summary": doctor_summary
        }
        
    except Exception as e:
        print(f"Summary Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- PHASE 1.5: SUBGRAPHS ---
from app.agent.subgraphs.medical_records import medical_records_graph
from app.agent.subgraphs.doctor_consultation import doctor_consultation_graph

@app.post("/save_summary")
async def save_summary_endpoint(summary_data: dict):
    """
    Saves the summary using the Medical Records Subgraph.
    Input: { "patient_id": "...", "profile_id": "...", "patient_summary": "...", ... }
    """
    try:
        # V1.0: Use profile_id as primary, fallback to patient_id/session_id
        profile_id = summary_data.get("profile_id") or summary_data.get("patient_id", "anon_profile")
        
        fake_state: TriageState = {
            "profile_id": profile_id, # [NEW]
            "patient_profile": summary_data.get("patient_profile", {}),
            "triage_decision": summary_data.get("pre_doctor_consultation_summary", {}).get("assessment", {}).get("severity", "GREEN"),
            "final_advice": summary_data.get("patient_summary", ""),
            "investigated_symptoms": [],
            "session_id": profile_id, # keeping session_id aligned for now
            "case_id": summary_data.get("case_id"),
            "full_summary_payload": summary_data
        }
        
        # Invoke Subgraph
        result = await medical_records_graph.ainvoke(fake_state)
        return result
    except Exception as e:
        print(f"Save Summary Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/book_appointment")
async def book_appointment_endpoint(booking_req: dict):
    """
    Books an appointment using the Doctor Consultation Subgraph.
    Input: { "profile_id": "...", "doctor_id": "...", "slot_id": "..." }
    """
    try:
        fake_state: TriageState = {
            "session_id": booking_req.get("patient_id", "anon_patient"),
            "profile_id": booking_req.get("profile_id"), # [NEW]
            "case_id": booking_req.get("session_id"), # Case ID from frontend
            "triage_decision": booking_req.get("triage_decision", "PENDING"),
            "doctor_id": booking_req.get("doctor_id"),
            "slot_id": booking_req.get("slot_id"), # [NEW]
            "appointment_time": booking_req.get("appointment_time"),
            "consultation_mode": booking_req.get("consultation_mode"),
            "patient_name": booking_req.get("patient_name"),
            "patient_age": booking_req.get("patient_age"),
            "patient_gender": booking_req.get("patient_gender")
        }
        
        # Invoke Subgraph
        result = await doctor_consultation_graph.ainvoke(fake_state)
        return result
    except Exception as e:
        print(f"Booking Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from app.core.firebase import firebase_service

@app.get("/get_records")
async def get_records_endpoint(patient_id: Optional[str] = None, profile_id: Optional[str] = None, case_id: Optional[str] = None):
    """
    Retrieves medical records for a specific profile (V1.0).
    Aggregates from: Summaries, Prescriptions, Lab Reports.
    """
    try:
        target_id = profile_id or patient_id
        
        # Fetch from multiple V1.0 collections
        summaries = firebase_service.get_records("case_ai_patient_summaries", target_id, case_id)
        prescriptions = firebase_service.get_records("prescriptions", target_id, case_id)
        lab_reports = firebase_service.get_records("lab_reports", target_id, case_id)
        
        # Compatibility: Allow fetching old 'medical_records' too if needed, or just merge
        # For V1.0 migration, we prioritize the new ones.
        
        all_records = summaries + prescriptions + lab_reports
        
        # Sort by created_at desc
        all_records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {"records": all_records}
    except Exception as e:
        print(f"Get Records Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_record")
async def upload_record_endpoint(record_data: dict):
    """
    Saves a new medical record to Firebase.
    Input: { "patient_id": "...", "type": "...", "data": { ... } }
    """
    try:
        patient_id = record_data.get("patient_id")
        record_type = record_data.get("type", "general")
        data_payload = record_data.get("data", {})
        
        if not patient_id:
             raise HTTPException(status_code=400, detail="patient_id is required")

        new_record = {
            "record_id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "case_id": f"MR-{uuid.uuid4().hex[:6].upper()}",
            "type": record_type,
            "data": data_payload,
            "created_at": datetime.utcnow().isoformat()
        }
        
        firebase_service.save_record("medical_records", new_record)
        return {"status": "success", "record_id": new_record["record_id"]}
    except Exception as e:
        print(f"Upload Record Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

import requests

@app.get("/get_location")
async def get_location_endpoint(lat: float, lon: float):
    """
    Proxies request to Nominatim to avoid CORS and set User-Agent.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "User-Agent": "DocAI-Telemedicine-App/1.0 (hackathon-demo)"
        }
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"Nominatim Error: {resp.status_code} - {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch address from Nominatim")
    except Exception as e:
        print(f"Location Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_appointments")
async def get_appointments_endpoint(doctor_id: Optional[str] = None, patient_id: Optional[str] = None):
    try:
        print(f"DEBUG get_appointments: doctor_id={doctor_id}, patient_id={patient_id}")
        result = firebase_service.get_appointments(doctor_id, patient_id)
        print(f"DEBUG get_appointments: returning {len(result)} appointments")
        return result
    except Exception as e:
        print(f"Get Appointments Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/firebase_status")
async def debug_firebase_status():
    """Debug endpoint to check Firebase initialization status"""
    return {
        "mock_mode": firebase_service.mock_mode,
        "db_initialized": firebase_service.db is not None
    }

@app.get("/get_patients")
async def get_patients_endpoint(doctor_id: str):
    try:
        return firebase_service.get_patients(doctor_id)
    except Exception as e:
        print(f"Get Patients Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_emergencies")
async def get_emergencies_endpoint():
    try:
        return firebase_service.get_emergencies()
    except Exception as e:
        print(f"Get Emergencies Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get_doctors")
async def get_doctors_endpoint():
    """
    Returns list of all doctors.
    """
    try:
        print("DEBUG: /get_doctors endpoints called")
        doctors = firebase_service.get_doctors()
        print(f"DEBUG: /get_doctors returning {len(doctors)} doctors")
        return {"doctors": doctors}
    except Exception as e:
        print(f"Get Doctors Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_emergency_doctors")
async def get_emergency_doctors_endpoint(lat: float, lon: float):
    """
    Returns list of doctors sorted by availability and distance.
    """
    try:
        print(f"DEBUG: /get_emergency_doctors called with lat={lat}, lon={lon}")
        doctors = firebase_service.get_doctors_with_availability(lat, lon)
        return {"doctors": doctors}
    except Exception as e:
        print(f"Get Emergency Doctors Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get_doctor")
async def get_doctor_endpoint(doctor_id: str):
    """
    Returns a single doctor by ID.
    """
    try:
        doctor = firebase_service.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return doctor
    except Exception as e:
        print(f"Get Doctor Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_slot")
async def create_slot_endpoint(slot_data: dict):
    """
    Creates a new doctor slot.
    Input: { "doctor_id": "...", "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "status": "AVAILABLE" }
    """
    try:
        slot_id = firebase_service.create_slot(slot_data)
        if slot_id:
            return {"status": "success", "slot_id": slot_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to create slot")
    except Exception as e:
        print(f"Create Slot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_slot")
async def delete_slot_endpoint(slot_id: str):
    """
    Deletes a doctor slot by ID.
    Query Param: ?slot_id=...
    """
    try:
        success = firebase_service.delete_slot(slot_id)
        if success:
            return {"status": "success", "message": "Slot deleted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete slot")
    except Exception as e:
        print(f"Delete Slot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_slots_for_day")
async def delete_slots_for_day_endpoint(doctor_id: str, date: str):
    """
    Deletes all slots for a doctor on a specific date.
    Query Params: ?doctor_id=...&date=YYYY-MM-DD
    """
    try:
        success = firebase_service.delete_slots_for_day(doctor_id, date)
        if success:
            return {"status": "success", "message": f"All slots for {date} deleted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete slots")
    except Exception as e:
        print(f"Batch Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_all_slots_globally")
async def delete_all_slots_globally_endpoint():
    """
    Deletes ALL slots for ALL doctors in the database.
    WARNING: Destructive.
    """
    try:
        success = firebase_service.delete_all_slots_globally()
        if success:
            return {"status": "success", "message": "All slots in database deleted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete slots")
    except Exception as e:
        print(f"Global Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class BatchSlotRequest(BaseModel):
    doctor_id: str
    start_date: str # YYYY-MM-DD
    end_date: str # YYYY-MM-DD
    selected_days: List[str] # ["Mon", "Fri"]
    start_time: str # HH:MM
    end_time: str # HH:MM
    break_start: str # HH:MM
    break_end: str # HH:MM
    slot_duration_minutes: int = 30
    time_gap_minutes: int = 0  # NEW

@app.get("/get_case")
async def get_case_endpoint(case_id: str):
    try:
        print(f"DEBUG: /get_case called with case_id={case_id}")
        case_data = firebase_service.get_case(case_id)
        if not case_data:
             print(f"DEBUG: Case {case_id} not found")
             raise HTTPException(status_code=404, detail="Case not found")
        print(f"DEBUG: Found case data: {case_data}")
        return case_data
    except HTTPException as he:
        # Re-raise HTTP exceptions (e.g. 404)
        raise he
    except Exception as e:
        import traceback
        with open("backend_error.log", "w") as f:
            f.write(f"Error for case_id {case_id}: {str(e)}\n")
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_slots_batch")
async def create_slots_batch_endpoint(req: BatchSlotRequest):
    """
    Creates multiple slots based on a schedule.
    """
    try:
        count = firebase_service.create_batch_slots(
            req.doctor_id, 
            req.start_date, 
            req.end_date, 
            req.selected_days, 
            req.start_time, 
            req.end_time, 
            req.break_start, 
            req.break_end, 
            req.slot_duration_minutes,
            req.time_gap_minutes # NEW
        )
        return {"status": "success", "slots_created": count}
    except Exception as e:
        print(f"Batch Slot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_slots")
async def get_slots_endpoint(doctor_id: str):
    """
    Returns available slots for a doctor.
    """
    try:
        slots = firebase_service.get_doctor_slots(doctor_id)
        return {"slots": slots}
    except Exception as e:
        print(f"Get Slots Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_appointments")
async def get_appointments_endpoint(doctor_id: Optional[str] = None, patient_id: Optional[str] = None):
    """
    Returns list of appointments.
    - If doctor_id provided: Returns appointments for that doctor (with patient details).
    - If patient_id provided: Returns appointments for that patient (with doctor details).
    """
    try:
        return firebase_service.get_appointments(doctor_id=doctor_id, patient_id=patient_id)
    except Exception as e:
        print(f"Get Appointments Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- PHARMACY ENDPOINTS ---

@app.get("/pharmacy/inventory")
async def get_pharmacy_inventory():
    """
    Get all available medicines.
    """
    try:
        medicines = firebase_service.get_medicines()
        return {"medicines": medicines}
    except Exception as e:
        print(f"Inventory Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class OrderRequest(BaseModel):
    patient_id: str
    patient_name: Optional[str] = "Guest"
    items: List[dict] # [{ "id": "...", "name": "...", "price": 10, "qty": 1 }]
    total: float
    delivery_address: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

@app.post("/pharmacy/orders")
async def create_pharmacy_order(order: OrderRequest):
    """
    Place a new order.
    """
    try:
        order_data = order.dict()
        order_id = firebase_service.create_pharmacy_order(order_data)
        if order_id:
            return {"status": "success", "order_id": order_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to create order")
    except Exception as e:
        print(f"Create Order Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pharmacy/orders")
async def get_pharmacy_orders(patient_id: Optional[str] = None, status: Optional[str] = None):
    """
    Get orders (filterable by patient or status).
    """
    try:
        orders = firebase_service.get_pharmacy_orders(patient_id, status)
        return {"orders": orders}
    except Exception as e:
        print(f"Get Orders Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/pharmacy/orders/{order_id}")
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    """
    Update order status (e.g. PENDING -> READY).
    """
    try:
        success = firebase_service.update_order_status(order_id, update.status)
        if success:
            return {"status": "success", "message": "Order updated"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update order")
    except Exception as e:
        print(f"Update Order Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
