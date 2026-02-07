import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Siren, Clock, MapPin, Video, Phone, CheckCircle,
    Navigation, User, AlertOctagon
} from 'lucide-react';
import './DoctorEmergencyQueue.css';

const DoctorEmergency = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmergencies = async () => {
            try {
                const response = await fetch(`/get_emergencies`);
                if (!response.ok) throw new Error('Failed to fetch emergencies');
                const data = await response.json();

                const formatted = data.map(item => {
                    const summary = item.data?.pre_doctor_consultation_summary || {};
                    const profile = item.data?.patient_profile || {};

                    return {
                        emergencyId: item.id,
                        patientId: item.patient_id,
                        patientProfile: {
                            name: profile.name || "Unknown",
                            age: profile.age || "?",
                            gender: profile.gender || "?"
                        },
                        triggerSource: "AI Triage",
                        triggerReason: summary.trigger_reason || "Critical Health Alert",
                        detectedAt: item.created_at || new Date().toISOString(),
                        severityScore: summary.assessment?.severity_score || 90,
                        severityLevel: summary.assessment?.severity || "HIGH",
                        vitals: summary.vitals_reported || {},
                        location: { lat: 12.9716, lng: 77.5946 }, // Default for now
                        status: "PENDING"
                    };
                });

                setQueue(sortQueue(formatted));
            } catch (error) {
                console.error("Error fetching emergencies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmergencies();
        // Poll every 30 seconds for new emergencies
        const interval = setInterval(fetchEmergencies, 30000);
        return () => clearInterval(interval);
    }, []);

    // Simulation Trigger
    const simulateIncomingCase = () => {
        const newCase = {
            emergencyId: `EM-2024-${Math.floor(Math.random() * 1000)}`,
            patientId: `P-${Math.floor(Math.random() * 900)}`,
            patientProfile: {
                name: "New Emergency Case",
                age: Math.floor(Math.random() * 60) + 20,
                gender: "other"
            },
            triggerSource: "clinical-chat",
            triggerReason: "Simulated Chest Discomfort",
            detectedAt: new Date().toISOString(),
            severityScore: Math.floor(Math.random() * 100), // Random Score
            severityLevel: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][Math.floor(Math.random() * 4)],
            vitals: { heartRate: 100 + Math.floor(Math.random() * 40) },
            location: {
                lat: 12.9716 + (Math.random() * 0.05 - 0.025), // Random nearby location
                lng: 77.5946 + (Math.random() * 0.05 - 0.025)
            },
            preferredMode: "audio",
            status: "PENDING"
        };

        // Push and Sort
        setQueue(prev => sortQueue([...prev, newCase]));

        // Notify (Mock)
        alert(`New Case Received! Severity: ${newCase.severityLevel}`);
    };

    const [processingId, setProcessingId] = useState(null);
    const navigate = useNavigate();

    const handleAccept = (patientId) => {
        // Navigate directly to patient detail page
        navigate(`/doctor/patients/${patientId}`);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            {/* Header - Refactored for Mobile Responsiveness */}
            <div className="queue-header-box">
                {/* Top Row: Icon + Title */}
                <div className="box-row-top">
                    <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: '#ef4444', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', flexShrink: 0
                        }}>
                            <Siren size={24} className="pulse-animation" />
                            <div style={{ position: 'absolute', top: -2, right: -2, width: '12px', height: '12px', background: '#22c55e', border: '2px solid white', borderRadius: '50%' }}></div>
                        </div>
                        <div>
                            <h1 className="box-title" style={{ fontSize: '1.4rem', color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                Emergency Queue
                                <span className="live-badge">LIVE</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Simulate Button + Available Toggle */}
                <div className="box-row-bottom">
                    <button
                        onClick={simulateIncomingCase}
                        className="btn-simulate"
                        style={{ width: '100%', maxWidth: '200px', textAlign: 'center' }}
                    >
                        + Simulate Case
                    </button>


                </div>
            </div>

            {/* Queue Grid */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {queue.map(item => (
                    <EmergencyCard
                        key={item.emergencyId}
                        data={item}
                        patientId={item.patientId}
                        isProcessing={processingId === item.patientId}
                        onAccept={() => handleAccept(item.patientId)}
                    />
                ))}

                {queue.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <CheckCircle size={48} style={{ color: '#0f766e', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>No Active Emergencies</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>You are currently monitoring for critical cases in your vicinity.</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse-animation {
                    animation: pulse 1.5s infinite ease-in-out;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

// --- Helper Functions ---

const getSeverityWeight = (level) => {
    switch (level) {
        case 'CRITICAL': return 4;
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        default: return 0;
    }
};

const calculateDistance = (loc1, loc2) => {
    // Simplified Euclidean distance mapped to rough KM for demo
    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(loc2.lat - loc1.lat);
    const dLon = deg2rad(loc2.lng - loc1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const sortQueue = (list) => {
    return [...list].sort((a, b) => {
        // 1. Severity DESC
        const weightDiff = getSeverityWeight(b.severityLevel) - getSeverityWeight(a.severityLevel);
        if (weightDiff !== 0) return weightDiff;

        // 2. Distance ASC
        const distA = calculateDistance(DOCTOR_LOCATION, a.location);
        const distB = calculateDistance(DOCTOR_LOCATION, b.location);
        return distA - distB;
    });
};

const EmergencyCard = ({ data, onAccept, isProcessing }) => {
    const isAccepted = data.status === 'ACCEPTED';
    const distanceKm = calculateDistance(DOCTOR_LOCATION, data.location).toFixed(1);

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 200px',
            background: (isAccepted || isProcessing) ? '#f0fdfa' : 'white',
            border: (isAccepted || isProcessing) ? '1px solid #0f766e' : '1px solid #e2e8f0',
            borderLeft: (isAccepted || isProcessing) ? '5px solid #0f766e' : '5px solid #ef4444',
            borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            opacity: isProcessing ? 0.8 : 1
        }}>
            {/* Left: Icon */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: (isAccepted || isProcessing) ? '#ccfbf1' : '#fef2f2'
            }}>
                {(isAccepted || isProcessing) ?
                    <CheckCircle size={32} color="#0f766e" className={isProcessing ? "spin-animation" : ""} /> :
                    <AlertOctagon size={32} color="#ef4444" />
                }
            </div>

            {/* Center: Details */}
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '8px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                        {data.patientProfile.name}
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal', marginLeft: '8px' }}>
                            ({data.patientProfile.age}, {data.patientProfile.gender})
                        </span>
                    </h3>
                    <span style={{
                        background: '#fee2e2', color: '#991b1b',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        {data.severityLevel} • Score {data.severityScore}
                    </span>
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                    Trigger: "{data.triggerReason}"
                </div>
            </div>

            {/* Right: Actions */}
            <div style={{
                padding: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '10px',
                justifyContent: 'center', borderLeft: '1px solid #f1f5f9'
            }}>
                {isProcessing ? (
                    <div style={{ textAlign: 'center', color: '#0f766e', fontWeight: '600' }}>
                        <div style={{ marginBottom: '4px' }}>Initializing...</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#115e59' }}>Setting up console</div>
                    </div>
                ) : isAccepted ? (
                    <div style={{ textAlign: 'center', color: '#0f766e', fontWeight: '600' }}>
                        Case Accepted
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Redirecting to map...</div>
                    </div>
                ) : (
                    <button
                        onClick={onAccept}
                        style={{
                            background: '#dc2626', color: 'white', border: 'none',
                            padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
                            transition: '0.2s', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                        }}
                    >
                        View Case
                    </button>
                )}
            </div>
        </div>
    );
};

const VitalBadge = ({ label, value }) => (
    <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
        padding: '2px 8px', fontSize: '0.8rem', color: '#475569', fontWeight: '500'
    }}>
        <span style={{ color: '#94a3b8', marginRight: '4px' }}>{label}:</span>
        {value}
    </div>
);

export default DoctorEmergency;
