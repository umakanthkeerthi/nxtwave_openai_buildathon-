import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Siren, Clock, MapPin, Video, Phone, CheckCircle,
    Navigation, User, AlertOctagon
} from 'lucide-react';
import './DoctorEmergencyQueue.css';
import { useAuth } from '../context/AuthContext';


const DoctorEmergency = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    // [NEW] Doctor Location State
    const [doctorLocation, setDoctorLocation] = useState(null);
    const { currentUser } = useAuth();

    // Fetch Doctor Profile to get Location
    useEffect(() => {
        const fetchDoctorProfile = async () => {
            if (currentUser?.uid) {
                try {
                    // In a real app, we might have the full profile in context. 
                    // Here we fetch it to be sure we get the new lat/lon fields.
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/get_doctor_profile?doctor_id=${currentUser.uid}`); // Hypothetical endpoint or reuse existing
                    // For now, let's assume we can get it from a direct firestore fetch or if AuthContext has it.
                    // A safer bet without a new endpoint is to use the existing /get_doctors and filter, 
                    // OR just trust that we will add a specific endpoint or use the updated context.

                    // SIMPLER APPROACH: 
                    // If AuthContext doesn't have it, we might need to fetch. 
                    // Let's assume for this step we will rely on a new fetch or just mock the hookup if the context isn't ready.

                    // Let's try to fetch specific doctor details
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/get_doctors`); // This returns all, inefficient but works for now
                    const data = await response.json();
                    const me = data.doctors.find(d => d.doctor_id === currentUser.uid || d.id === currentUser.uid);

                    if (me && me.latitude && me.longitude) {
                        setDoctorLocation({ lat: me.latitude, lng: me.longitude });
                    } else {
                        // Fallback
                        setDoctorLocation({ lat: 12.9716, lng: 77.5946 });
                    }
                } catch (e) {
                    console.error("Error fetching doctor location", e);
                    setDoctorLocation({ lat: 12.9716, lng: 77.5946 });
                }
            }
        };
        fetchDoctorProfile();
    }, [currentUser]);

    useEffect(() => {
        if (!doctorLocation) return; // Wait for location

        const fetchEmergencies = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/get_emergencies`);
                if (!response.ok) throw new Error('Failed to fetch emergencies');
                const data = await response.json();

                const formatted = data.map(item => {
                    const summary = item.data?.pre_doctor_consultation_summary || {};
                    const profile = item.data?.patient_profile || {};

                    // [NEW] Handle Appointment Data Source
                    const isAppointment = item.source_type === 'appointment';
                    const trigger = isAppointment ? "Emergency Appointment" : (summary.trigger_reason || "Critical Health Alert");

                    // [FIX] Robust ID check
                    const computedId = item.patient_id || item.profile_id || item.id;

                    return {
                        emergencyId: item.id,
                        patientId: computedId, // Use robust ID
                        caseId: item.case_id, // [FIX] Map case_id from backend
                        originalId: item.id, // Keep track of the source doc ID (appointment ID)
                        patientProfile: {
                            name: profile.name || "Unknown",
                            age: profile.age || "?",
                            gender: profile.gender || "?"
                        },
                        triggerSource: isAppointment ? "Direct Booking" : "AI Triage",
                        triggerReason: trigger,
                        detectedAt: item.created_at || new Date().toISOString(),
                        severityScore: summary.assessment?.severity_score || 90,
                        severityLevel: summary.assessment?.severity || "HIGH",
                        vitals: summary.vitals_reported || {},
                        location: { lat: 12.9716, lng: 77.5946 }, // Default for now
                        status: isAppointment ? (item.data?.appointment_details?.status || "PENDING") : "PENDING",
                        sourceType: item.source_type // Pass through
                    };
                });

                setQueue(sortQueue(formatted, doctorLocation));
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
    }, [doctorLocation]);



    const navigate = useNavigate();

    const handleAccept = (item) => {
        // [FIXED] Pass robust patientId and appointmentId
        // If it's an appointment source, the emergencyId IS the appointmentId
        const appointmentId = item.sourceType === 'appointment' ? item.emergencyId : null;

        navigate(`/doctor/patients/${item.patientId}`, {
            state: {
                patientData: {
                    name: item.patientProfile.name,
                    age: item.patientProfile.age,
                    gender: item.patientProfile.gender,
                    id: item.patientId,
                    // Pass appointmentId so status update works
                    appointmentId: appointmentId,
                    // [FIX] Pass caseId (backend now provides it)
                    caseId: item.caseId,
                    reason: item.triggerReason,
                    status: item.status, // [ADDED] Pass status for consult logic
                    type: 'emergency'
                },
                type: 'emergency'
            }
        });
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
                            <Siren size={24} color="white" />
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



                </div>
            </div>

            {/* Queue Grid */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {queue.map(item => (
                    <EmergencyCard
                        key={item.emergencyId}
                        data={item}
                        patientId={item.patientId}
                        onAccept={() => handleAccept(item)} // [FIX] Pass full item
                        doctorLocation={doctorLocation}
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

const sortQueue = (list, doctorLoc) => {
    // Fallback if location not ready
    const center = doctorLoc || { lat: 12.9716, lng: 77.5946 };

    return [...list].sort((a, b) => {
        // 1. Severity DESC
        const weightDiff = getSeverityWeight(b.severityLevel) - getSeverityWeight(a.severityLevel);
        if (weightDiff !== 0) return weightDiff;

        // 2. Distance ASC
        const distA = calculateDistance(center, a.location);
        const distB = calculateDistance(center, b.location);
        return distA - distB;
    });
};

// Pass doctorLocation down to card for distance calc
const EmergencyCard = ({ data, onAccept, doctorLocation }) => {
    const isAccepted = data.status === 'ACCEPTED';
    const center = doctorLocation || { lat: 12.9716, lng: 77.5946 };
    const distanceKm = calculateDistance(center, data.location).toFixed(1);

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 200px',
            background: (isAccepted) ? '#f0fdfa' : 'white',
            border: (isAccepted) ? '1px solid #0f766e' : '1px solid #e2e8f0',
            borderLeft: (isAccepted) ? '5px solid #0f766e' : '5px solid #ef4444',
            borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
        }}>
            {/* Left: Icon */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: (isAccepted) ? '#ccfbf1' : '#fef2f2'
            }}>
                {(isAccepted) ?
                    <CheckCircle size={32} color="#0f766e" /> :
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
                {isAccepted ? (
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
