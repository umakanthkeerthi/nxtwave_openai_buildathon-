import React, { useEffect, useState } from 'react';
import { Search, MapPin, Clock, Video, AlertCircle } from 'lucide-react';
import SymptomEvaluator from '../components/SymptomEvaluator';
import DoctorGridCarousel from '../components/DoctorGridCarousel';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MyAppointments from './MyAppointments';
import './ConsultDoctor.css';

import AppointmentBooking from '../components/AppointmentBooking';
import { useAuth } from '../context/AuthContext';
// Removed mock data import

const ConsultDoctor = ({ view = 'doctors' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, selectedProfile } = useAuth();
    const [blinkTrigger, setBlinkTrigger] = useState(0);
    const [mode, setMode] = useState('standard');

    // Data State
    const [allDoctors, setAllDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Derived Lists
    const [alreadyConsulted, setAlreadyConsulted] = useState([]);
    const [nearYou, setNearYou] = useState([]);
    const [otherDoctors, setOtherDoctors] = useState([]);

    // Booking Modal State
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        if (location.state?.type === 'emergency') {
            setMode('emergency');
        } else {
            setMode('standard');
        }
    }, [location.state]);


    // FETCH REAL DOCTORS
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                let url = '/get_doctors';

                // [MODIFIED] Emergency Logic
                if (location.state?.type === 'emergency' && location.state?.userLocation) {
                    const { lat, lon } = location.state.userLocation;
                    url = `/get_emergency_doctors?lat=${lat}&lon=${lon}`;
                    console.log(`DEBUG: Fetching Emergency Doctors from ${url}`);
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch doctors');

                const data = await response.json();
                console.log("DEBUG: Fetch data:", data);

                const docs = data.doctors || [];

                // Transform backend data
                // Backend now provides 'distance' and 'availableTime' for emergency endpoint
                const enrichedDocs = docs.map(d => ({
                    ...d,
                    id: d.id || d.doctor_id,
                    image: d.image || 'https://via.placeholder.com/150',
                    // Use backend data if available, else defaults
                    distance: d.distance !== undefined ? d.distance : (Math.random() * 10).toFixed(1),
                    availableTime: d.availableTime || "Check Availability"
                }));

                setAllDoctors(enrichedDocs);

                // Simulate categorization (In real app, backend would filter or we filter by actual logic)
                setAlreadyConsulted(enrichedDocs.slice(0, 3));
                setNearYou(enrichedDocs.slice(3, 8));
                setOtherDoctors(enrichedDocs.slice(8));

                setLoading(false);
            } catch (err) {
                console.error("Error fetching doctors:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [location.state]); // Added dependency on location.state


    const handleBookAppointment = () => {
        // [POLICY] Direct booking is not allowed. Must have AI Triage Summary.
        if (!location.state?.summary) {
            alert("Please consult the AI Agent first to generate a medical case.");
            navigate('/patient/chat');
            return;
        }
        setIsBookingOpen(true);
    };

    const handleEmergencyBook = (doctor) => {
        setSelectedDoctor(doctor);
        setIsBookingOpen(true);
    };


    // ... existing state ...

    // ... existing useEffects ...

    const handleBookingConfirm = async (details) => {
        try {
            const { doctor, slot_id, date, time } = details;

            // [UPDATED] Use selectedProfile for booking details
            // Fallback to currentUser if no profile selected (though should be enforced)
            const patientName = selectedProfile?.fullName || currentUser?.displayName || "Unknown";
            const patientAge = selectedProfile?.age || currentUser?.age || 0;
            const patientGender = selectedProfile?.gender || currentUser?.gender || "Not Specified";
            console.log("DEBUG: selectedProfile:", selectedProfile);
            console.log("DEBUG: currentUser:", currentUser);

            if (!selectedProfile) {
                alert("Error: No Patient Profile selected. Please go to Home and select a profile.");
                return;
            }

            const profileId = selectedProfile.profile_id || selectedProfile.id;
            // Fallback only if profile is strictly missing (which we blocked above, but for safety)
            if (!profileId) {
                alert("Error: Selected Profile has no ID.");
                return;
            }

            console.log("DEBUG: Booking for Profile:", profileId, patientName);

            console.log("VERSION CHECK: ConsultDoctor_v3_FIXED");

            // Prepare booking payload
            const bookingPayload = {
                profile_id: profileId, // [FIXED] Strict Profile ID
                user_id: currentUser?.uid || null, // [FIX] Ensure key exists locally even if null
                doctor_id: doctor.id || doctor.doctor_id,
                slot_id: slot_id,
                appointment_time: `${date}T${time}`,
                consultation_mode: mode === 'emergency' ? 'in-person' : 'video',
                patient_name: patientName,
                patient_age: patientAge,
                patient_gender: patientGender,
                // [FIXED] Enforce existing Case ID. Do not generate new one.
                session_id: location.state?.summary?.caseId,
                pre_doctor_consultation_summary_id: location.state?.pre_doctor_summary_id, // [New] Linked Summary
                is_emergency: mode === 'emergency' // [NEW] Flag for Emergency Queue
            };
            console.log("DEBUG: Sending Booking Payload:", bookingPayload);

            if (!bookingPayload.user_id) {
                alert("Error: User ID is missing. Please try logging out and back in.");
                console.error("CRITICAL: user_id is null/undefined in booking payload", currentUser);
                return;
            }

            const response = await fetch('/book_appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });

            if (!response.ok) {
                throw new Error('Failed to book appointment');
            }

            const result = await response.json();
            console.log("Booking Confirmed:", result);

            // Optionally show success message or navigate
            alert("Appointment booked successfully!");
        } catch (error) {
            console.error("Booking error:", error);
            alert("Failed to book appointment. Please try again.");
            throw error; // Re-throw so AppointmentBooking can handle it
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading specialists...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;


    // Emergency Data Preparation
    // [MODIFIED] Backend now returns sorted list, so we just take it or slice it.
    // If getting from generic /get_doctors, we still filter.
    // But if mode is emergency, allDoctors is already the sorted list from backend.

    let emergencyDoctors = [];
    if (mode === 'emergency') {
        emergencyDoctors = allDoctors; // Already sorted by backend
    } else {
        emergencyDoctors = allDoctors
            .filter(d => d.distance < 10)
            .slice(0, 10);
    }


    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <div className="consult-container">
            {/* Left Sidebar */}
            {/* Left Sidebar (Desktop Only) */}
            <div className="left-sidebar desktop-only">
                <SidebarItem label="Find Doctors" active={view === 'doctors'} to="/patient/consult" />
                <SidebarItem label="My Appointments" active={view === 'appointments'} to="/patient/consult/my-appointments" />
            </div>

            {/* Mobile View Toggle */}
            <div className="mobile-toggle-wrapper">
                <Link
                    to="/patient/consult"
                    className={`mobile-toggle-btn ${view === 'doctors' ? 'active' : ''}`}
                >
                    Find Doctors
                </Link>
                <Link
                    to="/patient/consult/my-appointments"
                    className={`mobile-toggle-btn ${view === 'appointments' ? 'active' : ''}`}
                >
                    My Appointments
                </Link>
            </div>

            {/* Main Content */}
            <motion.div
                className="main-content"
                variants={container}
                initial="hidden"
                animate="show"
                key={view + mode}
            >
                {view === 'doctors' ? (
                    <>
                        <div className="center-column">
                            {mode === 'emergency' && (
                                <motion.div variants={item} className="emergency-banner">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.8rem', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, color: '#991b1b', fontSize: '1.4rem' }}>Emergency Care Finder</h2>
                                            <p style={{ margin: '4px 0 0 0', color: '#7f1d1d' }}>Showing nearest available doctors for immediate in-person checkup.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'standard' && (
                                <motion.h2
                                    variants={item}
                                    style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}
                                >
                                    AI Clinical Agent Analysis
                                </motion.h2>
                            )}

                            {/* Context Banner from Patient Summary */}
                            {location.state?.summary && mode === 'standard' && (
                                <motion.div
                                    variants={item}
                                    style={{
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'start',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '6px', borderRadius: '50%' }}>
                                        <Search size={16} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#1e40af' }}>Matching Specialists for Case #{location.state.summary.caseId.slice(-6)}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a' }}>
                                            Based on <b>{location.state.summary.chiefComplaints?.[0] || "your symptoms"}</b>, we are highlighting relevant specialists below.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Only show AI/Search in Standard Mode */}
                            {mode === 'standard' && (
                                <>
                                    <motion.div variants={item}>
                                        <SymptomEvaluator variant="consult" blinkTrigger={blinkTrigger} />
                                    </motion.div>

                                    <motion.div variants={item} style={{ marginBottom: '2rem' }}>
                                        <button
                                            onClick={handleBookAppointment}
                                            className="btn-consult-cta"
                                        >
                                            <Video size={18} />
                                            Book Appointment for Doctor Consultation
                                        </button>
                                        <p style={{ textAlign: 'center', marginTop: '0.8rem', color: '#666', fontSize: '0.9rem' }}>
                                            Use our AI Clinical Agent above to match with the right specialist.
                                        </p>
                                    </motion.div>

                                    <motion.div variants={item} className="consult-search-row">
                                        <div className="search-bar-wrapper" style={{ flex: 1 }}>
                                            <Search size={20} color="#666" style={{ marginRight: '10px' }} />
                                            <input
                                                type="text"
                                                placeholder="Search for doctors..."
                                                className="search-input"
                                            />
                                        </div>
                                        <Link
                                            to="/patient/consult/directory"
                                            className="btn-view-directory"
                                        >
                                            View Full Directory
                                        </Link>
                                    </motion.div>
                                </>
                            )}

                            {mode === 'standard' ? (
                                <>
                                    <motion.div variants={item}>
                                        <DoctorGridCarousel title="From Recent Consultations" doctors={alreadyConsulted} showAction={false} />
                                    </motion.div>
                                    <motion.div variants={item}>
                                        <DoctorGridCarousel title="Doctors Near You" doctors={nearYou} showAction={false} />
                                    </motion.div>
                                    <motion.div variants={item}>
                                        <DoctorGridCarousel title="Other Top Rated Doctors" doctors={otherDoctors} showAction={false} />
                                    </motion.div>
                                </>
                            ) : (
                                /* EMERGENCY LIST VIEW */
                                <div className="emergency-list">
                                    {emergencyDoctors.map(doctor => (
                                        <motion.div variants={item} key={doctor.id} className="emergency-doctor-card">
                                            <img src={doctor.image} alt={doctor.name} className="e-doc-img" />
                                            <div className="e-doc-info">
                                                <div className="e-doc-header">
                                                    <h3>{doctor.name}</h3>
                                                    <span className="e-doc-specialty">{doctor.specialty}</span>
                                                </div>
                                                <div className="e-doc-meta">
                                                    <span className="meta-badge distance">
                                                        <MapPin size={14} /> {doctor.distance} km away
                                                    </span>
                                                    <span className={`meta-badge time ${doctor.availableTime === "Available Now" ? "now" : ""}`}>
                                                        <Clock size={14} /> {doctor.availableTime}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-book-emergency"
                                                onClick={() => handleEmergencyBook(doctor)}
                                            >
                                                Immediate Consult
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* Right Sidebar */}
                        {mode === 'standard' && (
                            <motion.div className="right-sidebar" variants={item}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#333' }}>By Department</h3>
                                <div className="department-grid">
                                    <DepartmentCard label="General" icon="🩺" />
                                    <DepartmentCard label="Paediatrics" icon="👶" />
                                    <DepartmentCard label="Gynaecology" icon="👩⚕️" />
                                    <DepartmentCard label="Diabetology" icon="🩸" />
                                    <DepartmentCard label="Cardiology" icon="❤️" />
                                    <DepartmentCard label="Pulmonology" icon="🫁" />
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <motion.div style={{ width: '100%' }} variants={item}>
                        <MyAppointments />
                    </motion.div>
                )}

            </motion.div>

            {/* Book Appointment Modal */}
            <AppointmentBooking
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                doctor={selectedDoctor}
                mode={mode}
                onConfirm={handleBookingConfirm}
            />
        </div>
    );
};

const SidebarItem = ({ label, active, to }) => {
    const content = (
        <div style={{
            padding: '0.8rem 1rem',
            borderRadius: '10px',
            cursor: 'pointer',
            backgroundColor: active ? 'rgba(7, 118, 89, 0.1)' : 'transparent',
            color: active ? 'var(--color-primary)' : 'var(--color-text)',
            fontWeight: active ? '600' : '500',
            borderLeft: active ? '4px solid var(--color-primary)' : '4px solid transparent',
            transition: 'all 0.2s'
        }}>
            {label}
        </div>
    );
    return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content;
};

const DepartmentCard = ({ label, icon }) => (
    <div className="department-card">
        <span style={{ fontSize: '1.8rem' }}>{icon}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555' }}>{label}</span>
    </div>
);

export default ConsultDoctor;
