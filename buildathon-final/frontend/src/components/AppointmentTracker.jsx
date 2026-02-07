import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, FileText, Video, Upload, ChevronDown, ChevronUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data for the steps (typically passed as props)
const stepsData = [
    {
        id: 1,
        title: "Symptoms Captured",
        status: "completed",
        tag: "AI Verified",
        tagColor: "green",
        content: null
    },
    {
        id: 2,
        title: "AI Triage Completed",
        status: "completed",
        tag: "AI Review",
        tagColor: "green",
        content: <div className="text-sm text-gray-600">Risk Level: <span className="font-bold text-gray-800">Low</span></div>
    },
    {
        id: 3,
        title: "Doctor Assigned",
        status: "completed",
        tag: "Doctor Review",
        tagColor: "blue",
        content: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="#666" />
                </div>
                <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>Dr. Priya Sharma</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>General Physician</div>
                </div>
            </div>
        )
    },
    {
        id: 4,
        title: "Awaiting Doctor Review",
        status: "current",
        tag: "Doctor Review",
        tagColor: "blue",
        expandedContent: (
            <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#00879e', marginBottom: '8px' }}>
                    <Clock size={16} />
                    <span>5-10 mins ETA</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5', marginBottom: '1rem' }}>
                    Your case is currently in queue for Dr. Sharma to conduct a thorough review. This is a crucial human-in-the-loop checkpoint.
                </p>
                <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#333' }}>What this means for you:</h4>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                        Dr. Sharma is reviewing your captured symptoms and AI triage results. This ensures accuracy and personalized care.
                    </p>
                </div>
                <button style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '50px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#555',
                    fontWeight: '500'
                }}>
                    <Upload size={18} />
                    Upload Reports
                </button>
            </div>
        )
    },
    {
        id: 5,
        title: "Consultation in Progress",
        status: "upcoming",
        tag: "Doctor Review",
        tagColor: "blue",
        content: (
            <div style={{ marginTop: '5px' }}>
                <button style={{ background: 'none', border: 'none', color: '#00879e', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'not-allowed', opacity: 0.6 }}>
                    <Video size={16} /> Call Video
                </button>
            </div>
        )
    },
    {
        id: 6,
        title: "Doctor Notes & Prescription Ready",
        status: "upcoming",
        tag: "Doctor Review",
        tagColor: "blue"
    },
    {
        id: 7,
        title: "Labs / Follow-ups Scheduled",
        status: "upcoming",
        tag: "Doctor Review",
        tagColor: "blue"
    },
    {
        id: 8,
        title: "Care Plan Active",
        status: "upcoming",
        tag: null
    }
];

const StepIcon = ({ status }) => {
    if (status === 'completed') return <CheckCircle size={24} color="#077659" />; // Green check
    if (status === 'current') return <Clock size={24} color="#00879e" />; // Teal clock
    return <Circle size={24} color="#ccc" />; // Grey circle
};

const Tag = ({ label, color }) => {
    if (!label) return null;
    const bg = color === 'green' ? 'rgba(7, 118, 89, 0.1)' : 'rgba(0, 135, 158, 0.1)';
    const text = color === 'green' ? '#077659' : '#00879e';
    return (
        <span style={{
            fontSize: '0.75rem',
            padding: '4px 8px',
            borderRadius: '50px',
            backgroundColor: bg,
            color: text,
            fontWeight: '600',
            marginLeft: '10px'
        }}>
            {label}
        </span>
    );
};

const AppointmentTracker = () => {
    // In a real app, expanded sections might be dynamic. Here we mimic the screenshot where "Current" is open.
    const [openStep, setOpenStep] = useState(4); // ID 4 is typically open

    const toggleStep = (id) => {
        setOpenStep(openStep === id ? null : id);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', paddingLeft: '20px' }}>
            {/* Vertical Line */}
            {/* Vertical Line */}
            <div style={{
                position: 'absolute',
                left: '28px', // Align with icon center (roughly)
                top: '20px',
                bottom: '40px',
                width: '2px',
                zIndex: 0
            }}>
                {/* Background Line (Gray) - Animates Drawing Down */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 2.5, ease: "linear" }} // Draws over 2.5s
                    style={{
                        width: '100%',
                        backgroundColor: '#e0e0e0',
                        position: 'absolute',
                        top: 0
                    }}
                />

                {/* Progress Line (Green/Teal) - Animates Filling */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: '45%' }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    style={{
                        width: '100%',
                        backgroundColor: '#077659',
                        position: 'absolute',
                        top: 0,
                        zIndex: 1
                    }}
                />
            </div>

            {stepsData.map((step, index) => {
                const isExpanded = openStep === step.id;

                return (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, scale: 0.95, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: index * 0.4, duration: 0.4 }} // Slow step-by-step reveal
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 1
                        }}
                    >
                        {/* Status Icon Column */}
                        <div style={{ backgroundColor: 'white', padding: '5px 0' /* Mask line behind icon */ }}>
                            <StepIcon status={step.status} />
                        </div>

                        {/* Card Content */}
                        <div
                            onClick={() => toggleStep(step.id)}
                            style={{
                                flex: 1,
                                borderRadius: '16px',
                                padding: '1.25rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                border: step.status === 'current' ? '1px solid #00879e' : '1px solid #f0f0f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: step.status === 'current' ? '#f0fcff' : 'white' // Slight tint for active
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#333', margin: 0 }}>
                                        {step.title}
                                    </h3>
                                    <Tag label={step.tag} color={step.tagColor} />
                                </div>
                                {isExpanded ? <ChevronUp size={18} color="#999" /> : <ChevronDown size={18} color="#999" />}
                            </div>

                            {/* Always Visible Short Content (if any) */}
                            {step.content && (
                                <div style={{ marginTop: '0.5rem' }}>{step.content}</div>
                            )}

                            {/* Collapsible Content */}
                            <AnimatePresence>
                                {isExpanded && step.expandedContent && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '0.8rem' }}>
                                            {step.expandedContent}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AppointmentTracker;
