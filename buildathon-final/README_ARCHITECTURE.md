# 🏥 Agentic Doctor V2 - Architecture & Logic Documentation

This document provides a comprehensive overview of the **Agentic Doctor V2** system, explaining the architecture, agent workflow, data ingestion strategies ("Chunk Pattern"), and the reasoning logic used to triage patients.

---

## 🏗️ System Architecture

The application follows a modern decoupled architecture:

### 1. Frontend (Client)
*   **Tech Stack**: React, Vite, TailwindCSS.
*   **Role**: Handles user chat interaction, audio recording, and visualization.
*   **Communication**: Communicates with the backend via REST API (`/chat`, `/process_audio`, etc.) ensuring a smooth user experience.

### 2. Backend (Server)
*   **Tech Stack**: Python, FastAPI.
*   **Role**: Orchestrates the AI agent, handles request routing, and manages state.
*   **Core Components**:
    *   **LangGraph**: Manages the conversational state machine.
    *   **Groq (LLM)**: Provides high-speed inference (Llama 3 / GPT-OSS).
    *   **ChromaDB**: Vector search capability for medical guidelines.

---

## 🧠 The Agent Workflow (LangGraph)

The core intelligence is powered by **LangGraph**, which defines a state machine for the conversation. This ensures the agent follows a strict medical protocol rather than hallucinating freely.

### **The Flow:**
`Start` ➡️ `Emergency Scan` 🔷 ➡️ `Retrieval` ➡️ `Diagnostician` ➡️ `Strategist` ➡️ `End`

### **Node Breakdown:**

1.  **🚨 Emergency Scan (`emergency_scan_node`)**
    *   **Role**: The "Gatekeeper".
    *   **Logic**: Before doing anything else, it analyzes the user's latest message for life-threatening keywords (e.g., "unconscious", "chest pain", "blue lips").
    *   **Branching**:
        *   **IF DANGER**: Immediately interrupts the flow and returns an `EMERGENCY` alert.
        *   **IF SAFE**: Passes control to the Retrieval node.

2.  **📚 Retrieval (`retrieval_node`)**
    *   **Role**: The "Librarian".
    *   **Logic**: Uses the user's symptoms to search the **ChromaDB** vector store. It fetches relevant medical guidelines, reference info, and decision rules.

3.  **🩺 Diagnostician (`diagnostician_node`)**
    *   **Role**: The "Analyst".
    *   **Logic**: Considers the retrieved medical protocols and the patient's history. It updates the **Differential Diagnosis** (list of potential conditions) and identifies what information is missing.

4.  **🎯 Strategist (`strategist_node`)**
    *   **Role**: The "Planner".
    *   **Logic**: Decides the *very next step*.
        *   If critical info is missing -> **Generates a Question**.
        *   If diagnosis is clear -> **Proposes a Treatment Plan**.
        *   If stuck -> **Asks for Clarification**.

---

## 🧩 The Chunk Pattern (Smart Ingestion)

One of the most critical parts of this system is how it "reads" medical manuals (PDFs). We do not simply dump text into the database; we use a **Smart Chunking Strategy** to preserve context.

### **The Problem**
Standard chunking (splitting every 500 characters) cuts sentences in half and loses context. For example, a line saying *"Give 500mg Paracetamol"* is useless if you don't know it belongs to the *Fever* section.

### **The Solution: Semantic Topic-Based Chunking**
The `SmartChunker` (in `ingest_agentic.py`) parses the PDF with specific rules:

1.  **Topic detection**:
    *   The chunker scans for major headings like **"FEVER"**, **"COUGH"**, **"BURNS"**.
    *   It maintains a `current_topic` state. All text read is tagged with this topic.

2.  **Section Detection**:
    *   Within a topic, it looks for sub-headers:
        *   **RED FLAGS** (mapped to `decision_rules` collection).
        *   **MANAGEMENT** (mapped to `decision_rules` collection).
        *   **ASSESSMENT** (mapped to `reference_info` collection).

3.  **Metadata Enrichment**:
    *   Every chunk is saved with rich metadata:
        ```json
        {
          "protocol": "Fever",
          "section": "MANAGEMENT",
          "type": "decision_rules"
        }
        ```
    *   This allows the Retrieval node to say *"Get me the MANAGEMENT rules for FEVER"* specifically, rather than just fuzzy searching.

---

## 🗣️ Questioning Logic

The agent avoids repetitive or annoying questions using a `dedup` (deduplication) strategy:

1.  **State Tracking**: The `TriageState` object keeps a history of all structured fields collected so far (e.g., `has_fever=True`, `vomiting=False`).
2.  **Negative Filtering**: If the agent sees a symptom in the "Denied" list, it will not ask about it again.
3.  **Strategist Priority**: The Strategist node prioritizes **Risk Assessment** questions (Red Flags) over general curiosity. It will always rule out the worst-case scenario first.

---

## 🚀 How to Run

1.  **Backend**:
    ```bash
    cd backend
    source venv/bin/activate  # or .\venv\Scripts\activate on Windows
    pip install -r requirements.txt
    python main.py
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

Establishes a connection on `http://localhost:5173` talking to `http://localhost:8002`.
