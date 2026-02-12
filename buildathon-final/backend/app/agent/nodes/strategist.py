from typing import Dict, Any
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from app.core.config import settings
import json

# Initialize LLM for Summary Generation
llm_summary = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=settings.GROQ_API_KEY,
    temperature=0
)

def strategist_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    The Strategist:
    1. Picks the next question from the Checklist.
    2. If Checklist is empty, Generates the FINAL SUMMARY (Node 2.5 Logic).
    """
    checklist = state.get("safety_checklist", [])
    
    if not checklist:
        # --- ASSESSMENT COMPLETE: GENERATE SUMMARY ---
        try:
            messages = state.get("messages", [])
            history_list = [f"{m.type}: {m.content}" for m in messages[-20:]]
            history_str = "\n".join(history_list)
            
            diagnosis = state.get("differential_diagnosis", [])
            diagnosis_str = ", ".join(diagnosis) if diagnosis else "Undetermined viral/bacterial infection"
            
            facts = state.get("investigated_facts", {})
            facts_str = json.dumps(facts, indent=2)

            print("DEBUG: Generating Final Patient Summary...")

            prompt = f"""
            You are a Senior Medical AI. The triage interview is complete.
            
            PATIENT HISTORY:
            {history_str}
            
            CLINICAL FACTS:
            {facts_str}
            
            POTENTIAL DIAGNOSIS: {diagnosis_str}
            
            TASK:
            Generate a FINAL PATIENT SUMMARY JSON.
            1. "triage_level": "Green" (Non-Emergency) or "Yellow" (Consult).
            2. "clinical_guidelines": Standard NHSRC/WHO home care advice for the symptoms.
            3. "red_flags_to_watch_out_for": List 3 specific worsening signs that would require immediate ER visit.
               (e.g., "Difficulty breathing", "Persistent high fever > 3 days", "Confusion").
               This is ADVICE for the patient to watch out for in the FUTURE.
            4. "symptoms_reported": List of confirmed symptoms.
            5. "symptoms_denied": List of denied symptoms.
            
            OUTPUT JSON ONLY:
            {{
                "triage_level": "Green",
                "clinical_guidelines": "...",
                "red_flags_to_watch_out_for": ["...", "..."],
                "symptoms_reported": ["..."],
                "symptoms_denied": ["..."],
                "follow_up": "Monitor for 24 hours. Consult if symptoms worsen."
            }}
            """
            
            response = llm_summary.invoke([
                SystemMessage(content="You are a strict JSON output bot."),
                HumanMessage(content=prompt)
            ])
            
            result_str = response.content.replace("```json", "").replace("```", "").strip()
            summary_json = json.loads(result_str)
            
            # Construct the final polite message
            final_msg = f"Assessment Complete. \n\n**Advice:** {summary_json.get('clinical_guidelines')}\n\n**Monitor for:** {', '.join(summary_json.get('red_flags_to_watch_out_for', []))}. \n\nYou can view your full report in the Medical Files."

            return {
                "triage_decision": "COMPLETE", 
                "final_response": final_msg,
                "messages": [AIMessage(content=final_msg)],
                # SAVE THE PAYLOAD FOR THE "SAVE SUMMARIES" NODE
                "full_summary_payload": {
                    "patient_summary": summary_json
                },
                "final_advice": summary_json.get('clinical_guidelines')
            }

        except Exception as e:
            print(f"Error generating summary: {e}")
            fallback_msg = "Assessment Complete. Please consult a doctor."
            return {
                "triage_decision": "COMPLETE",
                "final_response": fallback_msg,
                "messages": [AIMessage(content=fallback_msg)]
            }
    
    # --- ROUTINE PROGRESSION ---
    # Pick top item
    next_task = checklist[0]
    
    # LOGGING: Mark this as investigated so we don't ask again
    current_investigated = state.get("investigated_symptoms", [])
    current_investigated.append(next_task)
    
    return {
        "final_response": next_task,
        "investigated_symptoms": current_investigated,
        "messages": [AIMessage(content=next_task)]
    }
