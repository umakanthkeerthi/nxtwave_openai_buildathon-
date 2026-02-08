from typing import Dict, Any, List
from app.core.config import settings
from groq import Groq
import json

client = Groq(api_key=settings.GROQ_API_KEY)

def fact_extraction_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts structured facts from the latest user message to prevent repetitive questioning.
    Updates 'investigated_facts' with key-value pairs of what we know.
    """
    print("DEBUG: Entering fact_extraction_node...")
    messages = state.get("messages", [])
    if not messages:
        print("DEBUG: No messages found in state.")
        return {}
    
    # Only analyze the latest interaction (efficiency)
    last_user_msg = messages[-1]
    if last_user_msg.type != "human": 
        # If last message wasn't human (e.g. interrupt or system), skip
        return {}

    # NEW: Get the PREVIOUS AI message to provide context
    # Iterate backwards to find the last AI message (skip human/system/tool messages)
    last_ai_msg_content = "None (Start of conversation)"
    for msg in reversed(messages[:-1]): # Start from second to last
        if msg.type == "ai":
            last_ai_msg_content = msg.content
            break
            
    print(f"DEBUG: Fact Context - AI Asked: '{last_ai_msg_content[:50]}...' -> User Answered: '{last_user_msg.content}'")

    current_facts = state.get("investigated_facts", {})
    
    prompt = f"""
    You are a Clinical Fact Extractor.
    
    TASK:
    Analyze the user's latest response in the context of the AI's previous question.
    Extract precise medical facts found in the interaction.
    Update the "Known Facts" list.
    
    CONTEXT:
    AI ASKED: "{last_ai_msg_content}"
    USER ANSWERED: "{last_user_msg.content}"
    
    EXISTING FACTS: {json.dumps(current_facts, indent=2)}
    
    INSTRUCTIONS:
    1. Extract new facts based on the USER'S ANSWER to the AI'S QUESTION.
    2. IMPLIED CONTEXT: If User says "No", look at what the AI asked.
       - AI: "Do you have rash?" -> User: "No" -> Fact: "rash": "Denied"
    3. COMPOUND QUESTIONS: Split combined symptoms into separate facts.
       - AI: "Do you have rash OR chills?" -> User: "No" -> Facts: "rash": "Denied", "chills": "Denied"
       - User: "I have rash but no chills" -> Facts: "rash": "Present", "chills": "Denied"
    4. Normalize keys to snake_case (e.g. "Neck Stiffness" -> "neck_stiffness").
    5. Return ONLY the JSON of *NEW or UPDATED* facts.
    
    OUTPUT JSON ONLY:
    {{
        "travel_history": "None",
        "fever_severity": "High",
        "rash": "Denied",
        "chills": "Denied"
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b", # Fast model
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        new_facts = json.loads(completion.choices[0].message.content)
        
        # Merge with existing facts
        updated_facts = {**current_facts, **new_facts}
        
        print("\n" + "="*40)
        print("📝 CURRENT CLINICAL FACT SHEET")
        print("="*40)
        print(json.dumps(updated_facts, indent=2))
        print("="*40 + "\n")
        
        return {"investigated_facts": updated_facts}
        
    except Exception as e:
        print(f"Error in Fact Extraction: {e}")
        return {} # Fail silently, don't break graph
