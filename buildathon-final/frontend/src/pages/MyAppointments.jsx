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
        const fetchAppointments = async () => {
            if (!currentUser) return;

            try {
                // Use the Selected Profile ID
                const targetId = selectedProfile?.id || currentUser.uid;
                const response = await fetch(`/get_appointments?patient_id=${targetId}`);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();

                const formatted = data.map(apt => ({
                    id: apt.id,
                    doctorName: apt.doctorName || "Dr. Assigned", // Fallback if not saved
                    specialty: apt.specialty || "General Physician",
                    date: new Date(apt.appointment_time).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
                    time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: apt.status || "Scheduled",
                    statusColor: (apt.status === "Completed") ? "green" : "blue",
                    image: "https://randomuser.me/api/portraits/legos/1.jpg" // Placeholder
                }));
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
                        <h2 className="appointments-title">Your Appointments</h2>

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
                        <AppointmentTracker />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyAppointments;
