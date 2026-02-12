import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Stethoscope, XCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmergencyPage.css';
import { useAuth } from '../context/AuthContext'; // [NEW]

const EmergencyPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, selectedProfile } = useAuth(); // [NEW]

    return (
        <div className="emergency-container">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="emergency-card"
            >
                <div className="emergency-icon-wrapper">
                    <AlertTriangle size={48} />
                </div>

                <h1 className="emergency-title">Emergency Detected</h1>
                <p className="emergency-description">
                    Based on your symptoms, immediate medical attention is recommended. Our AI advises against self-medication in this scenario.
                </p>

                <div className="emergency-actions">
                    <button
                        onClick={async () => {
                            // 1. Trigger Medical Files Agent (Critical: Save Event)
                            // [MODIFIED] Only save when user clicks this button
                            const summaryPayload = location.state?.summary_payload;
                            // [STANDARDIZED] Match backend format: CASE-{12_HEX_UPPER}
                            const randomHex = Math.random().toString(16).slice(2, 14).toUpperCase().padEnd(12, '0');
                            const caseId = location.state?.case_id || `CASE-${randomHex}`;

                            try {
                                if (summaryPayload) {
                                    console.log("Saving Emergency Payload Now...", summaryPayload);

                                    // [FIXED] Use actual profile/user IDs if logged in
                                    const patientId = selectedProfile?.id || selectedProfile?.profile_id || "user_" + Date.now();
                                    const userId = currentUser?.uid || "anon_user_" + Date.now();

                                    await fetch(`${import.meta.env.VITE_API_URL}/save_summary`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            patient_id: patientId,
                                            user_id: userId,
                                            // Ensure profile_id is also sent if backend expects it
                                            profile_id: patientId,
                                            patient_summary: "EMERGENCY DETECTED",
                                            pre_doctor_consultation_summary: summaryPayload,
                                            case_id: caseId
                                        })
                                    });
                                }
                            } catch (e) { console.error("Emergency Save Failed", e); }


                            // 2. Trigger Doctor Consultation Agent (Offline/Immediate Mode)
                            // Hardcoded location for MVP: New Delhi (Connaught Place/India Gate area)
                            const MVP_LAT = 28.6129;
                            const MVP_LON = 77.2295;

                            navigate('/patient/consult/directory', {
                                state: {
                                    type: 'emergency',
                                    userLocation: { lat: MVP_LAT, lon: MVP_LON },
                                    summary: {
                                        caseId: caseId,
                                        triage: "Emergency",
                                        color: "Red",
                                        chiefComplaints: ["Emergency Reported"],
                                        redFlags: ["Immediate Attention Required"]
                                    },
                                    pre_doctor_summary_id: null // We don't have the ID yet unless we wait for save response
                                }
                            });

                        }}
                        className="btn-emergency-primary"
                    >
                        <Stethoscope size={24} />
                        Immediately Consult Doctor
                    </button>

                    <button
                        onClick={() => navigate('/patient/clinical-chat')}
                        className="btn-emergency-cancel"
                    >
                        <XCircle size={24} />
                        Cancel
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default EmergencyPage;
