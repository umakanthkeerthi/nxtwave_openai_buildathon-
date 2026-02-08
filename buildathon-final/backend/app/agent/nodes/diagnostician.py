from typing import Dict, Any
from app.core.config import settings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Using OpenAI Client for GPT-OSS-120b (as per original successful config)
from groq import Groq
import json # [FIX] Add global import

client = Groq(api_key=settings.GROQ_API_KEY)

def simple_invoke(prompt):
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )
    return completion.choices[0].message.content

def diagnostician_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    The Diagnostician:
    1. Analyzes symptoms.
    2. Updates the Safety Checklist (The Plan).
    3. Generates Differential Diagnosis.
    """
    messages = state.get("messages", [])
    protocols = state.get("retrieved_protocols", [])
    current_checklist = state.get("safety_checklist", [])
    
    
    # Context
    history_list = [f"{m.type}: {m.content}" for m in messages[-20:]]
    history_str = "\n".join(history_list)
    knowledge = "\n\n".join(protocols)
    
    # Structured Memory
    investigated = state.get("investigated_symptoms", [])
    investigated_facts = state.get("investigated_facts", {})
    
    investigated_str = ", ".join(investigated)
    facts_str = json.dumps(investigated_facts, indent=2) if investigated_facts else "None"
    
    # --- LOGIC SPLIT ---
    if not current_checklist:
        # INITIAL MODE: Ask LLM to generate the checklist
        prompt = f"""
        You are an Expert Diagnostic AI conducting a focused medical assessment.
        
        PATIENT HISTORY:
        {history_str}
        
        KNOWN CLINICAL FACTS (DO NOT ASK ABOUT THESE):
        {facts_str}
        
        MEDICAL KNOWLEDGE (Guidelines):
        {knowledge}
        
        TASK:
        Based on the patient's SPECIFIC symptom, create a FOCUSED assessment plan.
        1. Identify potential conditions.
        2. Create 2-3 TARGETED, SINGLE-TOPIC questions.
        3. Ask questions that help rule out serious conditions.
        
        CRITICAL RULES:
        - CHECK HISTORY & FACTS: Do NOT ask about questions already mentioned in HISTORY or EXISTING FACTS.
        - ONE SYMPTOM PER QUESTION: Do not group symptoms unless necessary.
        - PARTIAL KNOWLEDGE: If you want to ask "Do you have X or Y?", check if X is already known. If X is "Denied", ask ONLY "Do you have Y?".
        
        OUTPUT JSON:
        {{
            "differential_diagnosis": ["Viral fever", "Malaria"],
            "new_questions": ["How many days have you had the fever?", "Any neck stiffness?", "Any difficult breathing?"],
        }}
        """
        try:
            # [FIX] Removed redundant local import
            result_str = simple_invoke(prompt)
            print(f"DEBUG: Initial Diagnosis Output:\n{result_str}")
            result = json.loads(result_str.replace("```json", "").replace("```", "").strip())
            
            new_questions = result.get("new_questions", [])
            # Deduplicate against history broadly (simple string check)
            final_checklist = [q for q in new_questions if q.lower() not in history_str.lower()]
            
            return {
                "differential_diagnosis": result.get("differential_diagnosis", []),
                "safety_checklist": final_checklist,
                "triage_decision": "PENDING"
            }
        except Exception as e:
            print(f"Error in Initial Diagnosis: {e}")
            return {}

    else:
        # FOLLOW-UP MODE: Manual State Management
        # 1. Remove the Question that was just asked (Index 0)
        just_asked = current_checklist[0]
        remaining_checklist = current_checklist[1:]
        
        # 2. Ask LLM if any NEW critical questions are needed based on the latest answer
        prompt = f"""
        You are an Expert Diagnostic AI.
        
        PATIENT HISTORY:
        {history_str}

        KNOWN CLINICAL FACTS (DO NOT ASK ABOUT THESE):
        {facts_str}
        
        MEDICAL KNOWLEDGE:
        {knowledge}
        
        FULL CONVERSATION HISTORY (Read carefully):
        {history_str}
        
        PENDING CHECKLIST: {remaining_checklist}
        LAST QUESTION ASKED: "{just_asked}"
        
        TASK:
        The user answered the last question.
        1. Review the HISTORY above carefully.
        2. Do you need to add CRITICAL questions to narrow the diagnosis? (Max 2-3).
        3. CRITICAL: DO NOT ASK ANY QUESTION THAT HAS ALREADY BEEN ASKED IN THE HISTORY OR FACTS.
           - Example: If history says "User: No neck stiffness", DO NOT ask "Do you have neck stiffness?".
        4. PARTIAL KNOWLEDGE: If you want to ask "Do you have X or Y?", check if X is already known. 
           - If X is "Denied", ask ONLY "Do you have Y?".
        
        OUTPUT JSON:
        {{
            "differential_diagnosis": ["Viral fever", "Malaria"],
            "new_questions_to_add": ["Any convulsions?"] (OR [] if none),
            "stop_asking": false
        }}
        """
        
        try:
            # [FIX] Removed redundant local import
            result_str = simple_invoke(prompt)
            print(f"DEBUG: Follow-up Output:\n{result_str}")
            result = json.loads(result_str.replace("```json", "").replace("```", "").strip())
            
            new_additions = result.get("new_questions_to_add", [])
            
            # 3. ROBUST PYTHON DEDUPLICATION
            # The LLM failed to follow the "Do not repeat" instruction.
            # We must enforce this with code.
            
            import difflib
            
            def is_similar(a, b, threshold=0.6):
                """Check if strings are similar using SequenceMatcher"""
                return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio() > threshold

            # Gather all "Forbidden" questions (History + Investigated List)
            investigated = state.get("investigated_symptoms", [])
            
            # Also extract questions from recent AI messages in history
            message_history_texts = [m.content for m in messages if m.type == 'ai']
            
            forbidden_list = investigated + message_history_texts
            
            cleaned_new_questions = []
            
            for new_q in new_additions:
                # 1. Skip if empty
                if not new_q or len(new_q) < 5: 
                    continue
                    
                is_dup = False
                for forbidden in forbidden_list:
                    # Check similarity
                    if is_similar(new_q, forbidden):
                        print(f"DEBUG: Deduped '{new_q}' vs '{forbidden}'")
                        is_dup = True
                        break
                
                # Double check against remaining checklist (don't add duplicates to current list)
                for existing_planned in remaining_checklist:
                     if is_similar(new_q, existing_planned):
                         is_dup = True
                         break
                
                if not is_dup:
                    cleaned_new_questions.append(new_q)
            
            # Combine
            updated_checklist = remaining_checklist + cleaned_new_questions
            
            # Check for completion
            # If checklist empty and no valid new questions -> COMPLETE
            status = "COMPLETE" if not updated_checklist and not remaining_checklist else "PENDING"
            if result.get("stop_asking"): status = "COMPLETE"
            
            if status == "COMPLETE":
                 updated_checklist = []
            
            return {
                "differential_diagnosis": result.get("differential_diagnosis", []),
                "safety_checklist": updated_checklist,
                "triage_decision": status 
            }
            
        except Exception as e:
            print(f"Error in Follow-up: {e}")
            return {"safety_checklist": remaining_checklist} 
