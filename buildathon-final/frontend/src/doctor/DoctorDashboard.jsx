import React from 'react';
import {
    Users,
    Clock,
    AlertCircle,
    Activity,
    Video,
    MapPin,
    MoreHorizontal,
    FileText,
    CheckCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import './DoctorDashboard.css';

const SectionShell = ({ title, children, action }) => (
    <div className="section-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>{title}</h3>
            {action}
        </div>
        {children}
    </div>
);

const StatCard = ({ title, value, subtext, icon, color, isCritical }) => {
    const colors = {
        blue: { bg: '#eff6ff', text: '#1d4ed8' },
        orange: { bg: '#fff7ed', text: '#c2410c' },
        purple: { bg: '#faf5ff', text: '#7e22ce' },
        red: { bg: '#fef2f2', text: '#b91c1c' }
    };
    const theme = colors[color];

    return (
        <div style={{
            background: isCritical ? '#fef2f2' : 'white',
            padding: '1.2rem',
            borderRadius: '12px',
            border: isCritical ? '1px solid #fecaca' : '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{title}</span>
                <div style={{
                    padding: '6px', borderRadius: '6px',
                    background: theme.bg, color: theme.text
                }}>
                    {React.cloneElement(icon, { size: 16 })}
                </div>
            </div>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: isCritical ? '#b91c1c' : '#0f172a' }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: isCritical ? '#ef4444' : '#64748b' }}>{subtext}</div>
            </div>
        </div>
    );
};

const TimeSlot = ({ time, event, type, status, isBlinking }) => {
    const isCompleted = status === 'completed';
    const isActive = status === 'active';
    const isEmergency = type === 'emergency';

    return (
        <div className={`time-slot status-${status}`} style={{ display: 'flex', gap: '12px', opacity: isCompleted ? 0.6 : 1, alignItems: 'center' }}>
            <div style={{
                minWidth: '65px', fontSize: '0.85rem', color: isActive || isEmergency ? '#0f766e' : '#64748b',
                fontWeight: isActive || isEmergency ? '700' : '500', paddingTop: '2px', textAlign: 'right'
            }}>
                {time}
            </div>
            <div style={{
                flex: 1, padding: '10px',
                background: isActive ? '#f0fdfa' : (isEmergency ? '#fef2f2' : '#f8fafc'),
                borderRadius: '8px',
                borderLeft: isActive ? '4px solid #0f766e' : (isEmergency ? '4px solid #ef4444' : '4px solid #cbd5e1'),
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isEmergency ? '#b91c1c' : '#1e293b' }}>{event}</div>
                    <div style={{ fontSize: '0.75rem', color: isEmergency ? '#ef4444' : '#64748b', textTransform: 'capitalize' }}>{type}</div>
                </div>

                {isEmergency && (
                    <button style={{
                        background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px',
                        padding: '6px 12px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                    }}>
                        View Case
                    </button>
                )}
            </div>
        </div>
    );
};

import { useNavigate } from 'react-router-dom';

const PatientCard = ({ id, caseId, appointmentId, name, age, gender, reason, time, mode, type, aiFlag, status }) => { // [FIX] Accept status prop
    const isEmergency = type === 'emergency';
    const navigate = useNavigate();

    return (
        <div className={`queue-patient-card ${isEmergency ? 'emergency' : ''}`}>
            {/* Header Row: Avatar, Name/Info, Time */}
            <div className="patient-header-row">
                <div className="patient-profile">
                    <div className="patient-avatar">
                        {name.charAt(0)}
                    </div>
                    <div className="patient-details">
                        <div className="patient-name">{name}</div>
                        <div className="patient-demographics">{age} yrs, {gender}</div>
                    </div>
                </div>

                <div className="patient-time-status">
                    <div className="patient-time">{time}</div>
                    <div className={`patient-mode ${mode === 'Video' ? 'video' : 'person'}`}>
                        {mode === 'Video' ? <Video size={12} /> : <MapPin size={12} />}
                        {mode}
                    </div>
                </div>
            </div>

            {/* Reason Badge */}
            <div className={`patient-reason ${isEmergency ? 'emergency' : ''}`}>
                {reason}
            </div>

            {/* AI Flag */}
            {aiFlag && (
                <div className="patient-ai-flag">
                    <Activity size={14} />
                    <span>AI Insight: {aiFlag}</span>
                </div>
            )}

            {/* Actions */}
            <div className="patient-actions">
                <button
                    onClick={() => navigate(`/doctor/patients/${id}?caseId=${caseId}`, {
                        state: {
                            patientData: {
                                name, age, gender, id, caseId, appointmentId, reason, time,
                                mode, // [FIX] Pass mode (Video/Offline)
                                type, // [FIX] Pass type (Standard/Emergency)
                                aiFlag, status
                            }
                        }
                    })}
                    className="btn-start-consult">
                    View Case
                </button>
                <button className="btn-view-notes">
                    <FileText size={16} />
                </button>
            </div>
        </div>
    );
};

const AlertItem = ({ priority, title, desc, time }) => {
    const colors = {
        high: { border: '#ef4444', icon: '#ef4444' },
        medium: { border: '#f59e0b', icon: '#f59e0b' },
        low: { border: '#3b82f6', icon: '#3b82f6' }
    };
    const theme = colors[priority];

    return (
        <div style={{
            borderLeft: `3px solid ${theme.border}`,
            paddingLeft: '12px',
            position: 'relative'
        }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{title}</div>
            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>{desc}</p>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{time}</span>
        </div>
    );
};

const DoctorDashboard = () => {
    const { currentUser } = useAuth();
    const [isEmergencyMode, setIsEmergencyMode] = React.useState(false);
    const [appointments, setAppointments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!currentUser) return;

        // Query appointments for this doctor
        // Use mapped doctor_id if available (from users collection), otherwise fallback to UID
        const doctorIdToQuery = currentUser.doctor_id || currentUser.uid;

        console.log("DEBUG: DoctorDashboard querying appointments for:", doctorIdToQuery);

        const q = query(
            collection(db, "appointments"),
            where("doctor_id", "==", doctorIdToQuery)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(a => a.status !== 'CONSULTATION_ENDED' && a.status !== 'COMPLETED'); // [FIX] Filter completed
            // Sort by time (Client side to avoid Composite Index requirement during demo)
            apps.sort((a, b) => new Date(a.slot_time) - new Date(b.slot_time));

            setAppointments(apps);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const totalAppointments = appointments.length;
    const pendingConsults = appointments.filter(a => a.status === 'confirmed').length;

    return (
        <div className="dashboard-container">
            {/* Stats Row */}
            <div className="stats-grid">
                <StatCard
                    title="Today's Appointments"
                    value={totalAppointments}
                    subtext="Real-time"
                    icon={<Users />}
                    color="blue"
                />
                <StatCard
                    title="Pending Consults"
                    value={pendingConsults}
                    subtext="Queue active"
                    icon={<Clock />}
                    color="orange"
                />
                <StatCard
                    title="AI Flagged"
                    value="0"
                    subtext="Requires attention"
                    icon={<Activity />}
                    color="purple"
                />
                <StatCard
                    title="Critical / Emergency"
                    value={appointments.filter(a => a.severity === 'red').length}
                    subtext="Action required"
                    icon={<AlertCircle />}
                    color="red"
                    isCritical
                />
            </div>

            {/* Main Layout */}
            <div className="dashboard-main-grid">

                {/* Left: Schedule Timeline (Static Visual for Demo) */}
                <SectionShell
                    title="Today's Schedule"
                    action={
                        <button
                            onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                            className={`btn-squeeze-in ${isEmergencyMode ? 'active' : ''}`}
                        >
                            {isEmergencyMode ? 'End Emergency' : 'Squeeze In +'}
                        </button>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                        {/* Live Slots from Backend */}
                        <DashboardSchedule currentUser={currentUser} isEmergencyMode={isEmergencyMode} />
                    </div>
                </SectionShell>

                {/* Center: Active Patient Queue (REAL DATA) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="queue-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Active Queue</h3>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                Live from Database
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loading ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading Appointments...</div>
                            ) : appointments.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                    No active appointments found for this doctor account.
                                </div>
                            ) : (
                                appointments.map(appt => {
                                    // [FIX] Read from patient_snapshot (nested) or fallback to root (legacy)
                                    const pSnapshot = appt.patient_snapshot || {};
                                    const pName = pSnapshot.name || appt.patient_name || appt.patientName || "Unknown Patient";
                                    const pAge = pSnapshot.age || appt.patient_age || appt.age || "?";
                                    const pGender = pSnapshot.gender || appt.patient_gender || appt.gender || "?";

                                    // [FIX] Robust ID check
                                    const computedId = appt.patient_id || appt.profile_id || appt.id;

                                    return (
                                        <PatientCard
                                            key={appt.id}
                                            id={computedId}
                                            appointmentId={appt.id} // [ADDED] Pass appointment ID
                                            caseId={appt.case_id}
                                            name={pName}
                                            age={pAge}
                                            gender={pGender}
                                            reason={appt.severity === 'red' ? "Emergency / Critical" : "General Consultation"}
                                            time={appt.slot_time ? new Date(appt.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                            mode={appt.mode && appt.mode.toUpperCase() === 'VIDEO' ? 'Video' : (appt.mode || 'In-Person')} // [FIX] Case insensitive & fallback
                                            type={appt.severity === 'red' ? 'emergency' : 'standard'}
                                            aiFlag={appt.severity === 'red' ? "High Severity Triage" : null}
                                            status={appt.status} // [FIX] Pass status
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
// [FIX] Extracted interactive schedule component
const DashboardSchedule = ({ currentUser, isEmergencyMode }) => {
    const [liveSlots, setLiveSlots] = React.useState([]);
    const [slotsLoading, setSlotsLoading] = React.useState(true);

    React.useEffect(() => {
        if (currentUser?.doctor_id || currentUser?.uid) {
            const docId = currentUser.doctor_id || currentUser.uid;
            setSlotsLoading(true);
            fetch(`/get_slots?doctor_id=${docId}&status=ALL`)
                .then(res => res.json())
                .then(data => {
                    if (data.slots) {
                        // Filter for TODAY
                        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                        const todays = data.slots.filter(s => s.date === todayStr);
                        todays.sort((a, b) => a.start_time.localeCompare(b.start_time));
                        setLiveSlots(todays);
                    }
                })
                .catch(err => console.error("Dashboard Slots Error:", err))
                .finally(() => setSlotsLoading(false));
        }
    }, [currentUser]);

    if (slotsLoading) return <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading schedule...</div>;

    if (liveSlots.length === 0 && !isEmergencyMode) {
        return (
            <div style={{
                padding: '2rem', textAlign: 'center', color: '#94a3b8',
                background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1'
            }}>
                No slots scheduled for today.
            </div>
        );
    }

    return (
        <>
            {isEmergencyMode && (
                <TimeSlot
                    time="NOW"
                    event="SUDDEN DETORIATION - ICU 4"
                    type="emergency"
                    status="emergency"
                    isBlinking
                />
            )}
            {liveSlots.map(slot => {
                // Determine Status props
                const now = new Date();
                const slotStart = new Date(`${slot.date}T${slot.start_time}`);
                const isBooked = slot.status === 'BOOKED';
                // Check if slot is in the past (only if not booked, to show expired)
                // If booked, it stays "booked" (faded). If available but past, it's expired (faded).
                const isPast = slotStart < now;

                let visualStatus = 'active'; // Default for Available Future
                if (isBooked) visualStatus = 'completed';
                else if (isPast) visualStatus = 'completed';

                return (
                    <TimeSlot
                        key={slot.id}
                        time={new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        event={isBooked ? "Patient Appointment" : "Available Slot"}
                        type={isBooked ? "consult" : "open"}
                        status={visualStatus}
                    />
                );
            })}
        </>
    );
};

export default DoctorDashboard;
