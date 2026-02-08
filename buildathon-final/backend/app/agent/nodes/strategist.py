from typing import Dict, Any
from langchain_core.messages import AIMessage

def strategist_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    The Strategist:
    Strictly picks the next question from the Checklist.
    """
    checklist = state.get("safety_checklist", [])
    diagnosis = state.get("differential_diagnosis", [])
    
    if not checklist:
        # Assessment complete - generate summary
        diagnosis_text = ", ".join(diagnosis[:3]) if diagnosis else "routine condition"
        response_text = f"I have completed the assessment. Based on your answers, this appears to be: {diagnosis_text}. Please consult a healthcare provider for proper diagnosis and treatment."
        
        return {
            "triage_decision": "COMPLETE", 
            "final_response": response_text,
            "messages": [AIMessage(content=response_text)] # [FIX] Add to history
        }
    
    # Pick top item
    next_task = checklist[0]
    
    # LOGGING: Mark this as investigated so we don't ask again
    current_investigated = state.get("investigated_symptoms", [])
    current_investigated.append(next_task)
    
    # We could use an LLM to rephrase it politely, 
    # but for now, we just pass it to the bot to ask.
    return {
        "final_response": next_task,
        "investigated_symptoms": current_investigated,
        "messages": [AIMessage(content=next_task)] # [FIX] Add to history
    }
