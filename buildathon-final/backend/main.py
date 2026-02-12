
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

@app.get("/")
async def root():
    return {"status": "ok", "message": "Agentic Doctor Backend Running"}

from chromadb.utils import embedding_functions

@app.on_event("startup")
async def startup_event():
    print("⬇️ STARTUP: Pre-loading ChromaDB Embedding Model...")
    try:
        # Check if local model exists (for Render caching)
        local_model_path = os.path.join(settings.project_root, "app", "models", "all-MiniLM-L6-v2")
        if os.path.exists(local_model_path):
             print(f"📂 Loading embedding model from LOCAL CACHE: {local_model_path}")
             ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=local_model_path)
        else:
             print("☁️ Local model not found. Downloading from HuggingFace...")
             ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

        # Run dummy inference to ensure weights are loaded
        ef(["test"])
        print("✅ STARTUP: Model loaded successfully.")
    except Exception as e:
        print(f"⚠️ STARTUP WARNING: Model load failed (will retry on first request): {e}")
async def root():
    return {"status": "ok", "message": "Agentic Doctor Backend Running"}

from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: str
    target_language: Optional[str] = "English"
    case_id: Optional[str] = None # [NEW]
    profile_id: Optional[str] = None # [NEW]

class ChatResponse(BaseModel):
    response: str
    decision: Optional[str] = "PENDING"
    detected_language: Optional[str] = None
    summary_payload: Optional[dict] = None

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    # Safe logging to prevent encoding crashes on Windows
    try:
        safe_msg = req.message[:20].encode('utf-8', 'ignore').decode('utf-8')
        print(f"DEBUG: Chat endpoint called. Target: '{req.target_language}', Message: '{safe_msg}...'", flush=True)
    except Exception as log_err:
        print(f"DEBUG: Chat endpoint called (logging failed: {log_err})", flush=True)
    try:
        config = {"configurable": {"thread_id": req.session_id}}
        
        # Invoke Graph
        # [FIX] Pass case_id and profile_id to state
        initial_state = {
            "messages": [HumanMessage(content=req.message)],
            "case_id": req.case_id,
            "profile_id": req.profile_id,
            "user_id": req.profile_id, # Fallback/Assumption for user_id too if needed
            "session_id": req.session_id
        }
        
        result = await agent_graph.ainvoke(initial_state, config=config)
        
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
from app.core.prescription_service import analyze_prescription_image
from app.core.lab_report_service import analyze_lab_report_image

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

@app.post("/analyze_prescription")
async def analyze_prescription_endpoint(file: UploadFile = File(...)):
    """
    Analyzes an uploaded prescription image.
    """
    print(f"DEBUG: Analyze Prescription called. Filename: {file.filename}")
    try:
        image_bytes = await file.read()
        analysis_result = await analyze_prescription_image(image_bytes)
        return analysis_result
    except Exception as e:
        print(f"Prescription Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_lab_report")
async def analyze_lab_report_endpoint(file: UploadFile = File(...)):
    """
    Analyzes an uploaded lab report image.
    """
    print(f"DEBUG: Analyze Lab Report called. Filename: {file.filename}")
    try:
        image_bytes = await file.read()
        analysis_result = await analyze_lab_report_image(image_bytes)
        return analysis_result
    except Exception as e:
        print(f"Lab Report Analysis Error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))

# --- NUTRITION AI ENDPOINTS ---
from app.core.nutrition_service import analyze_meal_text, get_nutrition_suggestion

class MealAnalysisRequest(BaseModel):
    description: str

class NutritionSuggestionRequest(BaseModel):
    profile: dict
    current_log: dict

@app.post("/analyze_meal")
async def analyze_meal_endpoint(req: MealAnalysisRequest):
    print(f"DEBUG: Analyze Meal called. Description: {req.description}")
    return await analyze_meal_text(req.description)

@app.post("/get_nutrition_suggestion")
async def nutrition_suggestion_endpoint(req: NutritionSuggestionRequest):
    print(f"DEBUG: Get Nutrition Suggestion called.")
    return await get_nutrition_suggestion(req.profile, req.current_log)

# --- DIET PLAN ENDPOINT ---
from app.core.nutrition_service import generate_diet_plan

class DietPlanRequest(BaseModel):
    profile: dict

@app.post("/generate_diet_plan")
async def generate_diet_plan_endpoint(req: DietPlanRequest):
    print(f"DEBUG: Generate Diet Plan called.")
    return await generate_diet_plan(req.profile)



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
           - INSTRUCTION: BASE YOUR CLINICAL GUIDELINES STRICTLY ON **NHSRC (National Health Systems Resource Centre. India)** AND **WHO (World Health Organization)** PROTOCOLS.
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
            "profile_id": profile_id,
            "user_id": summary_data.get("user_id"), # [NEW] Account Owner
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

@app.get("/init_session")
async def init_session_endpoint():
    """
    Generates a new Case ID and Session ID.
    Used by Frontend to start a fresh clinical session.
    """
    try:
        # [STANDARDIZED] Format: CASE-{UUID}
        # Old: CASE-{timestamp}-{short_uuid}
        # New: CASE-{12_char_upper_hex}
        # Using 12 chars provides 47 bits of entropy (16^12), sufficient for this scale without being too long.
        unique_id = uuid.uuid4().hex[:12].upper()
        case_id = f"CASE-{unique_id}"
        
        return {
            "case_id": case_id,
            "session_id": case_id # For now, session maps to case
        }
    except Exception as e:
        print(f"Init Session Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/book_appointment")
async def book_appointment_endpoint(booking_req: dict):
    print(f"DEBUG: book_appointment_endpoint received: {booking_req}", flush=True)
    """
    Books an appointment using the Doctor Consultation Subgraph.
    Input: { "profile_id": "...", "user_id": "...", "doctor_id": "...", "slot_id": "..." }
    """
    try:
        fake_state: TriageState = {
            "session_id": booking_req.get("patient_id", "anon_patient"),
            "profile_id": booking_req.get("profile_id"), # Patient (Family Member)
            "user_id": booking_req.get("user_id"),       # Account Owner
            "case_id": booking_req.get("session_id"), # Case ID from frontend (or passed as session_id)
            "triage_decision": "EMERGENCY" if booking_req.get("is_emergency") else booking_req.get("triage_decision", "PENDING"),
            "doctor_id": booking_req.get("doctor_id"),
            "slot_id": booking_req.get("slot_id"),
            "appointment_time": booking_req.get("appointment_time"),
            "consultation_mode": booking_req.get("consultation_mode"),
            "patient_name": booking_req.get("patient_name"),
            "patient_age": booking_req.get("patient_age"),
            "patient_gender": booking_req.get("patient_gender"),
            "pre_doctor_consultation_summary_id": booking_req.get("pre_doctor_consultation_summary_id") # [NEW]
        }
        
        # Invoke Subgraph
        result = await doctor_consultation_graph.ainvoke(fake_state)
        return result
    except Exception as e:
        print(f"Booking Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
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
        # Fetch from multiple V1.0 collections
        summaries = firebase_service.get_records("case_ai_patient_summaries", target_id, case_id)
        doctor_summaries = firebase_service.get_records("case_pre_doctor_summaries", target_id, case_id)
        legacy_summaries = firebase_service.get_records("pre_doctor_consultation_summaries", target_id, case_id)
        
        # [NEW] Fetch Completed Consultation Data
        case_prescriptions = firebase_service.get_records("case_prescriptions", target_id, case_id)
        case_remarks = firebase_service.get_records("case_doctor_remarks", target_id, case_id)
        
        prescriptions = firebase_service.get_records("prescriptions", target_id, case_id)
        lab_reports = firebase_service.get_records("lab_reports", target_id, case_id)
        
        # Compatibility: Allow fetching old 'medical_records' too if needed, or just merge
        # For V1.0 migration, we prioritize the new ones.
        
        all_records = summaries + doctor_summaries + legacy_summaries + case_prescriptions + case_remarks + prescriptions + lab_reports
        
        # Sort by created_at desc
        all_records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {"records": all_records}
    except Exception as e:
        print(f"Get Records Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_case")
async def get_case_endpoint(case_id: str):
    """
    Retrieves a single case by ID.
    Used for status synchronization.
    """
    try:
        case = firebase_service.get_case(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return case
    except Exception as e:
        print(f"Get Case Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_record")
async def upload_record_endpoint(record_data: dict):
    """
    Saves a new medical record to Firebase.
    Input: { "patient_id": "...", "type": "...", "data": { ... }, "case_id": "..." }
    """
    try:
        patient_id = record_data.get("patient_id")
        record_type = record_data.get("type", "general")
        data_payload = record_data.get("data", {})
        case_id = record_data.get("case_id") # [NEW]
        
        if not patient_id:
             raise HTTPException(status_code=400, detail="patient_id is required")

        # [SCHEMA CHANGE] Link to Case ID
        # Validation: If case_id is None/Empty, generate a fallback "MR-" but ideally frontend should pass it.
        final_case_id = case_id if case_id else f"MR-{uuid.uuid4().hex[:6].upper()}"

        # [NEW] Common Metadata (Title/Doctor) - Extract from 'data' payload if present
        # Frontend should send these inside 'data'
        doc_name = data_payload.get("doctor") or data_payload.get("doctor_name") or "Unknown Doctor"
        record_title = data_payload.get("title") or ("Prescription" if record_type == "PRESCRIPTION" else "Medical Record")

        # [NEW] Split Collections Logic
        if record_type == "PRESCRIPTION":
            saved_ids = []
            
            # 1. Save Prescriptions (Medicines)
            if data_payload.get("medicines"):
                med_record = {
                    "record_id": str(uuid.uuid4()),
                    "patient_id": patient_id,
                    "case_id": final_case_id,
                    "type": "PRESCRIPTION_MEDICINES",
                    "data": { 
                        "medicines": data_payload["medicines"], 
                        "timestamp": data_payload.get("timestamp"),
                        "doctor": doc_name, # [FIX] Persist Doctor
                        "title": "Prescription" # [FIX] Persist Title
                    },
                    "created_at": datetime.utcnow().isoformat()
                }
                rid = firebase_service.save_record("case_prescriptions", med_record)
                if rid:
                    saved_ids.append(rid)

            # 2. Save Doctor Remarks (Notes & Advice)
            if data_payload.get("remarks") or data_payload.get("advice"):
                notes_record = {
                    "record_id": str(uuid.uuid4()),
                    "patient_id": patient_id,
                    "case_id": final_case_id,
                    "type": "DOCTOR_REMARKS",
                    "data": { 
                        "remarks": data_payload.get("remarks"), 
                        "advice": data_payload.get("advice"),
                        "timestamp": data_payload.get("timestamp"),
                         "doctor": doc_name, # [FIX] Persist Doctor
                        "title": "Clinical Notes" # [FIX] Persist Title
                    },
                    "created_at": datetime.utcnow().isoformat()
                }
                rid = firebase_service.save_record("case_doctor_remarks", notes_record)
                if rid:
                    saved_ids.append(rid)
            
            if not saved_ids:
                 print("DEBUG: No medicines or remarks found in payload.")
                 # Don't error out, maybe they just clicked submit empty?
                 # But let's return success with warning
                 return {"status": "success", "message": "No data to save", "generated_ids": []}

            return {"status": "success", "generated_ids": saved_ids, "message": "Saved to separate collections"}

        else:
            # Default / Fallback for other types (e.g., generic medical records)
            new_record = {
                "record_id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "case_id": final_case_id,
                "type": record_type,
                "data": {
                    **data_payload,
                    "doctor": doc_name, # [FIX]
                    "title": record_title # [FIX]
                },
                "created_at": datetime.utcnow().isoformat()
            }
            
            rid = firebase_service.save_record("medical_records", new_record)
            if not rid:
                raise HTTPException(status_code=500, detail="Database Save Failed")
                
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
async def get_appointments_endpoint(doctor_id: Optional[str] = None, patient_id: Optional[str] = None, user_id: Optional[str] = None):
    try:
        print(f"DEBUG get_appointments: doctor_id={doctor_id}, patient_id={patient_id}, user_id={user_id}")
        result = firebase_service.get_appointments(doctor_id, patient_id, user_id)
        print(f"DEBUG get_appointments: returning {len(result)} appointments")
        return result
    except Exception as e:
        print(f"Get Appointments Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_patients")
async def get_patients_endpoint(doctor_id: str):
    """
    Retrieves a list of unique patients for a doctor based on their appointments.
    """
    try:
        # 1. Get all appointments for this doctor
        appointments = firebase_service.get_appointments(doctor_id=doctor_id)
        
        # 2. Extract Unique Patients
        patients_map = {}
        for apt in appointments:
            # 1. Resolve Patient ID
            # Priority: profile_id (V1) > patient_snapshot.id > patient_id (Legacy)
            snapshot = apt.get("patient_snapshot", {})
            pid = apt.get("profile_id") or snapshot.get("profile_id") or snapshot.get("id") or apt.get("patient_id")
            
            if not pid:
                continue
                
            # If already exists, maybe update 'lastVisit' if this apt is newer
            # For now, just ensure we have the patient details
            if pid not in patients_map:
                # 2. Resolve Patient Details
                name =  apt.get("patient_name") or snapshot.get("name") or "Unknown"
                age = apt.get("patient_age") or snapshot.get("age") or "?"
                gender = apt.get("patient_gender") or snapshot.get("gender") or "?"
                
                patients_map[pid] = {
                    "id": pid,
                    "name": name,
                    "age": age,
                    "gender": gender,
                    "lastVisit": apt.get("appointment_time") or apt.get("slot_time") or "Recently",
                    "condition": apt.get("reason") or "Routine Checkup",
                    "risk": "Medium",
                    "type": "Active",
                    "status": apt.get("status", "SCHEDULED"),
                    "caseId": apt.get("case_id"),
                    "appointmentId": apt.get("id")
                }
            else:
                 # Update status if this appointment is more recent or critical?
                 if apt.get("status") == "APPOINTMENT_IN_PROGRESS":
                     patients_map[pid]["status"] = "In Progress"
        
        return list(patients_map.values())

    except Exception as e:
        print(f"Get Patients Error: {e}")
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
        raw_emergencies = firebase_service.get_emergencies()
        # [FIX] Force filter in main.py to ensure completed cases are removed
        emergencies = []
        for e in raw_emergencies:
            # Check top-level status or nested appointment status
            status = e.get("status") or e.get("appointment_details", {}).get("status")
            if status not in ["CONSULTATION_ENDED", "COMPLETED"]:
                emergencies.append(e)
            else:
                 print(f"DEBUG MAIN: Filtered out {e.get('id')} with status {status}")
                 
        return emergencies
    except Exception as e:
        # [FORCE RELOAD 4]
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

@app.post("/update_doctor")
async def update_doctor_endpoint(doctor_data: dict):
    """
    Updates doctor profile data.
    Input: { "doctor_id": "...", "data": { ... } }
    """
    try:
        doctor_id = doctor_data.get("doctor_id")
        updates = doctor_data.get("data", {})
        
        if not doctor_id:
             raise HTTPException(status_code=400, detail="doctor_id is required")

        success = firebase_service.update_doctor(doctor_id, updates)
        if success:
            return {"status": "success", "message": "Doctor profile updated"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update doctor profile")
    except Exception as e:
        print(f"Update Doctor Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update_case_status")
async def update_case_status_endpoint(case_id: str, status: str):
    """
    Updates the status of a case and ensures timestamps are current.
    """
    try:
        print(f"DEBUG: Updating case {case_id} status to {status}")
        result = firebase_service.update_case_status(case_id, status)
        return result
    except Exception as e:
        print(f"Update Case Status Error: {e}")
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
async def get_slots_endpoint(doctor_id: str, status: Optional[str] = "AVAILABLE"):
    """
    Returns slots for a doctor. Defaults to "AVAILABLE".
    Pass status="ALL" to get booked/expired slots too.
    """
    try:
        slots = firebase_service.get_doctor_slots(doctor_id, status=status)
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


@app.post("/update_appointment_status")
async def update_appointment_status_endpoint(appointment_id: str, status: str):
    """
    Updates the status of an appointment (e.g. to APPOINTMENT_IN_PROGRESS).
    """
    try:
        print(f"DEBUG: Updating appointment {appointment_id} status to {status}")
        success = firebase_service.update_record("appointments", appointment_id, {"status": status})
        
        if success:
            return {"status": "success", "message": "Appointment status updated"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update appointment in Firebase")
    except Exception as e:
        print(f"Update Appointment Status Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)
