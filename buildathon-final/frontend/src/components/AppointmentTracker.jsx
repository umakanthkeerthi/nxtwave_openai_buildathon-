import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Circle, FileText, Video, Upload, ChevronDown, ChevronUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data for the steps (typically passed as props)
// stepsData moved inside component to access props

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

const AppointmentTracker = ({ caseId, doctorName, specialty }) => {
    // Generate steps data with dynamic props
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
                        <div style={{ fontWeight: '600', color: '#333' }}>{doctorName || "Dr. Assigned"}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{specialty || "Specialist"}</div>
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
                        Your case is currently in queue for {doctorName ? doctorName : 'the doctor'} to conduct a thorough review. This is a crucial human-in-the-loop checkpoint.
                    </p>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#333' }}>What this means for you:</h4>
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                            {doctorName ? doctorName : 'The doctor'} is reviewing your captured symptoms and AI triage results. This ensures accuracy and personalized care.
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

    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [steps, setSteps] = useState(stepsData);
    const [openStep, setOpenStep] = useState(null);

    const toggleStep = (id) => {
        setOpenStep(openStep === id ? null : id);
    };

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTracking = async () => {
            if (!caseId) {
                console.log("DEBUG: No caseId provided to tracker");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/get_case?case_id=${caseId}`);
                if (response.ok) {
                    const caseData = await response.json();
                    console.log("DEBUG: Tracker fetched case:", caseData);

                    // Map Status to Steps
                    // defined in doctor_consultation.py: DOCTOR_ASSIGNED
                    const status = caseData.status;

                    let currentStepId = 1;
                    if (status === "Submitted") currentStepId = 2; // AI Triage
                    if (status === "DOCTOR_ASSIGNED") currentStepId = 3;
                    if (status === "CONSULTATION_SCHEDULED") currentStepId = 4;
                    if (status === "COMPLETED") currentStepId = 6;

                    setActiveStep(currentStepId);
                    setOpenStep(currentStepId); // Auto open current step

                    // Update steps status based on currentStepId
                    const updatedSteps = stepsData.map(step => {
                        if (step.id < currentStepId) return { ...step, status: 'completed' };
                        if (step.id === currentStepId) return { ...step, status: 'current' };
                        return { ...step, status: 'upcoming' };
                    });
                    setSteps(updatedSteps);
                } else {
                    console.error("Failed to fetch case:", response.status);
                    setError("Tracking information not available for this appointment.");
                }
            } catch (error) {
                console.error("Error fetching case tracking:", error);
                setError("Unable to load tracking details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTracking();
    }, [caseId]);

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading tracking info...</div>;

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '8px', margin: '20px' }}>
                <p>{error}</p>
                <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>ID: {caseId}</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', paddingLeft: '20px' }}>
            {/* Vertical Line */}
            <div style={{
                position: 'absolute',
                left: '28px', // Align with icon center (roughly)
                top: '20px',
                bottom: '40px',
                width: '2px',
                zIndex: 0
            }}>
                {/* Background Line */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#e0e0e0',
                    position: 'absolute',
                    top: 0
                }} />

                {/* Progress Line */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    style={{
                        width: '100%',
                        backgroundColor: '#077659',
                        position: 'absolute',
                        top: 0,
                        zIndex: 1
                    }}
                />
            </div>

            {steps.map((step, index) => {
                const isExpanded = openStep === step.id;

                return (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, scale: 0.95, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 1
                        }}
                    >
                        {/* Status Icon Column */}
                        <div style={{ backgroundColor: 'white', padding: '5px 0' }}>
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
                                backgroundColor: step.status === 'current' ? '#f0fcff' : 'white'
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

                            {/* Always Visible Short Content */}
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
