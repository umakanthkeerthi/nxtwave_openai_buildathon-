

Perfect. Below is a clean, corrected, production-grade v1.0 schema that:

fixes the flaws we identified

keeps your Netflix-style UX

is agent-native

is Firestore-friendly

is healthcare-safe

This is something you can lock as v1.0 and build confidently on.

📘 DOC AI — Database Schema v1.0 (Production)
Design Goals (Locked)

🔐 Role-based security (patient / doctor / admin)

🧬 Case-centric architecture (single source of truth)

👨‍👩‍👧 Multi-profile support (family healthcare)

🤖 Agent-friendly (triage, emergency, summaries)

⚡ Fast dashboards (controlled denormalization)

📋 Audit-safe medical records

1️⃣ Users (Authentication & Authorization Only)

Collection: users
Doc ID: auth.uid

{
  "uid": "auth_uid",
  "email": "user@example.com",
  "role": "patient | doctor | admin",
  "created_at": "ISO_TIMESTAMP",
  "onboarding_completed": true,
  "is_active": true
}


✅ No profiles
✅ No medical data
✅ Stable, small document

2️⃣ Profiles (First-Class Medical Identity)

Collection: profiles
Doc ID: profile_id (UUID)

{
  "profile_id": "profile_uuid_1",
  "owner_uid": "auth_uid",
  "full_name": "Rahul Verma",
  "dob": "1979-05-12",
  "gender": "Male",
  "relationship": "Self | Child | Parent",
  "avatar_color": "#FF5733",
  "created_at": "ISO_TIMESTAMP",
  "is_active": true
}


🔥 This replaces profiles array
🔥 Every medical record links here
🔥 Clean security rules

3️⃣ Doctors (Public Directory + Metadata)

Collection: doctors
Doc ID: doctor_id (UUID or auth.uid)

{
  "doctor_id": "doc_001",
  "linked_uid": "auth_uid",
  "name": "Dr. Geeta Phogat",
  "email": "geeta.phogat@docai.in",
  "specialization": "Cardiology",
  "hospital_id": "HOSP-001",
  "location": {
    "city": "Delhi",
    "lat": 28.61,
    "lng": 77.20
  },
  "verified": true,
  "created_at": "ISO_TIMESTAMP"
}

4️⃣ Doctor Availability (Slot-Based, Lockable)

Collection: doctor_slots
Doc ID: slot_id

{
  "slot_id": "slot_001",
  "doctor_id": "doc_001",
  "start_time": "2026-02-08T10:00:00Z",
  "end_time": "2026-02-08T10:15:00Z",
  "status": "AVAILABLE | BOOKED | BLOCKED",
  "created_at": "ISO_TIMESTAMP"
}


✅ Prevents double booking
✅ Supports emergency overrides
✅ Atomic locking via transaction

5️⃣ Cases (🔥 THE GOLDEN SPINE 🔥)

Collection: cases
Doc ID: case_id (UUID)

{
  "case_id": "case_123",
  "profile_id": "profile_uuid_1",
  "status": "CREATED | AI_TRIAGE | EMERGENCY | SUMMARY_READY | DOCTOR_ASSIGNED | CONSULT_ACTIVE | COMPLETED | FAILED",
  "is_emergency": false,
  "language": "en | hi | te",
  "created_at": "ISO_TIMESTAMP",
  "closed_at": null,
  "last_updated_at": "ISO_TIMESTAMP"
}


🔥 Agents read/write ONLY via case
🔥 Rollbacks & retries become trivial
🔥 Emergency logic centralized

6️⃣ AI Summaries (Separated & Safe)
6.1 Patient-Facing Summary

Collection: case_ai_patient_summaries

{
  "summary_id": "sum_001",
  "case_id": "case_123",
  "profile_id": "profile_uuid_1",
  "triage_level": "GREEN | YELLOW | RED",
  "symptoms_reported": ["fever", "headache"],
  "symptoms_denied": ["vomiting"],
  "red_flags_to_watch": ["Breathing difficulty"],
  "guidelines": {
    "actions": [
      "Drink fluids",
      "Rest",
      "Monitor temperature"
    ],
    "source": "NHSRC"
  },
  "generated_by": "clinical_chat_agent",
  "generated_at": "ISO_TIMESTAMP",
  "schema_version": "v1"
}

6.2 Pre-Doctor Consultation Summary (Doctor-Only)

Collection: case_pre_doctor_summaries

{
  "summary_id": "pre_doc_001",
  "case_id": "case_123",
  "profile_id": "profile_uuid_1",
  "assessment": {
    "clinical_impression": "Consistent with viral fever",
    "severity_level": "LOW | MEDIUM | HIGH | CRITICAL",
    "severity_score": 45,
    "confidence": "moderate"
  },
  "history": {
    "duration_hours": 72,
    "symptoms_present": ["fever", "headache"],
    "symptoms_absent": ["neck stiffness"]
  },
  "vitals_reported": {
    "temperature_celsius": 38.0
  },
  "red_flags": ["Dehydration"],
  "plan": {
    "immediate_actions": [],
    "referral_needed": false
  },
  "generated_by": "clinical_chat_agent",
  "generated_at": "ISO_TIMESTAMP",
  "schema_version": "v1"
}


🔐 Patients never see this

7️⃣ Appointments (Workflow Entity)

Collection: appointments
Doc ID: appointment_id

{
  "appointment_id": "appt_555",
  "case_id": "case_123",
  "profile_id": "profile_uuid_1",
  "doctor_id": "doc_001",
  "slot_id": "slot_001",
  "mode": "VIDEO | OFFLINE",
  "status": "SCHEDULED | ACTIVE | COMPLETED | CANCELLED",
  "is_emergency": false,

  "patient_snapshot": {
    "name": "Rahul Verma",
    "age": 45,
    "gender": "Male"
  },

  "created_at": "ISO_TIMESTAMP",
  "started_at": null,
  "ended_at": null
}


✅ Doctor dashboards
✅ Patient tracking
✅ Emergency priority

8️⃣ Prescriptions (Doctor-Generated)

Collection: prescriptions

{
  "prescription_id": "rx_001",
  "case_id": "case_123",
  "appointment_id": "appt_555",
  "profile_id": "profile_uuid_1",
  "doctor_id": "doc_001",
  "diagnosis_confirmed": "Typhoid",
  "remarks": "Vitals stable; AI overestimated severity.",
  "medicines": [
    { "name": "Dolo 650", "dosage": "650mg", "freq": "SOS", "days": 3 }
  ],
  "lab_orders": ["CBC"],
  "follow_up_date": "2026-02-15",
  "created_at": "ISO_TIMESTAMP"
}

9️⃣ Lab Reports

Collection: lab_reports

{
  "report_id": "lab_001",
  "case_id": "case_123",
  "profile_id": "profile_uuid_1",
  "uploaded_by": "patient | lab | doctor",
  "file_url": "https://storage.googleapis.com/...",
  "summary_text": "Platelets slightly low",
  "created_at": "ISO_TIMESTAMP"
}