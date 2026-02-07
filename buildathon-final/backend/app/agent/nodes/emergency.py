from typing import Dict, Any
import json
import os
from langchain_groq import ChatGroq
from app.core.config import settings
from langchain_core.messages import SystemMessage, HumanMessage

# Initialize LLM for fast scanning
llm_scanner = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=settings.GROQ_API_KEY,
    temperature=0
)

def emergency_scan_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Scans the LATEST user message for life-threatening keywords/conditions.
    Uses 'emergency_rules.json' context and LLM judgment.
    """
    try:
        messages = state.get("messages", [])
        if not messages:
            return {"triage_decision": "PENDING"} 
            
        last_user_msg = messages[-1].content
        
        # 1. Load Custom Rules if available
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        rules_path = os.path.join(base_dir, "emergency_rules.json")
        rules_context = ""
        
        if os.path.exists(rules_path):
             with open(rules_path, "r") as f:
                emergency_rules = json.load(f)
                # Summarize rules for prompt
                rules_context = json.dumps(emergency_rules[:5]) 

        # 3. Contextual Analysis (Fix for "Yes" answers)
        # If user says "Yes", we MUST know what they are saying "Yes" to.
        # We grab the last AI message.
        last_ai_msg = ""
        for m in reversed(messages):
            if m.type == 'ai':
                last_ai_msg = m.content
                break
        
        context_prompt = f"LAST QUESTION ASKED: '{last_ai_msg}'\nUSER ANSWER: '{last_user_msg}'"
        
        # DEFINITION OF HISTORY_STR (Restored)
        history_str = "\n".join([f"{m.type}: {m.content}" for m in messages[-5:]])
        
        prompt = f"""
        You are an EMERGENCY TRIAGE NURSE.
        Your Job: Scan the conversation for life-threatening emergencies.
        
        RULES (JSON):
        {rules_context}
        
        CONVERSATION CONTEXT:
        {context_prompt}

        FULL HISTORY:
        {history_str}
        
        CRITICAL CHECKS:
        1. **MENINGITIS:** Fever + Neck Stiffness = EMERGENCY.
        2. **HEART ATTACK:** Chest pain + Sweating/Radiating pain = EMERGENCY.
        3. **STROKE:** Slurred speech, weakness = EMERGENCY.
        
        TASK:
        - Analyze the "USER ANSWER" in the context of "LAST QUESTION ASKED".
        - If Last Question was "Do you have neck stiffness?" and User says "Yes", TRIGGER EMERGENCY immediately.
        - Do not wait for further confirmation.
        
        OUTPUT JSON ONLY:
        {{
            "is_emergency": true/false,
            "reason": "Explain why (e.g., 'Fever + Neck Stiffness suggests Meningitis')",
            "action": "Immediate Action required"
        }}
        """
        

        
        response = llm_scanner.invoke([
            SystemMessage(content="You are a strict JSON output bot."),
            HumanMessage(content=prompt)
        ])
        
        result_str = response.content.replace("```json", "").replace("```", "").strip()
        result = json.loads(result_str)
        
        if result.get("is_emergency"):
            print(f"🚨 EMERGENCY SCAN DETECTED: {result.get('reason')}")
            
            # --- NEW: GENERATE PAYLOAD IMMEDIATELY ---
            # We need to create the 'pre_doctor_consultation_summary' NOW so it can be saved.
            try:
                payload_prompt = f"""
                You are an Emergency Medical Scribe.
                The patient has a confirmed EMERGENCY: "{result.get('reason')}".
                
                TASK: Generate a structured JSON object for the Doctor's Emergency Dashboard.
                
                CONTEXT:
                {history_str}
                
                OUTPUT JSON (Strictly this structure):
                {{
                    "pre_doctor_consultation_summary": {{
                        "trigger_reason": "{result.get('reason')}", 
                        "assessment": {{
                            "likely_diagnosis": "Emergency Condition (Triage)", 
                            "severity_level": "CRITICAL",
                            "severity_score": 95
                        }},
                        "history": {{
                            "symptoms": ["(Extract from history)"], 
                            "duration": "Acute", 
                            "negatives": []
                        }},
                        "vitals_reported": {{ "bp": null }},
                        "red_flags": ["Life Threatening Condition Detected"],
                        "plan": {{ "immediate_actions": ["ER Admission"], "referral_needed": true }}
                    }},
                    "patient_summary": "🚨 EMERGENCY DETECTED. Please go to the nearest hospital immediately."
                }}
                """
                
                payload_response = llm_scanner.invoke([
                    SystemMessage(content="You are a strict JSON output bot."),
                    HumanMessage(content=payload_prompt)
                ])
                
                payload_json = json.loads(payload_response.content.replace("```json", "").replace("```", "").strip())
                full_summary = payload_json.get("pre_doctor_consultation_summary")
                
            except Exception as payload_err:
                print(f"⚠️ Failed to generate Emergency Payload: {payload_err}")
                # Fallback Payload
                full_summary = {
                    "trigger_reason": result.get('reason'),
                    "assessment": { "severity_level": "CRITICAL", "severity_score": 99 },
                    "red_flags": ["System Backend Failure - Check Logs"]
                }

            return {
                "triage_decision": "EMERGENCY",
                "final_response": "🚨 **EMERGENCY DETECTED**\n\nBased on your symptoms, we strongly recommend seeing a doctor immediately. We have flagged this as a high priority.\n\n**ACTION:** Immediate Consultation Recommended.",
                "full_summary_payload": full_summary # <--- PASSING THE DATA
            }
        
        # If safe, return ROUTINE so graph continues
        return {"triage_decision": "ROUTINE"}
        
    except Exception as e:
        print(f"⚠️ Emergency Scan Error: {e}")
        return {"triage_decision": "ROUTINE"} # Fail-open to allow chat
