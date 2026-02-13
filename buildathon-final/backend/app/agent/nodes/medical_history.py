from typing import Dict, Any, List
from app.core.config import settings
from groq import Groq
import json

client = Groq(api_key=settings.GROQ_API_KEY)

def simple_invoke(prompt):
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b", # Using the capable model for complex synthesis
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )
    return completion.choices[0].message.content

def medical_history_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    The Medical History Agent:
    1. Reads existing patient history (if any).
    2. Ingests new consultation data (Doctor Remarks, Prescriptions).
    3. Synthesizes an updated, structured medical history.
    """
    print("DEBUG: Medical History Agent Triggered")
    
    # Inputs from State
    existing_history = state.get("patient_medical_history", {})
    new_consultation = state.get("current_consultation_data", {})
    
    # Extract specific data points
    remarks = new_consultation.get("remarks", {})
    prescriptions = new_consultation.get("prescriptions", [])
    consultation_date = new_consultation.get("consultation_date", "Today") # [NEW]
    
    # Format for Prompt
    existing_history_str = json.dumps(existing_history, indent=2) if existing_history else "No prior history recorded."
    
    remarks_str = f"Clinical Notes: {remarks.get('remarks', 'None')}\nAdvice: {remarks.get('advice', 'None')}"
    
    meds_list = []
    if prescriptions:
        # Prescriptions might be a list of records, or a single record with 'medicines' list
        # We need to flatten/extract medicines
        for rx in prescriptions:
             # handle if rx is the record object or the data object
             data = rx.get("data", rx) 
             meds = data.get("medicines", [])
             for m in meds:
                 meds_list.append(f"{m.get('name')} ({m.get('dosage')}) - {m.get('duration')}")
    
    meds_str = ", ".join(meds_list) if meds_list else "None"

    # THE PROMPT
    prompt = f"""
    You are an expert Medical Scribe and Clinical Data Specialist.
    Your task is to update a patient's Structured Medical History based on data from a RECENTLY CONCLUDED CONSULTATION.
    
    ### INPUT DATA
    
    1. **EXISTING MASTER HISTORY** (JSON):
    {existing_history_str}
    
    2. **NEW CONSULTATION DATA** (Date: {consultation_date}):
    - {remarks_str}
    - Prescribed Medicines: {meds_str}
    
    ### INSTRUCTIONS
    
    Update the Master History JSON with the new findings. Follow these STRICT rules:
    
    1. **CHRONIC vs ACUTE:**
       - **Chronic Conditions:** (e.g., Diabetes, Hypertension). If found, add/update in `chronic_conditions`.
         - Set `last_checked`: "{consultation_date}".
         - If NEW, set `diagnosed_date`: "{consultation_date}".
       - **Acute Issues:** (e.g., Viral Fever). Add to `past_consultations`.
         - Set `date`: "{consultation_date}".
       
    2. **ALLERGIES:**
       - If the doctor explicitly notes allergies, update the `allergies` list.
       
    3. **MEDICATIONS:**
       - Update `current_medications` with the new prescriptions.
       
    4. **NO DUPLICATES:**
       - If "Hypertension" is already in chronic conditions, do not add it again. You can update its 'status' or 'last_checked' date.
       
    5. **INTELLIGENT INFERENCE:**
       - If the note says "Diag: T2DM", infer "Type 2 Diabetes Mellitus" (Chronic).
       - If the note says "Fever x 3 days", infer "Viral Fever" or "Pyrexia" (Acute).
    
    ### OUTPUT STRUCTURE (JSON ONLY)
    
    {{
      "chronic_conditions": [
        {{ "condition": "Hypertension", "status": "Active", "diagnosed_date": "YYYY-MM-DD", "last_checked": "{consultation_date}" }}
      ],
      "allergies": ["Penicillin"],
      "past_consultations": [
         {{ "date": "{consultation_date}", "diagnosis": "Viral Fever", "type": "Acute", "doctor_notes": "Summary of notes" }}
         // ... keep previous entries
      ],
      "surgical_history": [],
      "family_history": []
    }}
    
    **IMPORTANT:** Return the FULL updated JSON history. Merge new data with the old.
    """
    
    try:
        result_str = simple_invoke(prompt)
        print(f"DEBUG: Medical History Agent Output:\n{result_str}")
        result = json.loads(result_str.replace("```json", "").replace("```", "").strip())
        
        return {"updated_patient_history": result}
        
    except Exception as e:
        print(f"Error in Medical History Agent: {e}")
        # Return existing history unchanged on error to be safe
        return {"updated_patient_history": existing_history}
