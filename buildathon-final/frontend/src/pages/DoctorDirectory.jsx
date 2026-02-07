import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, Star, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import DoctorCard from '../components/DoctorCard';
import AppointmentBooking from '../components/AppointmentBooking';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';

const DoctorDirectory = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // Remote Data State
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Doctors from Firebase
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const q = query(collection(db, "users"), where("role", "==", "doctor"));
                const querySnapshot = await getDocs(q);
                const docsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDoctors(docsData);
            } catch (error) {
                console.error("Error fetching doctors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    // Categorize Doctors (Mocking "Near Me" logic based on typical seeds)
    const nearYouDoctors = doctors.filter(doc =>
        doc.location && (doc.location.includes("Delhi") || doc.location.includes("Noida") || doc.location.includes("Gurgaon"))
    );

    const otherDoctors = doctors.filter(doc =>
        !doc.location || (!doc.location.includes("Delhi") && !doc.location.includes("Noida") && !doc.location.includes("Gurgaon"))
    );

    // Filter for Search
    const getFilteredDoctors = (list) => {
        return list.filter(doc =>
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleBook = (doctor) => {
        console.log("Opening booking for:", doctor.name);
        setSelectedDoctor(doctor);
        setIsBookingOpen(true);
    };

    const handleConfirmBooking = async (details) => {
        console.log("Booking details:", details);
        try {
            await fetch('/book_appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: location.state?.summary?.caseId || "session_" + Date.now(),
                    patient_id: currentUser?.uid || "guest_" + Date.now(),
                    patient_name: currentUser?.profile?.fullName || currentUser?.displayName || "Anonymous Patient",
                    patient_age: currentUser?.profile?.age || "??",
                    patient_gender: currentUser?.profile?.gender || "??",
                    doctor_id: details.doctor.id,
                    appointment_time: details.date + " " + details.time,
                    consultation_mode: details.mode.toUpperCase(),
                    triage_decision: location.state?.summary?.triage === "Emergency" ? "EMERGENCY" : "SAFE"
                })
            });
            console.log("Booking API Success");
            // Show Success Notification (Optional but good UX)
            alert("Appointment Booked Successfully!");
            navigate('/patient/consult/my-appointments'); // Redirect to appointments page
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Failed to book appointment on server.");
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading Directory...</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/patient/consult')}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '1rem', color: '#666', marginBottom: '1rem'
                    }}
                >
                    <ArrowLeft size={20} /> Back to Consult
                </button>
                <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0 }}>Find a Specialist</h1>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Browse our verified network of medical professionals.</p>
            </div>

            {/* Context Banner */}
            {location.state?.summary && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '2rem',
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

            {/* Search & Filter */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '2rem',
                backgroundColor: 'white', padding: '1rem', borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, specialty, etc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                            borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '1rem'
                        }}
                    />
                </div>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0.8rem 1.5rem', backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                }}>
                    <Filter size={18} /> Filters
                </button>
            </div>

            {/* CATEGORIZED VIEW */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* 1. Near You (Filtered by Location) */}
                {getFilteredDoctors(nearYouDoctors).length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '24px', backgroundColor: '#10b981', borderRadius: '4px', display: 'block' }}></span>
                            Near You <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'normal' }}>(New Delhi Area)</span>
                        </h2>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'
                        }}>
                            {getFilteredDoctors(nearYouDoctors).map(doc => (
                                <DoctorCard
                                    key={doc.id}
                                    name={doc.name}
                                    specialty={doc.specialization}
                                    rating={4.8}
                                    reviews={120}
                                    location={doc.location}
                                    image={doc.image || "https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg"}
                                    showAction={true}
                                    onBookAppointment={() => handleBook(doc)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. All Other Specialists */}
                {getFilteredDoctors(otherDoctors).length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '24px', backgroundColor: '#8b5cf6', borderRadius: '4px', display: 'block' }}></span>
                            Other Top Specialists
                        </h2>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'
                        }}>
                            {getFilteredDoctors(otherDoctors).map(doc => (
                                <DoctorCard
                                    key={doc.id}
                                    name={doc.name}
                                    specialty={doc.specialization}
                                    rating={4.9}
                                    reviews={85}
                                    location={doc.location}
                                    image={doc.image || "https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg"}
                                    showAction={true}
                                    onBookAppointment={() => handleBook(doc)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {doctors.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        No doctors found. Please try again later.
                    </div>
                )}
            </div>

            {/* Book Appointment Modal */}
            <AppointmentBooking
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                doctor={selectedDoctor}
                mode="standard"
                onConfirm={handleConfirmBooking}
            />
        </div>
    );
};

export default DoctorDirectory;
