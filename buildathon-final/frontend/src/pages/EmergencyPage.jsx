import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Stethoscope, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EmergencyPage.css';

const EmergencyPage = () => {
    const navigate = useNavigate();

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
                            try {
                                await fetch('/save_summary', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        patient_id: "user_" + Date.now(),
                                        patient_summary: "EMERGENCY DETECTED",
                                        pre_doctor_consultation_summary: { red_flags: ["Emergency Click"], assessment: { severity: "RED" } }
                                    })
                                });
                            } catch (e) { console.error("Emergency Save Failed", e); }


                            // 2. Trigger Doctor Consultation Agent (Offline/Immediate Mode)
                            // Hardcoded location for MVP: New Delhi (Connaught Place/India Gate area)
                            // This matches the default location in ProfileModal (28.6129, 77.2295)
                            const MVP_LAT = 28.6129;
                            const MVP_LON = 77.2295;

                            navigate('/patient/consult/directory', {
                                state: {
                                    type: 'emergency',
                                    userLocation: { lat: MVP_LAT, lon: MVP_LON },
                                    summary: {
                                        caseId: "CASE-EMERGENCY-" + Date.now().toString().slice(-4),
                                        triage: "Emergency",
                                        color: "Red",
                                        chiefComplaints: ["Emergency Reported"],
                                        redFlags: ["Immediate Attention Required"]
                                    }
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
