import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Stethoscope, Save, ArrowLeft } from 'lucide-react';
import './PatientSummary.css';

import { useAuth } from '../context/AuthContext';

const PatientSummary = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, selectedProfile } = useAuth(); // [FIX] Added selectedProfile

    const parsePatientSummary = (rawData) => {
        if (!rawData) return null;
        try {
            return typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch (e) {
            return null;
        }
    };

    const locationSummary = location.state?.summary;
    const parsedPatientData = parsePatientSummary(locationSummary?.raw_patient_summary);

    const summary = locationSummary ? {
        ...locationSummary,
        reportedSymptoms: parsedPatientData?.symptoms_reported || locationSummary.reportedSymptoms,
        deniedSymptoms: parsedPatientData?.symptoms_denied || locationSummary.deniedSymptoms,
        redFlags: parsedPatientData?.red_flags || locationSummary.redFlags,
        guidelines: parsedPatientData?.clinical_guidelines || locationSummary.guidelines
    } : {
        caseId: "CASE-DEMO-XYZ",
        color: "Green",
        triage: "Non-Emergency",
        chiefComplaints: ["Demo Fever"],
        reportedSymptoms: ["Fever", "Headache"],
        deniedSymptoms: ["Cough"],
        redFlags: ["None"],
        guidelines: "Rest and hydration.",
        followUp: "Review if persists."
    };



    const handleSave = async () => {
        try {
            await fetch('/save_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedProfile?.id || currentUser?.uid || "user_" + Date.now(), // [FIX] Use selectedProfile.id
                    case_id: summary.caseId,
                    patient_summary: summary.raw_patient_summary || summary.guidelines,
                    // [IMPORTANT] EXCLUDE pre_doctor_consultation_summary for "Save Only"
                    patient_profile: {  // [FIX] Add profile details for record metadata
                        name: selectedProfile?.fullName || currentUser?.displayName || "Unknown",
                        age: selectedProfile?.age || currentUser?.age || "Unknown",
                        gender: selectedProfile?.gender || currentUser?.gender || "Unknown"
                    }
                })
            });
            alert("Patient Summary saved to AI Summary Files!");
            navigate('/patient/medical-files');
        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to save summary.");
        }
    };

    const handleConsult = async () => {
        // Requirement: Trigger Medical Files Agent (Save BOTH) AND Doctor Consultation Agent (Navigate)
        try {
            // 1. Trigger Medical Files Agent
            await fetch('/save_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedProfile?.id || currentUser?.uid || "user_" + Date.now(), // [FIX] Use selectedProfile.id
                    case_id: summary.caseId,
                    patient_summary: summary.raw_patient_summary || summary.guidelines,
                    pre_doctor_consultation_summary: summary.raw_doctor_summary || {}, // [IMPORTANT] INCLUDE for Doctor
                    patient_profile: { // [FIX] Add profile details
                        name: selectedProfile?.fullName || currentUser?.displayName || "Unknown",
                        age: selectedProfile?.age || currentUser?.age || "Unknown",
                        gender: selectedProfile?.gender || currentUser?.gender || "Unknown"
                    }
                })
            });

            // 2. Trigger Doctor Consultation Agent (via Directory selection)
            navigate('/patient/consult/directory', { state: { summary: summary } });

        } catch (error) {
            console.error("Save & Consult Error:", error);
            // Even if save fails, let them consult doctor (Critical Safety Fallback)
            navigate('/patient/consult/directory', { state: { summary: summary } });
        }
    };

    return (
        <div className="patient-summary-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="summary-card"
            >
                <div className="summary-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ArrowLeft />
                    </button>
                    <h1 className="page-title">Patient Summary</h1>
                </div>

                <div className="assessment-section">
                    <div className="assessment-header">
                        <h3 className="assessment-title">
                            <FileText className="text-blue-600" size={20} />
                            Clinical Assessment
                        </h3>
                        <div className="case-id-block">
                            <span className="case-id-label">Case ID</span>
                            <span className="case-id-value">{summary.caseId}</span>
                        </div>
                    </div>

                    {/* Triage Status */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontWeight: '500', color: '#666', marginBottom: '0.5rem', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Triage Status</h4>
                        <span
                            className="triage-badge"
                            style={{
                                backgroundColor: summary.color === 'Red' ? '#fee2e2' : '#dcfce7',
                                color: summary.color === 'Red' ? '#991b1b' : '#166534',
                                border: `1px solid ${summary.color === 'Red' ? '#ef4444' : '#86efac'}`
                            }}
                        >
                            {summary.color} • {summary.triage}
                        </span>
                    </div>

                    {/* Clinical Details Grid 1 */}
                    <div className="details-grid">
                        <div className="detail-block">
                            <h4>Chief Complaints</h4>
                            <ul>
                                {summary.chiefComplaints?.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="detail-block">
                            <h4>Reported Symptoms</h4>
                            <div className="tags-container">
                                {summary.reportedSymptoms?.map((s, i) => (
                                    <span key={i} className="tag">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Clinical Details Grid 2 */}
                    <div className="details-grid">
                        <div className="detail-block">
                            <h4>Denied Symptoms</h4>
                            <div className="tags-container">
                                {summary.deniedSymptoms?.map((s, i) => (
                                    <span key={i} className="tag denied">{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="detail-block">
                            <h4 style={{ color: '#b91c1c' }}>Red Flags to watch for</h4>
                            {(Array.isArray(summary.redFlags) && summary.redFlags.length > 0) ? (
                                <ul className="red-flags-list">
                                    {summary.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                                </ul>
                            ) : (
                                <p>{(summary.redFlags && !Array.isArray(summary.redFlags)) ? summary.redFlags : "None identified"}</p>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #ddd' }}>
                        <h4 style={{ fontWeight: '500', color: '#666', margin: '0 0 0.5rem 0' }}>NHSRC Clinical Guidelines</h4>
                        <p className="guidelines-box">{summary.guidelines}</p>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ fontWeight: '500', color: '#666', margin: '0 0 0.5rem 0' }}>Follow Up</h4>
                        <p>{summary.followUp}</p>
                    </div>
                </div>

                <div className="summary-actions">
                    <button
                        onClick={handleSave}
                        className="btn-secondary"
                    >
                        <Save size={18} />
                        Save to AI Summary Files and Exit
                    </button>

                    <button
                        onClick={handleConsult}
                        className="btn-primary"
                    >
                        <Stethoscope size={18} />
                        Consult Doctor
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default PatientSummary;
