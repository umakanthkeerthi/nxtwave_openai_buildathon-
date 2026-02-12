import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, MapPin, Video, MoreVertical,
    CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

const MOCK_APPOINTMENTS = [
    {
        id: 1,
        name: "Rahul Verma",
        time: "10:30 AM",
        date: "Today",
        mode: "Offline",
        reason: "Chest Pain Follow-up",
        status: "Upcoming",
        type: "Standard",
        distance: "2.4 km"
    },
    {
        id: 2,
        name: "Sarah Jenkins",
        time: "11:00 AM",
        date: "Today",
        mode: "Video",
        reason: "Migraine Consultation",
        status: "Upcoming",
        type: "Standard"
    },
    {
        id: 3,
        name: "Emergency: John Doe",
        time: "11:30 AM",
        date: "Today",
        mode: "Offline",
        reason: "Acute Breathlessness",
        status: "Upcoming",
        type: "Emergency",
        distance: "1.1 km"
    },
    {
        id: 4,
        name: "Amit Patel",
        time: "09:00 AM",
        date: "Tomorrow",
        mode: "Offline",
        reason: "Diabetes Check",
        status: "Scheduled",
        type: "Standard"
    }
];

import './DoctorScheduledAppointments.css';

import { useAuth } from '../context/AuthContext';

const DoctorScheduledAppointments = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Today');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!currentUser) return;

            try {
                // Use mapped doctor_id if available, fallback to UID
                const doctorId = currentUser.doctor_id || currentUser.uid;
                const response = await fetch(`${import.meta.env.VITE_API_URL}/get_appointments?doctor_id=${doctorId}`);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Transform Backend Data to UI Format
                const formatted = data.map(apt => {
                    const aptDate = new Date(apt.slot_time || apt.appointment_time);
                    const aptDay = new Date(aptDate);
                    aptDay.setHours(0, 0, 0, 0);

                    let dateCategory = 'Past';
                    if (aptDay.getTime() === today.getTime()) dateCategory = 'Today';
                    else if (aptDay.getTime() > today.getTime()) dateCategory = 'Upcoming';

                    return {
                        id: apt.id,
                        name: apt.patient_snapshot?.name || apt.patient_name || "Unknown",
                        time: aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        date: dateCategory,
                        dateString: aptDate.toDateString(),
                        mode: apt.mode || apt.consultation_mode || "Video",
                        reason: apt.severity === 'red' ? "Critical / Emergency" : (apt.triage_decision ? `Triage: ${apt.triage_decision}` : "General Consultation"),
                        status: apt.status || "Scheduled",
                        type: apt.severity === 'red' ? "Emergency" : "Standard",
                        patient_id: apt.patient_id || apt.profile_id,
                        case_id: apt.case_id, // [NEW] Pass Case ID
                        summary_id: apt.pre_doctor_consultation_summary_id // [NEW] Pass Summary ID
                    };
                });

                setAppointments(formatted);
            } catch (error) {
                console.error("Error fetching appointments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [currentUser]);

    const filteredAppointments = appointments.filter(apt => apt.date === activeTab);

    return (
        <div className="schedule-container">
            <div className="schedule-header">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Scheduled Appointments</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Manage your appointments and availability</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{
                        padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: '8px', color: '#334155', fontWeight: '600', cursor: 'pointer'
                    }}>
                        Sync Calendar
                    </button>
                    <button
                        onClick={() => navigate('/doctor/my-slots')}
                        style={{
                            padding: '10px 16px', background: '#0f766e', border: 'none',
                            borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer'
                        }}>
                        + Add Slot
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                {['Today', 'Upcoming', 'Past'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 24px', borderRadius: '20px', border: 'none',
                            background: activeTab === tab ? '#0f766e' : 'transparent',
                            color: activeTab === tab ? 'white' : '#64748b',
                            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredAppointments.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                        No appointments found for {activeTab}.
                    </div>
                ) : (
                    filteredAppointments.map(apt => (
                        <AppointmentCard key={apt.id} data={apt} />
                    ))
                )}
            </div>
        </div>
    );
};

import { useNavigate } from 'react-router-dom';

const AppointmentCard = ({ data }) => {
    const isEmergency = data.type === 'Emergency';
    const isOffline = data.mode === 'Offline';
    const navigate = useNavigate();

    return (
        <div className={`appointment-card ${isEmergency ? 'emergency' : 'standard'}`}>
            {/* Left: Time & details */}
            <div className="card-content-wrapper">
                <div className="time-column">
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>{data.time}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>{data.date}</span>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{data.name}</h3>
                        {isEmergency && (
                            <span style={{
                                background: '#dc2626', color: 'white', padding: '2px 8px',
                                borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                            }}>
                                EMERGENCY
                            </span>
                        )}
                    </div>
                    <div style={{ color: '#475569', marginBottom: '12px' }}>{data.reason}</div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isOffline ? <MapPin size={16} /> : <Video size={16} />}
                            {data.mode} {isOffline && `(${data.distance})`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="actions-wrapper">
                <button
                    onClick={() => navigate(`/doctor/patients/${data.patient_id}`, {
                        state: {
                            defaultTab: 'Consultation',
                            patientData: {
                                name: data.name,
                                id: data.patient_id,
                                caseId: data.case_id,
                                summaryId: data.summary_id,
                                mode: data.mode, // [FIX] Pass mode
                                type: data.type // [FIX] Pass type
                            }
                        }
                    })}
                    style={{
                        padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none',
                        borderRadius: '6px', fontWeight: '600', cursor: 'pointer', flex: 2
                    }}>
                    Start Consult
                </button>
                <button style={{
                    padding: '8px', background: 'white', border: '1px solid #cbd5e1',
                    borderRadius: '6px', color: '#64748b', cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'center'
                }}>
                    Reschedule
                </button>
                <button style={{
                    padding: '8px', background: 'white', border: '1px solid #cbd5e1',
                    borderRadius: '6px', color: '#ef4444', cursor: 'pointer', flex: 0.5, display: 'flex', justifyContent: 'center'
                }}>
                    <XCircle size={18} />
                </button>
            </div>
        </div>
    );
};

export default DoctorScheduledAppointments;
