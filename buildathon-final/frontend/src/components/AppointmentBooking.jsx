import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, CheckCircle, Video } from 'lucide-react';

const AppointmentBooking = ({ isOpen, onClose, doctor, mode = 'standard', onConfirm }) => {
    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [step, setStep] = useState('selection'); // 'selection' | 'success'

    if (!isOpen || !doctor) return null;

    // Mock Date Generation (Today + Next 2 days)
    const dates = Array.from({ length: 3 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate(),
            fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    });

    // Mock Slots
    const slots = [
        "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "02:00 PM", "02:30 PM", "03:00 PM", "04:30 PM"
    ];

    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm({
                doctor,
                date: dates[selectedDate].fullDate,
                time: selectedSlot || slots[0],
                mode
            });
            setStep('success');
            // Auto close after showing success
            setTimeout(() => {
                setStep('selection');
                onClose();
            }, 2000);
        } catch (e) {
            console.error(e);
            alert("Booking Failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            width: '100%', maxWidth: '500px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}
                    >
                        {step === 'selection' ? (
                            <>
                                {/* Header */}
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid #eee',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                                        {mode === 'emergency' ? '🚨 Immediate Consult' : 'Book Appointment'}
                                    </h3>
                                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <X size={24} color="#666" />
                                    </button>
                                </div>

                                {/* Doctor Mini Profile */}
                                <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <img src={doctor.image} alt={doctor.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div>
                                        <h4 style={{ margin: 0 }}>{doctor.name}</h4>
                                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{doctor.specialty}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginTop: '4px', color: '#555' }}>
                                            {mode === 'emergency' ? <MapPin size={14} /> : <Video size={14} />}
                                            {mode === 'emergency' ? `${doctor.distance} km away` : 'Video Consultation'}
                                        </div>
                                    </div>
                                </div>

                                {/* Slot Selection */}
                                <div style={{ padding: '1.5rem' }}>
                                    {mode === 'standard' && (
                                        <>
                                            <p style={{ fontWeight: '600', marginBottom: '1rem' }}>Select Date</p>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                                {dates.map((d, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedDate(i)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.8rem',
                                                            borderRadius: '12px',
                                                            border: selectedDate === i ? '2px solid var(--color-primary)' : '1px solid #eee',
                                                            backgroundColor: selectedDate === i ? 'rgba(7, 118, 89, 0.05)' : 'white',
                                                            textAlign: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>{d.day}</span>
                                                        <span style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem' }}>{d.date}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <p style={{ fontWeight: '600', marginBottom: '1rem' }}>Select Time</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
                                                {slots.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedSlot(s)}
                                                        style={{
                                                            padding: '0.6rem',
                                                            borderRadius: '8px',
                                                            border: selectedSlot === s ? '1px solid var(--color-primary)' : '1px solid #ddd',
                                                            backgroundColor: selectedSlot === s ? 'var(--color-primary)' : 'white',
                                                            color: selectedSlot === s ? 'white' : '#333',
                                                            fontSize: '0.9rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {mode === 'emergency' && (
                                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                backgroundColor: '#fee2e2', color: '#dc2626',
                                                padding: '0.5rem 1rem', borderRadius: '50px',
                                                fontWeight: '600', marginBottom: '1rem'
                                            }}>
                                                <Clock size={16} />
                                                Next Available Slot: Today, {slots[0]}
                                            </div>
                                            <p style={{ color: '#666', lineHeight: '1.5' }}>
                                                Confirming this will notify the clinic immediately.
                                                <br />Please proceed to the clinic location.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Action */}
                                <div style={{ padding: '1.5rem', borderTop: '1px solid #eee' }}>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={mode === 'standard' && !selectedSlot}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: mode === 'emergency' ? '#dc2626' : 'var(--color-primary)',
                                            color: 'white',
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            cursor: (mode === 'standard' && !selectedSlot) ? 'not-allowed' : 'pointer',
                                            opacity: (mode === 'standard' && !selectedSlot) ? 0.5 : 1,
                                            boxShadow: mode === 'emergency' ? '0 4px 12px rgba(220, 38, 38, 0.3)' : '0 4px 12px rgba(7, 118, 89, 0.3)'
                                        }}
                                    >
                                        {isLoading ? "Booking..." : (mode === 'emergency' ? 'Confirm Immediate Consult' : 'Confirm Booking')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        backgroundColor: '#dcfce7', color: '#166534',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 1.5rem'
                                    }}
                                >
                                    <CheckCircle size={40} />
                                </motion.div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h3>
                                <p style={{ color: '#666', marginBottom: '2rem' }}>
                                    Appointment with <b>{doctor.name}</b> has been scheduled.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AppointmentBooking;
