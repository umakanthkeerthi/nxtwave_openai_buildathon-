import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, User, MapPin, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentTracker from '../components/AppointmentTracker';
import './MyAppointments.css';

import { useAuth } from '../context/AuthContext';

const MyAppointments = () => {
    const { currentUser, selectedProfile } = useAuth();
    const [selectedId, setSelectedId] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("DEBUG: MyAppointments mounted/updated. currentUser:", currentUser);
        console.log("DEBUG: selectedProfile:", selectedProfile);

        const fetchAppointments = async () => {
            if (!currentUser) {
                console.log("DEBUG: No currentUser yet, skipping fetch. Waiting for Auth...");
                setLoading(false); // Stop loading if no user
                return;
            }

            try {
                // Use the Selected Profile ID
                // If the selected profile is strict "Self", we might want to use the owner_uid (currentUser.uid) 
                // because that's how appointments are often saved initially.
                let queryString = "";

                if (selectedProfile && selectedProfile.id) {
                    // Specific Profile Selected
                    // Handle "Self" strict check if needed, but generally use profile ID
                    let targetPid = selectedProfile.id;
                    if (selectedProfile.relation === 'Self' && selectedProfile.owner_uid) {
                        // Some logic uses owner_uid for Self, but let's stick to consistent profile_id if possible.
                        // For now, let's trust selectedProfile.id unless it's missing
                    }
                    console.log("DEBUG: Fetching by patient_id (Profile):", targetPid);
                    queryString = `patient_id=${targetPid}`;
                } else {
                    // No Profile Selected = Account Owner Overview
                    // Fetch ALL appointments for this user
                    console.log("DEBUG: Fetching by user_id (Owner):", currentUser.uid);
                    queryString = `user_id=${currentUser.uid}`;
                }

                const response = await fetch(`/get_appointments?${queryString}`);
                console.log("DEBUG: Response status:", response.status, response.ok);

                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                console.log("DEBUG: Response data:", data);
                console.log("DEBUG: Data length:", data.length);

                const formatted = data.map(apt => {
                    // Backend returns slot_time as "YYYY-MM-DD HH:MM AM/PM"
                    const slotTime = apt.slot_time || apt.appointment_time || "";
                    let date = "N/A";
                    let time = "N/A";

                    // Parse date and time
                    const dateObj = new Date(apt.slot_time);
                    const dateFormatted = isNaN(dateObj.getTime()) ? apt.slot_time.split(' ')[0] : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                    const timeFormatted = isNaN(dateObj.getTime()) ? apt.slot_time.split(' ').slice(1).join(' ') : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                    return {
                        id: apt.id,
                        caseId: apt.case_id, // Pass case_id for tracking
                        doctorName: apt.doctorName || "Dr. Assigned",
                        specialty: apt.specialty || "General Physician",
                        date: dateFormatted,
                        time: timeFormatted,
                        status: apt.status || "Scheduled",
                        statusColor: (apt.status === "Completed") ? "green" : "blue",
                        image: apt.doctorImage || "https://randomuser.me/api/portraits/legos/1.jpg",
                        mode: apt.mode || "standard" // [NEW] Default to standard (Video) if missing
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
    }, [currentUser, selectedProfile]);

    return (
        <div className="my-appointments-container">
            <AnimatePresence mode="wait">
                {!selectedId ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="appointments-title">Your Appointments</h2>
                            <button
                                onClick={() => window.location.reload()}
                                style={{ padding: '8px 16px', background: '#077659', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Force Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                Loading your appointments...
                            </div>
                        ) : appointments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No appointments yet</p>
                                <p style={{ fontSize: '0.9rem' }}>Book your first appointment to get started!</p>
                            </div>
                        ) : (
                            <div className="appointments-grid">
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        onClick={() => setSelectedId(apt.id)}
                                        className="appointment-card"
                                    >
                                        <div className="appointment-info-wrapper">
                                            {/* Avatar */}
                                            <div className="appointment-avatar">
                                                <img src={apt.image} alt={apt.doctorName} />
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <h3 className="doctor-name">{apt.doctorName}</h3>
                                                <p className="doctor-specialty">{apt.specialty}</p>
                                                <div className="appointment-meta">
                                                    <span className="meta-item"><Calendar size={14} /> {apt.date}</span>
                                                    <span className="meta-item"><Clock size={14} /> {apt.time}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Action */}
                                        <div className="appointment-status-wrapper">
                                            <span
                                                className="status-badge"
                                                style={{
                                                    backgroundColor: apt.status === 'In Progress' ? 'rgba(0, 135, 158, 0.1)' : 'rgba(7, 118, 89, 0.1)',
                                                    color: apt.status === 'In Progress' ? 'var(--color-primary)' : '#077659'
                                                }}
                                            >
                                                {apt.status}
                                            </span>
                                            <ChevronRight size={20} color="#ccc" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="tracker"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        {/* Header with Back Button */}
                        <div className="tracking-header">
                            <button
                                onClick={() => setSelectedId(null)}
                                className="back-btn"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="tracking-title">Appointment Tracking</h2>
                                <p className="tracking-id">ID: #APT-2026-00{selectedId}</p>
                            </div>
                        </div>

                        {/* The Step Tracker Component */}
                        <AppointmentTracker
                            caseId={appointments.find(a => a.id === selectedId)?.caseId}
                            doctorName={appointments.find(a => a.id === selectedId)?.doctorName}
                            specialty={appointments.find(a => a.id === selectedId)?.specialty}
                            appointmentMode={appointments.find(a => a.id === selectedId)?.mode} // [NEW] Pass mode
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyAppointments;
