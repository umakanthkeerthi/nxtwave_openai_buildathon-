# DocAI - Complete Project Documentation

> **Last Updated:** 2026-02-10  
> **Version:** 1.0  
> **Tech Stack:** FastAPI (Backend) + React (Frontend) + Firebase (Database) + LangGraph (AI Agent)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Documentation](#backend-documentation)
3. [Frontend Documentation](#frontend-documentation)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Communication Flow](#communication-flow)

---

## System Overview

DocAI is a telemedicine platform that automates primary healthcare through AI-powered triage, doctor consultation booking, and medical record management.

### Architecture

```
┌─────────────┐      HTTP/REST      ┌──────────────┐      Firestore      ┌──────────────┐
│   React     │ ◄─────────────────► │   FastAPI    │ ◄─────────────────► │   Firebase   │
│  Frontend   │                     │   Backend    │                     │   Database   │
└─────────────┘                     └──────────────┘                     └──────────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  LangGraph   │
                                    │  AI Agent    │
                                    └──────────────┘
```

### Key Features
- **AI Clinical Triage**: Multi-turn conversation with symptom analysis
- **Emergency Detection**: Automatic red-flag identification
- **Doctor Consultation**: Slot booking with availability checking
- **Medical Records**: AI-generated summaries and file management
- **Multi-Profile Support**: Family member profiles under one account

---

## Backend Documentation

### Core Files

#### 1. `main.py`
**Purpose:** Main FastAPI application entry point. Defines all HTTP endpoints.

**Key Endpoints:**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/chat` | POST | AI clinical conversation | `{message, session_id, target_language}` | `{response, decision, summary_payload}` |
| `/translate_text` | POST | Translate text to English | `{message, session_id}` | `{english_text, detected_language}` |
| `/process_audio` | POST | Transcribe and translate audio | `audio file, language_hint` | `{repaired_text, english_text}` |
| `/generate_summary` | POST | Generate patient summary | `{history, target_language}` | `{patient_summary, pre_doctor_consultation_summary}` |
| `/save_summary` | POST | Save medical record | `{profile_id, patient_summary, ...}` | `{status, case_id}` |
| `/book_appointment` | POST | Book doctor appointment | `{profile_id, doctor_id, slot_id, ...}` | `{status, appointment_id}` |
| `/get_doctors` | GET | Get all doctors | - | `{doctors: [...]}` |
| `/get_emergency_doctors` | GET | Get nearby available doctors | `?lat=...&lon=...` | `{doctors: [...]}` (sorted by availability & distance) |
| `/get_doctor` | GET | Get single doctor | `?doctor_id=...` | `{id, name, specialty, ...}` |
| `/get_slots` | GET | Get doctor's available slots | `?doctor_id=...` | `{slots: [...]}` |
| `/create_slot` | POST | Create single slot | `{doctor_id, date, start_time, end_time}` | `{status, slot_id}` |
| `/create_slots_batch` | POST | Create multiple slots | `{doctor_id, start_date, end_date, selected_days, ...}` | `{status, slots_created}` |
| `/delete_slot` | DELETE | Delete slot | `?slot_id=...` | `{status}` |
| `/get_appointments` | GET | Get appointments | `?doctor_id=...` or `?patient_id=...` | `[{id, doctor_name, patient_name, ...}]` |
| `/get_records` | GET | Get medical records | `?profile_id=...&case_id=...` | `{records: [...]}` |
| `/upload_record` | POST | Upload medical file | `{patient_id, type, data}` | `{status, record_id}` |
| `/get_case` | GET | Get case details | `?case_id=...` | `{id, status, triage_decision, ...}` |
| `/get_location` | GET | Reverse geocode coordinates | `?lat=...&lon=...` | `{display_name, address, ...}` |

**Communication:**
- **Frontend:** Receives HTTP requests from React app
- **Database:** Calls `firebase_service` methods to interact with Firestore
- **AI Agent:** Invokes `agent_graph.ainvoke()` for clinical conversations

---

#### 2. `app/core/firebase.py`
**Purpose:** Firebase service layer. Handles all Firestore database operations.

**Key Methods:**

| Method | Purpose | Input | Output |
|--------|---------|-------|--------|
| `save_record(collection, data)` | Save document to collection | collection name, data dict | document ID |
| `get_records(collection, patient_id, case_id)` | Fetch records with filters | collection, optional filters | list of records |
| `get_doctors()` | Fetch all doctors | - | list of doctor objects |
| `get_doctors_with_availability(lat, lon)` | Fetch doctors sorted by availability & distance | latitude, longitude | sorted list of doctors with `distance` and `availableTime` |
| `get_doctor(doctor_id)` | Fetch single doctor | doctor ID | doctor object |
| `get_doctor_slots(doctor_id)` | Fetch available slots for doctor | doctor ID | list of slots |
| `create_slot(slot_data)` | Create availability slot | slot data dict | slot ID |
| `create_batch_slots(...)` | Create multiple slots | doctor_id, date range, work hours, etc. | count of created slots |
| `delete_slot(slot_id)` | Delete slot | slot ID | boolean success |
| `get_appointments(doctor_id, patient_id)` | Fetch appointments with enrichment | optional filters | list of appointments |
| `get_case(case_id)` | Fetch case by ID | case ID | case object |
| `update_document(collection, doc_id, data)` | Update document | collection, ID, data | boolean success |
| `_calculate_distance(lat1, lon1, lat2, lon2)` | Calculate distance using Haversine formula | coordinates | distance in km |

**Communication:**
- **main.py:** Called by API endpoints
- **Firestore:** Direct connection via `firebase_admin` SDK
- **Collections Used:** `doctors`, `doctor_slots`, `appointments`, `cases`, `case_ai_patient_summaries`, `profiles`, `users`

**Special Features:**
- **Mock Mode:** Falls back to mock data if Firebase credentials not found
- **Enrichment:** Automatically enriches appointments with doctor/patient details
- **Availability Detection:** Checks current time against slot times for "Available Now" status
- **Distance Calculation:** Uses Haversine formula for geographic distance

---

#### 3. `app/core/config.py`
**Purpose:** Configuration management. Loads environment variables.

**Key Settings:**
- `GROQ_API_KEY`: API key for Groq LLM
- `FIREBASE_CREDENTIALS_PATH`: Path to Firebase service account key

**Communication:**
- **main.py:** Imported for API keys
- **.env file:** Reads environment variables

---

#### 4. `app/agent/graph.py`
**Purpose:** Main LangGraph agent definition. Orchestrates the clinical conversation flow.

**Graph Structure:**
```
START → emergency_check → [Emergency? → emergency_node : diagnostician_node]
                                ↓                           ↓
                          triage_decision            triage_decision
                                ↓                           ↓
                              END                         END
```

**Nodes:**
- `emergency_check`: Detects red flags
- `emergency_node`: Handles emergency cases
- `diagnostician_node`: Conducts symptom investigation
- `triage_decision`: Final triage classification

**Communication:**
- **main.py:** Invoked via `/chat` endpoint
- **Subgraphs:** Calls medical_records and doctor_consultation subgraphs
- **LLM:** Uses Groq API for AI responses

---

#### 5. `app/agent/nodes/emergency.py`
**Purpose:** Emergency detection node. Identifies critical symptoms.

**Logic:**
- Loads emergency rules from `emergency_rules.json`
- Checks for red flags in patient messages
- Returns `EMERGENCY` decision if critical symptoms detected

**Communication:**
- **graph.py:** Called as a node in the main graph
- **emergency_rules.json:** Reads red flag patterns

---

#### 6. `app/agent/nodes/diagnostician.py`
**Purpose:** Symptom investigation node. Conducts multi-turn clinical conversation.

**Logic:**
- Asks follow-up questions about symptoms
- Builds comprehensive symptom profile
- Generates triage decision (GREEN/YELLOW/RED)

**Communication:**
- **graph.py:** Called as a node in the main graph
- **LLM:** Uses Groq for intelligent questioning

---

#### 7. `app/agent/subgraphs/medical_records.py`
**Purpose:** Medical records management subgraph. Saves AI summaries to Firestore.

**Flow:**
```
START → save_summary_node → END
```

**Nodes:**
- `save_summary_node`: Saves patient summary and pre-doctor consultation summary to `case_ai_patient_summaries` collection

**Communication:**
- **main.py:** Invoked via `/save_summary` endpoint
- **firebase.py:** Calls `save_record()` to persist data

---

#### 8. `app/agent/subgraphs/doctor_consultation.py`
**Purpose:** Doctor consultation booking subgraph. Creates appointments in Firestore.

**Flow:**
```
START → book_appointment_node → END
```

**Nodes:**
- `book_appointment_node`: Creates appointment with patient snapshot, updates slot status

**Communication:**
- **main.py:** Invoked via `/book_appointment` endpoint
- **firebase.py:** Calls `save_record()` and `update_document()`

---

### Utility Scripts

#### 9. `admin_register_doctor.py`
**Purpose:** CLI tool to register doctors in Firestore.

**Usage:** `python admin_register_doctor.py`

**Communication:**
- **Firestore:** Directly writes to `doctors` collection

---

#### 10. `scripts/seed_doctors_to_firebase.py`
**Purpose:** Seed script to populate Firestore with sample doctors.

**Communication:**
- **Firestore:** Batch writes to `doctors` collection
- **mock_doctors.json:** Reads sample data

---

#### 11. `scripts/clear_data.py`
**Purpose:** Database cleanup script. Deletes all data except users, profiles, and doctors.

**Communication:**
- **Firestore:** Batch deletes from collections

---

### Debug Scripts

#### 12-16. `debug_*.py` files
**Purpose:** Debugging utilities to inspect Firestore data.

- `debug_case.py`: List all cases
- `debug_doctors.py`: List all doctors
- `debug_profile.py`: Inspect user profiles
- `debug_slots.py`: Count doctor slots
- `debug_users.py`: List all users

---

## Frontend Documentation

### Core Files

#### 1. `src/App.jsx`
**Purpose:** Main React application component. Defines routing structure.

**Routes:**

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Home` | Landing page |
| `/login` | `Login` | Patient login |
| `/signup` | `Signup` | Patient registration |
| `/profiles` | `ProfileSelection` | Select/create family profiles |
| `/profile-setup` | `ProfileSetup` | Create new profile |
| `/patient` | `Home` (with Navbar) | Patient dashboard |
| `/patient/clinical-chat` | `ClinicalChat` | AI symptom checker |
| `/patient/consult` | `ConsultDoctor` | Doctor directory |
| `/patient/consult/directory` | `DoctorDirectory` | Full doctor list |
| `/patient/consult/my-appointments` | `MyAppointments` | Appointment history |
| `/patient/medical-files` | `MedicalFiles` | Medical records |
| `/patient/pharmacy` | `Pharmacy` | Pharmacy (placeholder) |
| `/patient/emergency` | `EmergencyPage` | Emergency care finder |
| `/doctor/login` | `DoctorLogin` | Doctor portal login |
| `/doctor/*` | Doctor portal routes | Doctor dashboard, patients, slots |

**Communication:**
- **AuthContext:** Uses `useAuth()` for authentication state
- **React Router:** Manages navigation

---

#### 2. `src/context/AuthContext.jsx`
**Purpose:** Authentication context provider. Manages user state and Firebase Auth.

**State:**
- `currentUser`: Firebase Auth user + Firestore user data + profiles array
- `selectedProfile`: Currently active family member profile

**Methods:**
- `signup(email, password)`: Create account
- `login(email, password)`: Sign in
- `loginWithGoogle()`: Google OAuth
- `logout()`: Sign out
- `selectProfile(profileId)`: Switch active profile

**Communication:**
- **Firebase Auth:** User authentication
- **Firestore:** Fetches user data from `users` and `profiles` collections
- **localStorage:** Persists selected profile ID

---

#### 3. `src/firebase.js`
**Purpose:** Firebase client initialization.

**Exports:**
- `auth`: Firebase Auth instance
- `db`: Firestore instance
- `googleProvider`: Google OAuth provider

**Communication:**
- **Firebase SDK:** Initializes connection to Firebase project

---

### Page Components

#### 4. `src/pages/ClinicalChat.jsx`
**Purpose:** AI clinical conversation interface. Main symptom checker.

**Features:**
- Multi-turn chat with AI agent
- Audio recording and transcription
- Language selection (9 Indian languages + English)
- Emergency detection
- Summary generation

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/chat` | On message send | Get AI response |
| `/process_audio` | On audio recording | Transcribe speech |
| `/generate_summary` | On "Generate Summary" | Create patient summary |
| `/save_summary` | After summary generation | Save to Firestore |

**Communication:**
- **Backend:** HTTP requests to `/chat`, `/process_audio`, `/generate_summary`
- **AuthContext:** Gets `currentUser` for profile_id
- **React Router:** Navigates to `/patient/consult` or `/patient/emergency` based on triage

---

#### 5. `src/pages/EmergencyPage.jsx`
**Purpose:** Emergency alert page. Shown when AI detects critical symptoms.

**Features:**
- Warning message
- "Immediately Consult Doctor" button
- "Cancel" button

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/save_summary` | On "Consult" click | Save emergency case |

**Communication:**
- **Backend:** Saves emergency event
- **React Router:** Navigates to `/patient/consult/directory` with `type: 'emergency'` and `userLocation`

---

#### 6. `src/pages/ConsultDoctor.jsx`
**Purpose:** Doctor consultation page. Lists doctors and handles booking.

**Features:**
- Doctor search and filtering
- Emergency mode (sorted by availability & distance)
- Standard mode (categorized lists)
- Appointment booking modal

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/get_doctors` | On mount (standard mode) | Fetch all doctors |
| `/get_emergency_doctors` | On mount (emergency mode) | Fetch sorted doctors |
| `/book_appointment` | On booking confirmation | Create appointment |

**Communication:**
- **Backend:** Fetches doctors, creates appointments
- **AuthContext:** Gets `currentUser` for patient details
- **React Router:** Receives `location.state` for emergency mode and triage summary

**Modes:**
- **Standard:** Shows categorized doctor lists (Recent, Near You, Top Rated)
- **Emergency:** Shows sorted list (Available Now first, then by distance)

---

#### 7. `src/pages/DoctorDirectory.jsx`
**Purpose:** Full doctor directory with search and filters.

**Features:**
- Search by name/specialty
- Filter by specialty
- Sort by rating/distance
- Pagination

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/get_doctors` | On mount | Fetch all doctors |

**Communication:**
- **Backend:** Fetches doctors
- **React Router:** Navigates to doctor detail pages

---

#### 8. `src/pages/MyAppointments.jsx`
**Purpose:** Patient appointment history.

**Features:**
- List of upcoming and past appointments
- Appointment status (Confirmed, Completed, Cancelled)
- Doctor details

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/get_appointments` | On mount | Fetch patient appointments |

**Communication:**
- **Backend:** Fetches appointments with `patient_id` filter
- **AuthContext:** Gets `currentUser.uid` for filtering

---

#### 9. `src/pages/MedicalFiles.jsx`
**Purpose:** Medical records management. View and upload files.

**Features:**
- Timeline view of medical records
- File upload (PDF, images)
- AI-generated summaries
- Case filtering

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/get_records` | On mount | Fetch medical records |
| `/upload_record` | On file upload | Save new record |

**Communication:**
- **Backend:** Fetches and uploads records
- **AuthContext:** Gets `selectedProfile.profile_id` for filtering

---

#### 10. `src/pages/ProfileSelection.jsx`
**Purpose:** Family profile selection screen.

**Features:**
- List of family member profiles
- Create new profile button
- Switch between profiles

**Communication:**
- **AuthContext:** Uses `currentUser.profiles` and `selectProfile()`
- **React Router:** Navigates to `/profile-setup` or `/patient`

---

#### 11. `src/pages/ProfileSetup.jsx`
**Purpose:** Create new family member profile.

**Features:**
- Form for profile details (name, age, gender, relation, blood group)
- Validation

**API Calls:**
- **Firestore Direct:** Writes to `profiles` collection via Firebase SDK

**Communication:**
- **Firestore:** Direct write to `profiles` collection
- **AuthContext:** Gets `currentUser.uid` for `owner_uid`

---

### Component Files

#### 12. `src/components/Navbar.jsx`
**Purpose:** Top navigation bar for patient portal.

**Features:**
- Logo and branding
- Navigation links (Medical Files, Consult, Pharmacy, Medications)
- Notifications icon
- Profile icon (opens ProfileModal)

**Communication:**
- **React Router:** Uses `<Link>` for navigation
- **ProfileModal:** Opens modal on profile icon click

---

#### 13. `src/components/ProfileModal.jsx`
**Purpose:** User profile modal. Shows profile details and location.

**Features:**
- Profile information (name, email, age, gender, blood group)
- Current location (reverse geocoded)
- Sign out button
- Switch profile button

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/get_location` | On modal open | Reverse geocode coordinates |

**Communication:**
- **Backend:** Fetches location name
- **AuthContext:** Uses `selectedProfile` for profile data, `logout()` for sign out

---

#### 14. `src/components/AppointmentBooking.jsx`
**Purpose:** Appointment booking modal. Slot selection and confirmation.

**Features:**
- Calendar date picker
- Slot time selection
- Booking confirmation

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/get_slots` | On date selection | Fetch available slots |
| `/book_appointment` | On confirmation | Create appointment |

**Communication:**
- **Backend:** Fetches slots, creates appointment
- **Parent Component:** Receives `doctor` prop, calls `onConfirm` callback

---

#### 15. `src/components/DoctorCard.jsx`
**Purpose:** Reusable doctor card component.

**Features:**
- Doctor photo, name, specialty
- Rating, experience, consultation fee
- "Book Appointment" button

**Communication:**
- **Parent Component:** Receives `doctor` prop, calls `onBook` callback

---

#### 16. `src/components/DoctorGridCarousel.jsx`
**Purpose:** Horizontal scrollable doctor grid.

**Features:**
- Responsive grid layout
- Scroll buttons
- Section title

**Communication:**
- **DoctorCard:** Renders multiple `DoctorCard` components

---

#### 17. `src/components/SymptomEvaluator.jsx`
**Purpose:** Quick symptom checker widget. Redirects to ClinicalChat.

**Features:**
- Symptom input field
- "Start Evaluation" button

**Communication:**
- **React Router:** Navigates to `/patient/clinical-chat`

---

#### 18. `src/components/UploadRecordModal.jsx`
**Purpose:** Medical file upload modal.

**Features:**
- File drag-and-drop
- File type validation
- Upload progress

**API Calls:**

| Endpoint | When | Purpose |
|----------|------|---------|
| `/upload_record` | On file upload | Save file metadata |

**Communication:**
- **Backend:** Uploads file metadata
- **Parent Component:** Calls `onUploadComplete` callback

---

#### 19. `src/components/ProtectedRoute.jsx`
**Purpose:** Route guard component. Redirects unauthenticated users.

**Communication:**
- **AuthContext:** Checks `currentUser` state
- **React Router:** Redirects to `/login` if not authenticated

---

### Doctor Portal Components

#### 20-37. `src/doctor/*` files
**Purpose:** Doctor portal pages and components.

**Key Pages:**
- `DoctorDashboard.jsx`: Doctor home page
- `DoctorPatients.jsx`: Patient list
- `DoctorSlotManager.jsx`: Availability management
- `DoctorAppointments.jsx`: Appointment list

**API Calls:**
- `/get_appointments?doctor_id=...`: Fetch doctor's appointments
- `/get_patients?doctor_id=...`: Fetch doctor's patients
- `/get_slots?doctor_id=...`: Fetch doctor's slots
- `/create_slot`: Create single slot
- `/create_slots_batch`: Create multiple slots
- `/delete_slot`: Delete slot

**Communication:**
- **Backend:** All doctor-related endpoints
- **AuthContext:** Gets `currentUser.doctor_id`

---

## Database Schema

### Firestore Collections

#### 1. `users`
**Purpose:** User authentication data.

**Fields:**
- `uid` (document ID): Firebase Auth UID
- `email`: User email
- `role`: "patient" or "doctor"
- `created_at`: Timestamp

**Relationships:**
- One-to-many with `profiles` (via `owner_uid`)

---

#### 2. `profiles`
**Purpose:** Family member profiles.

**Fields:**
- `profile_id` (document ID): Auto-generated
- `owner_uid`: Reference to `users` document
- `fullName`: Profile name
- `age`: Age
- `gender`: Gender
- `bloodGroup`: Blood group
- `relation`: Relation to account owner
- `dob`: Date of birth
- `is_active`: Boolean
- `created_at`: Timestamp

**Relationships:**
- Many-to-one with `users` (via `owner_uid`)
- One-to-many with `appointments` (via `profile_id`)
- One-to-many with `case_ai_patient_summaries` (via `profile_id`)

---

#### 3. `doctors`
**Purpose:** Doctor profiles.

**Fields:**
- `id` (document ID): Auto-generated
- `name`: Doctor name
- `email`: Doctor email
- `specialization`: Medical specialty
- `experience`: Years of experience
- `qualification`: Degrees
- `consultation_fee`: Fee amount
- `rating`: Average rating
- `image`: Profile photo URL
- `latitude`: Location latitude
- `longitude`: Location longitude
- `created_at`: Timestamp

**Relationships:**
- One-to-many with `doctor_slots` (via `doctor_id`)
- One-to-many with `appointments` (via `doctor_id`)

---

#### 4. `doctor_slots`
**Purpose:** Doctor availability slots.

**Fields:**
- `id` (document ID): Auto-generated
- `doctor_id`: Reference to `doctors` document
- `date`: Date (YYYY-MM-DD)
- `start_time`: Start time (HH:MM)
- `end_time`: End time (HH:MM)
- `status`: "AVAILABLE" or "BOOKED"
- `created_at`: Timestamp

**Relationships:**
- Many-to-one with `doctors` (via `doctor_id`)
- One-to-one with `appointments` (via `slot_id`)

---

#### 5. `appointments`
**Purpose:** Booked appointments.

**Fields:**
- `id` (document ID): Auto-generated
- `profile_id`: Reference to `profiles` document
- `doctor_id`: Reference to `doctors` document
- `slot_id`: Reference to `doctor_slots` document
- `case_id`: Reference to `cases` document (optional)
- `appointment_time`: Datetime
- `consultation_mode`: "video" or "in-person"
- `status`: "CONFIRMED", "COMPLETED", "CANCELLED"
- `patient_snapshot`: Embedded patient data
  - `name`: Patient name
  - `age`: Patient age
  - `gender`: Patient gender
- `created_at`: Timestamp

**Relationships:**
- Many-to-one with `profiles` (via `profile_id`)
- Many-to-one with `doctors` (via `doctor_id`)
- One-to-one with `doctor_slots` (via `slot_id`)
- Many-to-one with `cases` (via `case_id`)

---

#### 6. `cases`
**Purpose:** Medical cases (triage sessions).

**Fields:**
- `case_id` (document ID): Auto-generated
- `profile_id`: Reference to `profiles` document
- `status`: Case status
- `triage_decision`: Triage level
- `created_at`: Timestamp

**Relationships:**
- Many-to-one with `profiles` (via `profile_id`)
- One-to-many with `appointments` (via `case_id`)
- One-to-one with `case_ai_patient_summaries` (via `case_id`)

---

#### 7. `case_ai_patient_summaries`
**Purpose:** AI-generated patient summaries.

**Fields:**
- `id` (document ID): Auto-generated
- `profile_id`: Reference to `profiles` document
- `case_id`: Reference to `cases` document
- `patient_summary`: Patient-facing summary
  - `clinical_guidelines`: Advice text
  - `symptoms_reported`: List of symptoms
  - `symptoms_denied`: List of denied symptoms
  - `red_flags_to_watch_out_for`: Warning signs
  - `triage_level`: "Green", "Yellow", "Red"
- `pre_doctor_consultation_summary`: Doctor-facing summary
  - `trigger_reason`: Chief complaint
  - `history`: Symptom history
  - `vitals_reported`: Vital signs
  - `assessment`: Diagnosis and severity
  - `plan`: Treatment plan
- `created_at`: Timestamp

**Relationships:**
- Many-to-one with `profiles` (via `profile_id`)
- One-to-one with `cases` (via `case_id`)

---

## API Reference

### Authentication Endpoints

**Not Implemented (Uses Firebase Auth SDK directly in frontend)**

---

### Clinical AI Endpoints

#### POST `/chat`
**Purpose:** AI clinical conversation.

**Request:**
```json
{
  "message": "I have a headache",
  "session_id": "session_123",
  "target_language": "English"
}
```

**Response:**
```json
{
  "response": "I understand you have a headache. How long have you had it?",
  "decision": "PENDING",
  "detected_language": "English",
  "summary_payload": null
}
```

---

#### POST `/translate_text`
**Purpose:** Translate text to English.

**Request:**
```json
{
  "message": "मुझे सिरदर्द है",
  "session_id": "session_123"
}
```

**Response:**
```json
{
  "english_text": "I have a headache",
  "detected_language": "Hindi"
}
```

---

#### POST `/process_audio`
**Purpose:** Transcribe and translate audio.

**Request:**
- `audio`: Audio file (multipart/form-data)
- `language_hint`: Language code (e.g., "hi")
- `target_language`: Target language (e.g., "Hindi")

**Response:**
```json
{
  "repaired_text": "मुझे सिरदर्द है",
  "english_text": "I have a headache",
  "detected_language": "Hindi"
}
```

---

#### POST `/generate_summary`
**Purpose:** Generate patient summary from conversation.

**Request:**
```json
{
  "history": [
    {"sender": "user", "text": "I have a headache"},
    {"sender": "ai", "text": "How long have you had it?"},
    {"sender": "user", "text": "2 days"}
  ],
  "target_language": "English"
}
```

**Response:**
```json
{
  "patient_summary": {
    "clinical_guidelines": "Rest and hydration recommended...",
    "symptoms_reported": ["Headache"],
    "symptoms_denied": ["Fever", "Nausea"],
    "red_flags_to_watch_out_for": ["Severe pain", "Vision changes"],
    "triage_level": "Green"
  },
  "pre_doctor_consultation_summary": {
    "trigger_reason": "Headache",
    "history": {
      "symptoms": ["Headache"],
      "duration": "2 days",
      "negatives": ["No fever", "No nausea"]
    },
    "assessment": {
      "likely_diagnosis": "Tension headache",
      "severity_level": "LOW",
      "severity_score": 25
    }
  }
}
```

---

### Medical Records Endpoints

#### POST `/save_summary`
**Purpose:** Save AI summary to Firestore.

**Request:**
```json
{
  "profile_id": "profile_123",
  "patient_summary": {...},
  "pre_doctor_consultation_summary": {...},
  "case_id": "CASE-1234"
}
```

**Response:**
```json
{
  "status": "success",
  "case_id": "CASE-1234"
}
```

---

#### GET `/get_records`
**Purpose:** Fetch medical records.

**Query Params:**
- `profile_id`: Profile ID (optional)
- `patient_id`: Patient ID (optional, legacy)
- `case_id`: Case ID (optional)

**Response:**
```json
{
  "records": [
    {
      "id": "record_123",
      "type": "AI_SUMMARY",
      "data": {...},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST `/upload_record`
**Purpose:** Upload medical file.

**Request:**
```json
{
  "patient_id": "patient_123",
  "type": "LAB_REPORT",
  "data": {
    "file_url": "https://...",
    "file_name": "blood_test.pdf"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "record_id": "record_456"
}
```

---

### Doctor Endpoints

#### GET `/get_doctors`
**Purpose:** Fetch all doctors.

**Response:**
```json
{
  "doctors": [
    {
      "id": "doctor_123",
      "name": "Dr. John Doe",
      "specialization": "Cardiology",
      "experience": 10,
      "rating": 4.5,
      "consultation_fee": 500,
      "image": "https://..."
    }
  ]
}
```

---

#### GET `/get_emergency_doctors`
**Purpose:** Fetch doctors sorted by availability and distance.

**Query Params:**
- `lat`: Latitude
- `lon`: Longitude

**Response:**
```json
{
  "doctors": [
    {
      "id": "doctor_123",
      "name": "Dr. Emily Brown",
      "specialization": "ENT",
      "distance": 3.2,
      "availableTime": "Available Now",
      "is_available_now": true
    },
    {
      "id": "doctor_456",
      "name": "Dr. Michael Williams",
      "distance": 6.7,
      "availableTime": "Today, 14:30",
      "is_available_now": false
    }
  ]
}
```

---

#### GET `/get_doctor`
**Purpose:** Fetch single doctor.

**Query Params:**
- `doctor_id`: Doctor ID

**Response:**
```json
{
  "id": "doctor_123",
  "name": "Dr. John Doe",
  "specialization": "Cardiology",
  "experience": 10,
  "rating": 4.5
}
```

---

### Slot Management Endpoints

#### GET `/get_slots`
**Purpose:** Fetch doctor's available slots.

**Query Params:**
- `doctor_id`: Doctor ID

**Response:**
```json
{
  "slots": [
    {
      "id": "slot_123",
      "doctor_id": "doctor_123",
      "date": "2024-01-15",
      "start_time": "10:00",
      "end_time": "10:30",
      "status": "AVAILABLE"
    }
  ]
}
```

---

#### POST `/create_slot`
**Purpose:** Create single slot.

**Request:**
```json
{
  "doctor_id": "doctor_123",
  "date": "2024-01-15",
  "start_time": "10:00",
  "end_time": "10:30",
  "status": "AVAILABLE"
}
```

**Response:**
```json
{
  "status": "success",
  "slot_id": "slot_123"
}
```

---

#### POST `/create_slots_batch`
**Purpose:** Create multiple slots.

**Request:**
```json
{
  "doctor_id": "doctor_123",
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "selected_days": ["Mon", "Wed", "Fri"],
  "start_time": "09:00",
  "end_time": "17:00",
  "break_start": "13:00",
  "break_end": "14:00",
  "slot_duration_minutes": 30,
  "time_gap_minutes": 5
}
```

**Response:**
```json
{
  "status": "success",
  "slots_created": 45
}
```

---

#### DELETE `/delete_slot`
**Purpose:** Delete slot.

**Query Params:**
- `slot_id`: Slot ID

**Response:**
```json
{
  "status": "success",
  "message": "Slot deleted"
}
```

---

### Appointment Endpoints

#### POST `/book_appointment`
**Purpose:** Book appointment.

**Request:**
```json
{
  "profile_id": "profile_123",
  "doctor_id": "doctor_123",
  "slot_id": "slot_123",
  "appointment_time": "2024-01-15T10:00:00",
  "consultation_mode": "video",
  "patient_name": "John Doe",
  "patient_age": 30,
  "patient_gender": "Male",
  "session_id": "CASE-1234"
}
```

**Response:**
```json
{
  "status": "success",
  "appointment_id": "appointment_123"
}
```

---

#### GET `/get_appointments`
**Purpose:** Fetch appointments.

**Query Params:**
- `doctor_id`: Doctor ID (optional)
- `patient_id`: Patient ID (optional)

**Response:**
```json
[
  {
    "id": "appointment_123",
    "doctor_id": "doctor_123",
    "doctorName": "Dr. John Doe",
    "specialty": "Cardiology",
    "profile_id": "profile_123",
    "patient_name": "Jane Doe",
    "appointment_time": "2024-01-15T10:00:00",
    "status": "CONFIRMED"
  }
]
```

---

### Utility Endpoints

#### GET `/get_location`
**Purpose:** Reverse geocode coordinates.

**Query Params:**
- `lat`: Latitude
- `lon`: Longitude

**Response:**
```json
{
  "display_name": "Connaught Place, New Delhi, India",
  "address": {
    "road": "Connaught Place",
    "city": "New Delhi",
    "country": "India"
  }
}
```

---

#### GET `/get_case`
**Purpose:** Fetch case details.

**Query Params:**
- `case_id`: Case ID

**Response:**
```json
{
  "case_id": "CASE-1234",
  "profile_id": "profile_123",
  "status": "DOCTOR_ASSIGNED",
  "triage_decision": "YELLOW",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## Communication Flow

### 1. Patient Registration Flow

```
User (Frontend)
    │
    ├─► Firebase Auth SDK: createUserWithEmailAndPassword()
    │       │
    │       └─► Firebase Auth: Create user
    │               │
    │               └─► Returns UID
    │
    └─► Firestore SDK: Add to 'users' collection
            │
            └─► Firestore: Save user document
```

---

### 2. Clinical Chat Flow

```
User (Frontend)
    │
    ├─► POST /chat
    │       │
    │       └─► main.py: chat_endpoint()
    │               │
    │               ├─► agent_graph.ainvoke()
    │               │       │
    │               │       ├─► emergency_check node
    │               │       │       │
    │               │       │       └─► Groq LLM: Detect red flags
    │               │       │
    │               │       ├─► diagnostician_node (if not emergency)
    │               │       │       │
    │               │       │       └─► Groq LLM: Ask follow-up questions
    │               │       │
    │               │       └─► Returns triage decision
    │               │
    │               └─► Returns response
    │
    └─► Frontend: Display response
```

---

### 3. Emergency Doctor Finder Flow

```
User (Frontend)
    │
    ├─► Click "Immediately Consult Doctor"
    │       │
    │       └─► Navigate to /patient/consult/directory
    │               │
    │               └─► Pass state: { type: 'emergency', userLocation: { lat, lon } }
    │
    └─► ConsultDoctor.jsx
            │
            ├─► GET /get_emergency_doctors?lat=28.6129&lon=77.2295
            │       │
            │       └─► main.py: get_emergency_doctors_endpoint()
            │               │
            │               └─► firebase_service.get_doctors_with_availability()
            │                       │
            │                       ├─► Firestore: Fetch all doctors
            │                       │
            │                       ├─► Firestore: Fetch today's slots
            │                       │
            │                       ├─► Calculate distances (Haversine)
            │                       │
            │                       ├─► Check availability (current time vs slot times)
            │                       │
            │                       └─► Sort by: Available Now → Distance
            │
            └─► Frontend: Display sorted doctor list
```

---

### 4. Appointment Booking Flow

```
User (Frontend)
    │
    ├─► Select doctor
    │       │
    │       └─► AppointmentBooking modal opens
    │
    ├─► Select date
    │       │
    │       └─► GET /get_slots?doctor_id=doctor_123
    │               │
    │               └─► firebase_service.get_doctor_slots()
    │                       │
    │                       └─► Firestore: Query 'doctor_slots' where doctor_id = doctor_123 AND status = AVAILABLE
    │
    ├─► Select time slot
    │
    └─► Confirm booking
            │
            └─► POST /book_appointment
                    │
                    └─► main.py: book_appointment_endpoint()
                            │
                            └─► doctor_consultation_graph.ainvoke()
                                    │
                                    ├─► book_appointment_node
                                    │       │
                                    │       ├─► Firestore: Create 'appointments' document
                                    │       │
                                    │       └─► Firestore: Update 'doctor_slots' status to BOOKED
                                    │
                                    └─► Returns appointment_id
```

---

### 5. Medical Records Flow

```
User (Frontend)
    │
    ├─► View Medical Files page
    │       │
    │       └─► GET /get_records?profile_id=profile_123
    │               │
    │               └─► firebase_service.get_records()
    │                       │
    │                       └─► Firestore: Query 'case_ai_patient_summaries' where profile_id = profile_123
    │
    └─► Upload file
            │
            └─► POST /upload_record
                    │
                    └─► firebase_service.save_record()
                            │
                            └─► Firestore: Add to 'medical_records' collection
```

---

### 6. Profile Management Flow

```
User (Frontend)
    │
    ├─► AuthContext: useEffect on mount
    │       │
    │       ├─► Firebase Auth: onAuthStateChanged()
    │       │       │
    │       │       └─► Returns user
    │       │
    │       ├─► Firestore: Get 'users' document
    │       │
    │       ├─► Firestore: Query 'profiles' where owner_uid = user.uid
    │       │
    │       └─► Set currentUser = { ...user, ...userData, profiles: [...] }
    │
    └─► ProfileSelection page
            │
            ├─► Display profiles from currentUser.profiles
            │
            └─► On profile selection
                    │
                    └─► AuthContext.selectProfile(profileId)
                            │
                            ├─► Set selectedProfile state
                            │
                            └─► localStorage.setItem('selectedProfileId', profileId)
```

---

## Key Design Patterns

### 1. **Separation of Concerns**
- **Frontend:** UI and user interaction
- **Backend:** Business logic and API
- **Database:** Data persistence

### 2. **Service Layer Pattern**
- `firebase_service` abstracts all Firestore operations
- Endpoints in `main.py` call service methods
- Easy to mock for testing

### 3. **Context API Pattern**
- `AuthContext` provides global authentication state
- Components use `useAuth()` hook
- Avoids prop drilling

### 4. **Graph-Based AI Agent**
- LangGraph orchestrates multi-step conversations
- Nodes are reusable and testable
- Conditional routing based on state

### 5. **Snapshot Pattern**
- Appointments store patient snapshot
- Prevents data loss if profile is deleted
- Enables historical record keeping

---

## Environment Setup

### Backend
1. Install Python 3.8+
2. Create virtual environment: `python -m venv venv`
3. Activate: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` file:
   ```
   GROQ_API_KEY=your_groq_api_key
   FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
   ```
6. Add Firebase service account key as `serviceAccountKey.json`
7. Run: `python main.py`

### Frontend
1. Install Node.js 16+
2. Install dependencies: `npm install`
3. Create `src/firebase.js` with Firebase config
4. Run: `npm run dev`

---

## Deployment

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (GROQ_API_KEY, Firebase credentials)

### Frontend (Vercel)
1. Connect GitHub repo
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables (Firebase config)

---

## Troubleshooting

### Backend Issues

**Issue:** Firebase not initializing
- **Solution:** Check `serviceAccountKey.json` exists and `FIREBASE_CREDENTIALS_PATH` is set

**Issue:** Groq API errors
- **Solution:** Verify `GROQ_API_KEY` is valid and has credits

**Issue:** CORS errors
- **Solution:** Check `CORSMiddleware` configuration in `main.py`

### Frontend Issues

**Issue:** Firebase auth not working
- **Solution:** Check Firebase config in `firebase.js`

**Issue:** API calls failing
- **Solution:** Verify backend URL in Vite proxy config

**Issue:** Profile not loading
- **Solution:** Check Firestore rules allow read access to `profiles` collection

---

## Future Enhancements

1. **Real-time Chat:** WebSocket support for live doctor-patient chat
2. **Video Calls:** WebRTC integration for video consultations
3. **Payment Gateway:** Stripe/Razorpay integration
4. **Prescription Management:** E-prescription generation
5. **Lab Integration:** Direct lab report uploads
6. **Analytics Dashboard:** Patient health trends and insights
7. **Mobile App:** React Native version
8. **Multi-language UI:** Full UI translation (currently only chat is translated)

---

**End of Documentation**
