# 📘 Doc AI - Technical Documentation

## 1. Project Overview

**Doc AI** is an advanced telemedicine platform designed to automate primary healthcare using AI agents. It bridges the gap between patients and doctors by determining urgency (triage), summarizing patient symptoms, and facilitating seamless consultations.

### Key Capabilities
- **AI-Powered Triage**: An intelligent agent analyzes patient symptoms to determine severity (Green/Yellow/Red).
- **Medical Records Management**: Centralized repository for prescriptions, lab reports, and AI summaries.
- **Doctor Dashboard**: A comprehensive interface for doctors to manage appointments, view patient profiles, and handle emergencies.
- **Multilingual Support**: Real-time translation of chat and audio inputs (supporting Indian languages like Hindi, Telugu, Tamil, etc.).
- **Family Profiles**: Manage healthcare for multiple family members under a single account.

---

## 2. System Architecture

The application follows a modern decoupled architecture:

### 2.1 Frontend (Client)
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (with scoped variables) + TailwindCSS concepts.
- **Routing**: `react-router-dom`
- **State Management**: React Context (`AuthContext`)
- **Key Modules**:
    - **Patient Portal**: Home, Consultation, Medical Files, Pharmacy.
    - **Doctor Portal**: Dashboard, Patients, Emergency Queue, Slot Manager.

### 2.2 Backend (Server)
- **Framework**: FastAPI (Python)
- **AI Orchestration**: LangGraph (Stateful Agent Workflows)
- **LLM Provider**: Groq (Llama 3 / GPT-OSS models)
- **Database**:
    - **Firestore (NoSQL)**: User data, Profiles, Appointments, Medical Records.
    - **ChromaDB (Vector)**: Semantic search for medical guidelines and protocols.

---

## 3. Core Components

### 3.1 The Agentic Workflow (LangGraph)
The core intelligence consists of a Directed Acyclic Graph (DAG) that processes patient inputs through specialized "Nodes".

**Workflow Steps:**
1.  **🚨 Emergency Scan**:
    -   *Logic*: Scans input for life-threatening keywords (e.g., "chest pain", "unconscious").
    -   *Action*: If critical, immediately halts flow and triggers an EMERGENCY alert.
2.  **📚 Retrieval Node**:
    -   *Logic*: Queries ChromaDB for relevant medical guidelines based on symptoms.
    -   *Purpose*: Grounds the AI's knowledge in verified medical protocols (RAG).
3.  **🩺 Diagnostician Node**:
    -   *Logic*: Analyzes symptoms + retrieved guidelines to form a "Differential Diagnosis".
    -   *Output*: Identifies missing information needed to confirm a condition.
4.  **🎯 Strategist Node**:
    -   *Logic*: Determines the next best action (Ask a Question, Propose Home Remedy, or Recommend Doctor).
    -   *Safety*: Prioritizes ruling out "Red Flags" before general information gathering.

### 3.2 Data Management (Schema v1.0)
The database is structured around "Cases" as the central source of truth.

-   **Users (`users`)**: Authentication data (Auth UID, Role).
-   **Profiles (`profiles`)**: Medical identities (Name, Age, Gender) linked to a User. Supports multiple profiles per user.
-   **Cases (`cases`)**: The central spine. Tracks the lifecycle of a medical episode (`status`, `is_emergency`, `language`).
-   **Details (`case_ai_patient_summaries`, `case_pre_doctor_summaries`)**:
    -   *Patient Summary*: Simplified, reassuring advice + Red Flags.
    -   *Pre-Doctor Summary*: Technical clinical note with severity scores (0-100) and differential diagnosis.
-   **Appointments (`appointments`)**: Linked to Case, Profile, and Doctor Slot.
-   **Doctor Slots (`doctor_slots`)**: Availability blocks with atomic locking.

---

## 4. Feature Details

### 4.1 Audio Processing & Translation
-   **Endpoint**: `/process_audio`
-   **Tech**: OpenAI Whisper (via Groq/API).
-   **Workflow**:
    1.  User speaks in native language (e.g., Telugu).
    2.  Audio is transcribed to native text.
    3.  Native text is translated to English for the Agent.
    4.  Agent thinks in English.
    5.  Agent response is translated back to native language for display.

### 4.2 Doctor Dashboard
-   **Live Analytics**: View patient queue and emergency alerts.
-   **Slot Management**: Create/Delete availability slots.
-   **Patient History**: Access past cases, AI summaries, and uploaded records (PDFs/Images).

### 4.3 Emergency Handling
-   If `Emergency Scan` triggers:
    -   The UI immediately shifts to an Emergency Mode.
    -   The `case` status updates to `EMERGENCY`.
    -   The case appears in the **Doctor's Emergency Queue** with high priority.

---

## 5. API Reference (Key Endpoints)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat` | Main entry point for Agent interaction. Accepts message & session ID. |
| `POST` | `/process_audio` | Upload audio file -> Returns transcription & translation. |
| `POST` | `/generate_summary` | Triggers LLM to generate Patient & Doctor summaries from chat history. |
| `GET` | `/get_records` | Fetches medical history for a profile (Summaries, Rxs, Labs). |
| `POST` | `/book_appointment` | Books a slot for a patient. |
| `GET` | `/get_doctors` | Fetches list of available doctors. |

---

## 6. Setup & Deployment

### Prerequisites
-   Node.js & npm
-   Python 3.10+
-   Firebase Project Credentials (`serviceAccountKey.json`)
-   Groq API Key

### Running Locally

**Backend**:
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python main.py
# Server runs on http://localhost:8003
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 7. Detailed File Reference

### 7.1 Backend Structure (`/backend`)

#### Core Application
-   **`main.py`**: The entry point of the FastAPI application. Defines all API endpoints (`/chat`, `/process_audio`, `/get_records`, etc.), handles CORS, and initializes the application.
-   **`requirements.txt`**: Lists all Python dependencies required to run the backend (FastAPI, LangGraph, Groq, Firebase Admin, etc.).
-   **`serviceAccountKey.json`**: (Sensitive) Firebase Admin SDK credentials. Required for database access.
-   **`AGENT_GRAPH_DIAGRAM.md`**: Text-based representation of the LangGraph workflow.
-   **`chatbot_agent_architecture.png`**: Visual diagram of the chatbot agent's architecture.
-   **`doctor_consultation_agent_architecture.png`**: Visual diagram of the doctor consultation workflow.
-   **`medical_records_agent_architecture.png`**: Visual diagram of the medical records processing workflow.

#### App Modules (`/app`)
-   **`app/core/config.py`**: Configuration settings using Pydantic `BaseSettings`. Loads environment variables (like API keys) safely.
-   **`app/core/firebase.py`**: `FirebaseService` class. Handles all interactions with Firestore (CRUD operations for users, cases, appointments). Includes a mock mode for testing without a live DB.

#### Agent Logic (`/app/agent`)
-   **`graph.py`**: Defines the main `StateGraph` (the brain). Connects nodes (Emergency -> Retrieval -> Diagnostician -> Strategist) and defines the conditional logic for edges.
-   **`state.py`**: Defines `TriageState` (TypedDict). This is the shared memory passed between nodes, containing conversation history, symptoms, and medical data.
-   **`nodes/emergency.py`**: `emergency_scan_node`. Validates input against a list of critical keywords to detect life-threatening situations immediately.
-   **`nodes/retrieval.py`**: `retrieval_node`. Uses the user's input to query ChromaDB and fetch relevant medical context (RAG).
-   **`nodes/diagnostician.py`**: `diagnostician_node`. The clinical reasoning engine. Analyzes gathered facts to form a differential diagnosis and identify missing info.
-   **`nodes/strategist.py`**: `strategist_node`. The decision maker. Decides whether to ask more questions, provide advice, or refer to a doctor based on the diagnosis confidence.
-   **`nodes/fact_extraction.py`**: Helper node to extract structured data (symptoms, duration) from natural language chat.

#### Subgraphs (`/app/agent/subgraphs`)
-   **`medical_records.py`**: `search_and_save_records` subgraph. Handles the logic for creating new Cases and saving AI-generated patient/doctor summaries to Firestore.
-   **`doctor_consultation.py`**: `doctor_consultation_graph`. Manages the appointment booking flow: checking slot availability, recommending doctors, and locking slots.

#### Scripts & Utilities (`/scripts` & Root)
-   **`debug_case.py`**: Utility to inspect the state of a specific Case ID in Firestore.
-   **`debug_doctors.py`**: Utility to verify Doctor documents in Firestore.
-   **`debug_users.py`**: Utility to check User authentication records.
-   **`fix_users_collection.py`**: One-time script to migration/fix user data schema.
-   **`check_profile_ids.py`**: verification script for profile ID integrity.
-   **`generate_graph.py`**: Script to generate the visual graph images (PNGs) from the LangGraph code.
-   **`scripts/init_v1_db.py`**: Database initialization script to seed initial collections (optional).
-   **`scripts/seed_doctors_to_firebase.py`**: Seeds the `doctors` and `doctor_slots` collections with sample data for testing.
-   **`scripts/verify_slots.py`**: Checks if doctor slots are correctly created and indexed.

---

### 7.2 Frontend Structure (`/frontend/src`)

#### Entry & Config
-   **`main.jsx`**: The React entry point. Mounts the `App` component to the DOM.
-   **`App.jsx`**: Main application component. Defines the global Routing (React Router) for Patient and Doctor portals.
-   **`firebase.js`**: Initializes the Firebase Client SDK (Auth, Firestore, Storage) for the frontend.
-   **`index.css`**: Global styles, including Tailwind directives and CSS variables for theming.

#### Context Providers (`/context`)
-   **`AuthContext.jsx`**: Manages global authentication state (`user`, `loading`, `role`). Provides `login`, `logout`, and `signup` methods to the entire app.

#### Common Components (`/components`)
-   **`Navbar.jsx`**: Responsive navigation bar. Shows different links based on user role (Patient vs Doctor).
-   **`ProtectedRoute.jsx`**: High-order component (HOC) to restrict access to pages based on login status and user role.
-   **`HealthHero.jsx`**: The main landing banner for the Patient Home page.
-   **`ConversationalAgent.jsx`**: The chat interface component. Handles text input, audio recording, and rendering of AI messages.
-   **`AppointmentBooking.jsx`**: UI for selecting doctors and time slots.
-   **`AudioConfirmationModal.jsx`**: UI for confirming/editing transcribed audio before sending.
-   **`FileViewerModal.jsx`**: Modal to preview PDF/Image reports.
-   **`ProfileModal.jsx`**: UI for creating or editing a patient profile.
-   **`ProfileRedirect.jsx`**: Logic component to handle routing after login (Patient vs Doctor).
-   **`UploadRecordModal.jsx`**: Component to handle file uploads to Firebase Storage.

#### Patient Pages (`/pages`)
-   **`Home.jsx`**: Patient Dashboard. Shows quick actions (Consult, Pharmacy, Records).
-   **`ConsultDoctor.jsx`**: Page to browse doctors or view my appointments.
-   **`DoctorDirectory.jsx`**: A searchable list of all doctors.
-   **`ClinicalChat.jsx`**: The core AI consultation page. Hosts the `ConversationalAgent`.
-   **`MedicalFiles.jsx`**: View showing all past prescriptions, reports, and summaries.
-   **`PatientSummary.jsx`**: Displays a specific AI-generated summary of a consultation.
-   **`Pharmacy.jsx`**: (Placeholder) Interface for ordering medicines.
-   **`EmergencyPage.jsx`**: High-contrast, urgent interface triggered by the "Emergency" button or AI detection.
-   **`Login.jsx` / `Signup.jsx`**: Authentication forms.
-   **`ProfileSelection.jsx`**: Screen to select which family member is using the app.
-   **`ProfileSetup.jsx`**: Onboarding screen to create the first profile.

#### Doctor Portal (`/doctor`)
-   **`DoctorLayout.jsx`**: Layout wrapper for all doctor pages (Sidebar + Content).
-   **`DoctorDashboard.jsx`**: Main doctor view. Shows "Patients in Queue", "Upcoming Appointments", and "Emergency Alerts".
-   **`DoctorPatients.jsx`**: List of all patients assigned to the doctor.
-   **`PatientDetail.jsx`**: Detailed view of a single patient (Demographics, History, AI Summaries).
-   **`DoctorEmergency.jsx`**: Dedicated high-priority view for active emergencies.
-   **`DoctorSlotManager.jsx`**: Interface for doctors to create/delete their availability slots.
-   **`DoctorMessages.jsx`**: (Stub) Direct messaging with patients.
-   **`DoctorReports.jsx`**: Analytics view for the doctor.
