import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Clock, Video, AlertCircle, X } from 'lucide-react';
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
    const { t } = useTranslation();
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

    // Toast notification state
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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
                let url = `${import.meta.env.VITE_API_URL}/get_doctors`;

                // [MODIFIED] Emergency Logic
                if (location.state?.type === 'emergency' && location.state?.userLocation) {
                    const { lat, lon } = location.state.userLocation;
                    url = `${import.meta.env.VITE_API_URL}/get_emergency_doctors?lat=${lat}&lon=${lon}`;
                    console.log(`DEBUG: Fetching Emergency Doctors from ${url}`);
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for emergency queries

                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

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
                    availableTime: d.availableTime || t('consult_doctor.emergency.check_availability')
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
            showToast('Please consult the AI Agent first to generate a medical case.', 'error');
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
                showToast('No patient profile selected. Please go to Home and select a profile.', 'error');
                return;
            }

            const profileId = selectedProfile.profile_id || selectedProfile.id;
            // Fallback only if profile is strictly missing (which we blocked above, but for safety)
            if (!profileId) {
                showToast('Selected profile has no ID.', 'error');
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
                showToast('User ID is missing. Please try logging out and back in.', 'error');
                console.error("CRITICAL: user_id is null/undefined in booking payload", currentUser);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/book_appointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });

            if (!response.ok) {
                throw new Error('Failed to book appointment');
            }

            const result = await response.json();
            console.log("Booking Confirmed:", result);

            // Show success toast
            showToast('Appointment booked successfully!', 'success');
        } catch (error) {
            console.error("Booking error:", error);
            showToast('Failed to book appointment. Please try again.', 'error');
            throw error; // Re-throw so AppointmentBooking can handle it
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('consult_doctor.loading')}</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{t('consult_doctor.error')} {error}</div>;


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
                <SidebarItem label={t('consult_doctor.sidebar.find_doctors')} active={view === 'doctors'} to="/patient/consult" />
                <SidebarItem label={t('consult_doctor.sidebar.my_appointments')} active={view === 'appointments'} to="/patient/consult/my-appointments" />
            </div>

            {/* Mobile View Toggle */}
            <div className="mobile-toggle-wrapper">
                <Link
                    to="/patient/consult"
                    className={`mobile-toggle-btn ${view === 'doctors' ? 'active' : ''}`}
                >
                    {t('consult_doctor.sidebar.find_doctors')}
                </Link>
                <Link
                    to="/patient/consult/my-appointments"
                    className={`mobile-toggle-btn ${view === 'appointments' ? 'active' : ''}`}
                >
                    {t('consult_doctor.sidebar.my_appointments')}
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
                                            <h2 style={{ margin: 0, color: '#991b1b', fontSize: '1.4rem' }}>{t('consult_doctor.emergency.title')}</h2>
                                            <p style={{ margin: '4px 0 0 0', color: '#7f1d1d' }}>{t('consult_doctor.emergency.subtitle')}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'standard' && (
                                <motion.h2
                                    variants={item}
                                    style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}
                                >
                                    {t('consult_doctor.standard.ai_analysis')}
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
                                        <h4 style={{ margin: '0 0 4px 0', color: '#1e40af' }}>{t('consult_doctor.standard.matching_specialists')} #{location.state.summary.caseId.slice(-6)}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a' }}>
                                            {t('consult_doctor.standard.based_on')} <b>{location.state.summary.chiefComplaints?.[0] || t('consult_doctor.standard.your_symptoms')}</b>, {t('consult_doctor.standard.highlighting')}
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
                                            {t('consult_doctor.standard.book_appointment')}
                                        </button>
                                        <p style={{ textAlign: 'center', marginTop: '0.8rem', color: '#666', fontSize: '0.9rem' }}>
                                            {t('consult_doctor.standard.use_ai_agent')}
                                        </p>
                                    </motion.div>

                                    <motion.div variants={item} className="consult-search-row">
                                        <div className="search-bar-wrapper" style={{ flex: 1 }}>
                                            <Search size={20} color="#666" style={{ marginRight: '10px' }} />
                                            <input
                                                type="text"
                                                placeholder={t('consult_doctor.standard.search_placeholder')}
                                                className="search-input"
                                            />
                                        </div>
                                        <Link
                                            to="/patient/consult/directory"
                                            className="btn-view-directory"
                                        >
                                            {t('consult_doctor.standard.view_directory')}
                                        </Link>
                                    </motion.div>
                                </>
                            )}

                            {mode === 'standard' ? (
                                <>
                                    <motion.div variants={item}>
                                        <DoctorGridCarousel title={t('consult_doctor.standard.recent_consultations')} doctors={alreadyConsulted} showAction={false} />
                                    </motion.div>
                                    <motion.div variants={item}>
                                        <DoctorGridCarousel title={t('consult_doctor.standard.near_you')} doctors={nearYou} showAction={false} />
                                    </motion.div>
                                    <motion.div variants={item}>
                                        <DoctorGridCarousel title={t('consult_doctor.standard.top_rated')} doctors={otherDoctors} showAction={false} />
                                    </motion.div>
                                </>
                            ) : (
                                /* EMERGENCY LIST VIEW */
                                <>
                                    {/* Emergency Alert Banner */}
                                    <motion.div
                                        variants={item}
                                        style={{
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '12px',
                                            padding: '1rem 1.25rem',
                                            marginBottom: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{
                                            background: '#dc2626',
                                            color: 'white',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{
                                                margin: '0 0 4px 0',
                                                color: '#991b1b',
                                                fontSize: '1.1rem',
                                                fontWeight: '600'
                                            }}>
                                                {t('consult_doctor.emergency.title')}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.9rem',
                                                color: '#7f1d1d'
                                            }}>
                                                {t('consult_doctor.emergency.subtitle')}
                                            </p>
                                        </div>
                                    </motion.div>

                                    <div className="emergency-list">
                                        {emergencyDoctors.map(doctor => (
                                            <motion.div
                                                variants={item}
                                                key={doctor.id}
                                                whileHover={{ scale: 1.01 }}
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    padding: '1.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    marginBottom: '1rem',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {/* Doctor Avatar */}
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    background: '#f3f4f6'
                                                }}>
                                                    <img
                                                        src={doctor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0ea5e9&color=fff&size=128`}
                                                        alt={doctor.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </div>

                                                {/* Doctor Info */}
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{
                                                        margin: '0 0 6px 0',
                                                        fontSize: '1.05rem',
                                                        fontWeight: '600',
                                                        color: '#111827'
                                                    }}>
                                                        {doctor.name}
                                                    </h4>

                                                    {/* Metadata Badges */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        {/* Distance Badge */}
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '0.85rem',
                                                            color: '#059669',
                                                            fontWeight: '500'
                                                        }}>
                                                            <MapPin size={14} />
                                                            {doctor.distance} {t('consult_doctor.emergency.distance')}
                                                        </span>

                                                        {/* Availability Badge */}
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '0.85rem',
                                                            color: doctor.availableTime === "Available Now" ? '#dc2626' : '#6b7280',
                                                            fontWeight: '500'
                                                        }}>
                                                            <Clock size={14} />
                                                            {doctor.availableTime || t('consult_doctor.emergency.available_now')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Specialization Tag */}
                                                <div style={{
                                                    padding: '6px 12px',
                                                    background: '#f3f4f6',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    color: '#4b5563',
                                                    fontWeight: '500',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {doctor.specialization || doctor.specialty || "General"}
                                                </div>

                                                {/* Book Now Button (Red styled) */}
                                                <button
                                                    onClick={() => handleEmergencyBook(doctor)}
                                                    style={{
                                                        background: '#dc2626',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '10px 20px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#b91c1c';
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#dc2626';
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                                                    }}
                                                >
                                                    {t('doctor_card.book_now')}
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            )}

                        </div>

                        {/* Right Sidebar */}
                        {mode === 'standard' && (
                            <motion.div className="right-sidebar" variants={item}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#333' }}>{t('consult_doctor.standard.by_department')}</h3>
                                <div className="department-grid">
                                    <DepartmentCard label={t('consult_doctor.departments.general')} icon="🩺" />
                                    <DepartmentCard label={t('consult_doctor.departments.paediatrics')} icon="👶" />
                                    <DepartmentCard label={t('consult_doctor.departments.gynaecology')} icon="👩⚕️" />
                                    <DepartmentCard label={t('consult_doctor.departments.diabetology')} icon="🩸" />
                                    <DepartmentCard label={t('consult_doctor.departments.cardiology')} icon="❤️" />
                                    <DepartmentCard label={t('consult_doctor.departments.pulmonology')} icon="🫁" />
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

            {/* Toast Notification */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        position: 'fixed',
                        top: '2rem',
                        right: '2rem',
                        zIndex: 9999,
                        background: toast.type === 'success' ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minWidth: '300px',
                        maxWidth: '500px'
                    }}
                >
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        {toast.type === 'success' ? '✓' : '✕'}
                    </div>
                    <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: '500' }}>
                        {toast.message}
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px',
                            opacity: 0.8,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={18} />
                    </button>
                </motion.div>
            )}
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
