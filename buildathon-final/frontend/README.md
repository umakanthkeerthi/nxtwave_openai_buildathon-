# DOC AI - Agentic Telemedicine Application

DOC AI is an "Agentic First" AI-powered multilingual telemedicine application designed to automate the primary healthcare system using safe agentic AI. This project contains the frontend prototype built with React and Vite.

## Project Overview

The application features three main portals:
1.  **Patient Portal**: For symptom evaluation, AI clinical chat, medical records management, and doctor consultation booking.
2.  **Doctor Portal**: For managing appointments, patient queues, emergency triage, and conducting consultations.
3.  **Pharmacy Portal** (Upcoming): For medication management and ordering.

## Frontend Architecture

The frontend is built using a modern component-based architecture:

-   **Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
-   **Routing**: [React Router](https://reactrouter.com/) (v6/v7) for handling navigation between portals.
-   **Styling**: Pure CSS / CSS Modules for custom, lightweight styling.
-   **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid UI transitions and agentic interactions.
-   **Icons**: [Lucide React](https://lucide.dev/) for consistent, modern iconography.

## Directory Structure

```text
src/
├── assets/                  # Static assets (images, logos)
├── components/              # Reusable UI Components
│   ├── AppointmentBooking.jsx
│   ├── AppointmentTracker.jsx
│   ├── ConversationalAgent.jsx  # AI Agent logic
│   ├── DocTools.jsx             # Quick access tools
│   ├── DoctorCard.jsx           # Doctor profile card
│   ├── DoctorGridCarousel.jsx
│   ├── HealthHero.jsx           # Home page hero
│   ├── HealthInsights.jsx
│   ├── Navbar.jsx
│   ├── SmartModules.jsx         # Feature modules
│   └── SymptomEvaluator.jsx     # AI Symptom input
├── data/                    # Mock Data
├── doctor/                  # DOCTOR PORTAL
│   ├── AIClinicalInsights.jsx
│   ├── DoctorDashboard.jsx      # Main Dashboard
│   ├── DoctorEmergency.jsx      # Emergency Triage View
│   ├── DoctorLayout.jsx         # Portal Layout (Sidebar/Header)
│   ├── DoctorPatients.jsx       # Patient List
│   ├── DoctorSchedule.jsx       # Calendar/Appointments
│   ├── PatientDetail.jsx        # Consultation Interface
│   ├── VideoPopup.jsx           # PiP Video Call Component
│   └── ... (Other doctor modules)
├── pages/                   # PATIENT PORTAL Pages
│   ├── ClinicalChat.jsx         # AI Clinical Agent Interface
│   ├── ConsultDoctor.jsx        # Doctor Directory & Booking
│   ├── EmergencyPage.jsx        # Patient Emergency SOS
│   ├── Home.jsx                 # Landing Page
│   ├── MedicalFiles.jsx         # Records & Reports Hub
│   ├── MyAppointments.jsx       # User Appointments
│   ├── PatientSummary.jsx       # Post-Consultation Summary
│   └── Pharmacy.jsx
├── App.jsx                  # Main Routing Configuration
└── main.jsx                 # Entry Point
```

## Key Features

### Patient Portal
-   **Agentic Entry**: Home page features a "Symptom Evaluation Box" that transitions into a Clinical Chat Agent.
-   **Clinical Chat**: Simulates an AI doctor gathering symptoms (supports multilingual input/output).
-   **Triage System**: Automatically routes cases to "Emergency" or "Doctor Consultation" based on severity.
-   **Medical Files**: Centralized hub for medical records,Lab Reports, Prescriptions, and AI-generated case summaries.

### Doctor Portal
-   **Dashboard**: Overview of appointments, active queue, and emergency alerts.
-   **Consultation Interface**: Split-screen view for simultaneous video calling, remarks entry, and digital prescription filling.
-   **Video Popup**: A persistent, draggable, and minimizable video call window for multitasking.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```
