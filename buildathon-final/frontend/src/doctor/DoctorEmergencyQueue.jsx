import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Menu, Phone, Video } from 'lucide-react';
import './DoctorEmergencyQueue.css';

const DoctorEmergencyQueue = () => {
    const navigate = useNavigate();
    const [isAvailable, setIsAvailable] = useState(true);

    const patients = [
        {
            id: 'E-101',
            patientId: 'P-922',
            name: 'Unknown Patient',
            age: 45,
            gender: 'Male',
            severity: 'critical',
            score: 92,
            trigger: 'Chest Pain, radiating to left arm',
            vitals: { hr: '110', bp: '140/90', spo2: '92%' },
            time: '11:06 AM',
            distance: '~0.0 km away',
        },
        {
            id: 'E-102',
            patientId: 'P-104',
            name: 'Priya Sharma',
            age: 28,
            gender: 'Female',
            severity: 'high',
            score: 78,
            trigger: 'Severe Allergic Reaction (Swelling)',
            vitals: { hr: '102', bp: '110/70', spo2: '97%' },
            time: '0 min ago',
            distance: '1.2 km away',
        }
    ];

    return (
        <div className="mobile-queue-container">
            {/* 1. Overview Header (From Sketch) */}
            <nav className="overview-nav">
                <Menu size={24} color="#1e293b" />
                <span className="nav-title">Overview</span>
            </nav>

            {/* 2. Emergency Status Header (Hybrid: Red Theme + Sketch Box Structure) */}
            <div className={`queue-header-box ${isAvailable ? 'active-mode' : ''}`}>
                <div className="box-row-bottom">
                    <div className="title-group">
                        <h2 className="box-title">Emergency Queue</h2>
                        <span className="live-badge">LIVE</span>
                    </div>
                    {/* Fixed: Simulate button is now clearly visible */}
                    <button className="btn-simulate">+ Simulate Case</button>
                </div>

                {/*<p className="header-subtitle">
                    
                </p>*/}

                <div className="box-row-bottom">
                    <span className="toggle-label">Available for Emergency</span>
                    <div
                        className={`toggle-switch ${isAvailable ? 'on' : 'off'}`}
                        onClick={() => setIsAvailable(!isAvailable)}
                    >
                        <div className="toggle-knob"></div>
                    </div>
                </div>
            </div>

            {/* 3. High-Fidelity Patient Cards */}
            <div className="queue-list">
                {patients.map(patient => (
                    <EmergencyCard key={patient.id} data={patient} navigate={navigate} />
                ))}
            </div>
        </div>
    );
};

/* Extracted Card Component for cleaner code */
const EmergencyCard = ({ data, navigate }) => {
    const { id, patientId, name, age, gender, severity, score, trigger, vitals, distance, time } = data;
    const isCritical = severity === 'critical';

    return (
        <div className={`emergency-card ${severity}`}>
            {/* Left Strip */}
            <div className={`card-left-strip ${severity}`}>
                <Activity size={20} className="strip-icon" />
            </div>

            <div className="card-main-body">
                {/* Information Section */}
                <div className="card-content">
                    <div className="patient-header">
                        <div>
                            <h3>{name}</h3>
                            <span className="demographics">{age}, {gender}</span>
                            <div className={`severity-tag ${severity}`}>
                                {severity.toUpperCase()} • Score {score}
                            </div>
                        </div>
                    </div>

                    <p className="trigger-text">
                        Trigger: "{trigger}"
                    </p>
                </div>

                {/* Actions Section (Stacks on Mobile) */}
                <div className="card-actions-col">
                    <button
                        className="btn-accept-case"
                        onClick={() => navigate(`/doctor/patients/${patientId}`)}
                    >
                        View Case
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorEmergencyQueue;
