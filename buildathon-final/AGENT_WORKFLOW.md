# Agent Architecture & Workflow

This document explains the internal working of our Medical Triage Agent. The agent is built using **LangGraph** and follows a structured, multi-step pipeline to ensure safe and accurate assessments.

## High-Level Overview

The agent operates as a **State Graph** (Directed Acyclic Graph for each turn). For every user message, the agent processes it through a sequence of specialized "Nodes".

**Flow:** `Emergency Scan` → `Retrieval` → `Diagnostician` → `Strategist`

## 1. Emergency Scan Node (`emergency_scan`)
**Goal:** strict safety check. Immediate short-circuit for life-threatening conditions.
- **Model:** `llama-3.3-70b-versatile` (via Groq)
- **Logic:**
    - Scans the user's latest message against a set of `emergency_rules.json` (e.g., "Fever + Neck Stiffness" for Meningitis).
    - If a **Red Flag** is detected, it triggers an `EMERGENCY` state immediately.
    - **Output:** Returns `triage_decision="EMERGENCY"` (stops graph) or `ROUTINE` (continues graph).

## 2. Retrieval Node (`retrieval`)
**Goal:** Fetch relevant medical protocols and guidelines.
- **Tool:** **ChromaDB** (Vector Database)
- **Logic:**
    - Uses the user's text to query the `decision_rules` collection.
    - Retrieves relevant medical protocols (e.g., "Protocol for Headache", " Pediatric Fever Guidelines").
    - **Output:** Adds `retrieved_protocols` (text chunks) to the state context.

## 3. Diagnostician Node (`diagnostician`)
**Goal:** The clinical "Brain". Formulates hypotheses and questions.
- **Model:** `openai/gpt-oss-120b` (via Groq)
- **Logic:**
    - Analyzes the User History + Retrieved Protocols.
    - **Initial Turn:** Generates a `differential_diagnosis` (list of potential conditions) and a `safety_checklist` (list of questions to ask).
    - **Follow-up Turns:** Analyzes the user's answer, removes the answered question from the checklist, and decides if *new* critical questions are needed.
    - **Deduplication:** Uses Python `difflib` to ensure it never asks the same question twice (checks against `investigated_symptoms` and chat history).
    - **Output:** Updates `safety_checklist` and `differential_diagnosis`.

## 4. Strategist Node (`strategist`)
**Goal:** The flow controller. Decides *exactly* what to say next.
- **Logic:** Deterministic (Python code, no LLM for reliability).
- **Process:**
    1. Checks the `safety_checklist`.
    2. **If Checklist has items:** Pops the top question and sets it as the `final_response`.
    3. **If Checklist is empty:** Generates a final advice summary based on the `differential_diagnosis`.
    4. **Memory:** Logs the asked question into `investigated_symptoms` to prevent future repetition.
- **Output:** Sets `final_response` which is sent to the user.

## Data State (`TriageState`)
The agent maintains a typed state object throughout the turn:
```python
class TriageState(TypedDict):
    messages: List[BaseMessage]       # Chat History
    patient_profile: PatientProfile   # Age, Symptoms, etc.
    retrieved_protocols: List[str]    # RAG Context
    safety_checklist: List[str]       # Questions queued to be asked
    investigated_symptoms: List[str]  # Questions already asked
    triage_decision: str              # "EMERGENCY", "ROUTINE", "COMPLETE"
```

## Key Technologies
- **LangGraph:** Orchestration framework.
- **Groq:** High-speed inference for Llama and GPT-OSS models.
- **ChromaDB:** Vector store for medical knowledge RAG.
