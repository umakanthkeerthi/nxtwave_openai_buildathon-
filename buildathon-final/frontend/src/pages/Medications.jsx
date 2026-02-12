import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    User,
    Info,
    CheckCircle,
    Sun,
    Moon,
    Sunset,
    Sunrise,
    Droplet,
    X,
    Bell,
    BellOff,
    Utensils,
    Eye,
    ShoppingCart,
    Pill
} from 'lucide-react';


const Medications = () => {
    const [activeTab, setActiveTab] = useState('active');
    const location = useLocation();
    const navigate = useNavigate();
    const [filterPrescriptionId, setFilterPrescriptionId] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    useEffect(() => {
        if (location.state?.prescriptionId) {
            setFilterPrescriptionId(location.state.prescriptionId);
            setActiveTab(location.state.tab || 'active');
        }
    }, [location.state]);

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
            new Notification('DocAI Reminders Enabled', {
                body: 'You will now receive medication reminders on this device.',
                icon: '/vite.svg' // Placeholder icon
            });
        }
    };

    const sendReminder = (medName) => {
        if (notificationPermission === 'granted') {
            new Notification(`Time to take ${medName}`, {
                body: `It's time for your scheduled dose of ${medName}.`,
                icon: '/vite.svg'
            });
        } else {
            requestNotificationPermission();
        }
    };

    const clearFilter = () => {
        setFilterPrescriptionId(null);
        // Optional: clear state from history so refresh doesn't bring it back, 
        // but simple state clear is enough for now.
        navigate('.', { replace: true, state: {} });
    };

    // Unified Mock Data matching MedicalFiles.jsx (Dr. Rajesh Gupta & Dr. Emily Clark)
    const medications = [
        // Dr. Rajesh Gupta (RX-2026-88) - Viral Pyrexia
        {
            id: 1,
            name: "Dolo 650mg",
            dosage: "650mg",
            prescribedBy: "Dr. Rajesh Gupta",
            daysLeft: 3,
            schedule: ['morning', 'noon', 'night'],
            status: "pending",
            type: "Tablet",
            prescriptionId: "RX-2026-88",
            caseId: "MR-2026-009",
            instruction: "After Food",
            advice: "Drink plenty of water. Complete the full course of antibiotics. Avoid cold foods."
        },
        {
            id: 2,
            name: "Cetzine 10mg",
            dosage: "10mg",
            prescribedBy: "Dr. Rajesh Gupta",
            daysLeft: 5,
            schedule: ['night'],
            status: "pending",
            type: "Tablet",
            prescriptionId: "RX-2026-88",
            caseId: "MR-2026-009",
            instruction: "Before Sleep",
            advice: "Drink plenty of water. Complete the full course of antibiotics. Avoid cold foods."
        },
        {
            id: 3,
            name: "Multivitamin",
            dosage: "1 tab",
            prescribedBy: "Dr. Rajesh Gupta",
            daysLeft: 10,
            schedule: ['morning'],
            status: "pending",
            type: "Capsule",
            prescriptionId: "RX-2026-88",
            caseId: "MR-2026-009",
            instruction: "After Food",
            advice: "Drink plenty of water. Complete the full course of antibiotics. Avoid cold foods."
        },
        // Dr. Emily Clark (RX-2025-45) - Allergic Dermatitis
        {
            id: 4,
            name: "Levocetirizine",
            dosage: "5mg",
            prescribedBy: "Dr. Emily Clark",
            daysLeft: 7,
            schedule: ['night'],
            status: "pending",
            type: "Tablet",
            prescriptionId: "RX-2025-45",
            caseId: "MR-2025-156",
            instruction: "After Food",
            advice: "Apply lotion gently. Avoid scratching the affected area. Wear loose cotton clothes."
        },
        {
            id: 5,
            name: "Calamine Lotion",
            dosage: "Apply liberally",
            prescribedBy: "Dr. Emily Clark",
            daysLeft: 7,
            schedule: ['morning', 'night'],
            status: "pending",
            type: "Lotion",
            prescriptionId: "RX-2025-45",
            caseId: "MR-2025-156",
            instruction: "Apply Externally",
            advice: "Apply lotion gently. Avoid scratching the affected area. Wear loose cotton clothes."
        },
        {
            id: 6,
            name: "Hydrocortisone Cream",
            dosage: "Thin layer",
            prescribedBy: "Dr. Emily Clark",
            daysLeft: 5,
            schedule: ['night'],
            status: "pending",
            type: "Cream",
            prescriptionId: "RX-2025-45",
            caseId: "MR-2025-156",
            instruction: "Apply on Affected Area",
            advice: "Apply lotion gently. Avoid scratching the affected area. Wear loose cotton clothes."
        },
        // Dr. Priya Sharma (RX-2026-05) - General Checkup (Completed)
        {
            id: 7,
            name: "Amoxicillin 500mg",
            dosage: "500mg",
            prescribedBy: "Dr. Priya Sharma",
            daysLeft: 0,
            schedule: ['morning', 'night'],
            status: "taken",
            type: "Antibiotic",
            prescriptionId: "RX-2026-05",
            caseId: "MR-2026-001",
            instruction: "After Food",
            advice: "Complete the full course. Do not skip doses."
        }
    ];

    const displayedMedications = filterPrescriptionId
        ? medications.filter(m => m.prescriptionId === filterPrescriptionId)
        : medications;

    // Group by Case ID
    const groupedMedications = displayedMedications.reduce((acc, med) => {
        const caseId = med.caseId || 'Other';
        if (!acc[caseId]) {
            acc[caseId] = [];
        }
        acc[caseId].push(med);
        return acc;
    }, {});

    const healthReminders = [
        {
            id: 1,
            title: "Drink Water",
            target: "8 glasses",
            progress: 5,
            icon: <Droplet size={20} className="text-blue-500" />,
            color: "blue"
        }
    ];



    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Medications</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Your daily medicine reminders</p>
                </div>
                <button
                    onClick={requestNotificationPermission}
                    title={notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
                    style={{
                        background: notificationPermission === 'granted' ? '#e8f5e9' : '#f5f5f5',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: notificationPermission === 'granted' ? '#2e7d32' : '#666',
                        transition: 'all 0.2s'
                    }}
                >
                    {notificationPermission === 'granted' ? <Bell size={24} /> : <BellOff size={24} />}
                </button>
            </header>

            {/* Filter Banner */}
            {
                filterPrescriptionId && (
                    <div style={{
                        backgroundColor: '#e0f2f1',
                        color: '#00695c',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Pill size={18} /> Showing medications from Case ID: {displayedMedications[0]?.caseId || filterPrescriptionId}
                        </span>
                        <button onClick={clearFilter} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00695c' }}>
                            <X size={20} />
                        </button>
                    </div>
                )
            }

            {/* Modern Tabs */}
            <div style={{
                display: 'inline-flex',
                backgroundColor: '#f1f5f9',
                borderRadius: '16px',
                padding: '0.4rem',
                marginBottom: '2.5rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
                {['active', 'completed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '12px',
                            backgroundColor: activeTab === tab ? 'white' : 'transparent',
                            color: activeTab === tab ? 'var(--color-primary)' : '#64748b',
                            fontWeight: activeTab === tab ? '700' : '500',
                            transition: 'all 0.3s ease',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                            fontSize: '0.95rem'
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {
                (activeTab === 'active' || activeTab === 'completed') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {Object.entries(groupedMedications).map(([caseId, meds]) => {
                            // Filter meds based on tab
                            const tabMeds = meds.filter(m => (activeTab === 'completed' ? m.status === 'taken' : m.status !== 'taken'));

                            if (tabMeds.length === 0) return null;

                            return (
                                <div key={caseId} style={{ animation: 'fadeInUp 0.6s ease' }}>
                                    {/* Case ID Header */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        marginBottom: '1.5rem',
                                    }}>
                                        <div style={{
                                            backgroundColor: 'var(--color-primary)',
                                            color: 'white',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            boxShadow: '0 4px 10px rgba(7, 118, 89, 0.2)'
                                        }}>
                                            CASE ID
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', fontWeight: '700' }}>{caseId}</h3>
                                    </div>

                                    {/* Doctor Advice for this Case */}
                                    {meds[0].advice && (
                                        <div style={{
                                            marginBottom: '2rem',
                                            padding: '1.5rem',
                                            background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
                                            border: '1px solid #fcd34d',
                                            borderRadius: '16px',
                                            color: '#92400e',
                                            display: 'flex',
                                            gap: '16px',
                                            alignItems: 'start',
                                            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.1)'
                                        }}>
                                            <div style={{
                                                padding: '10px',
                                                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                                                borderRadius: '12px',
                                                color: '#d97706'
                                            }}>
                                                <Info size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor's Advice</div>
                                                <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#78350f' }}>{meds[0].advice}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                        gap: '2rem'
                                    }}>
                                        {tabMeds.map(med => (
                                            <MedicationCard
                                                key={med.id}
                                                med={med}
                                                onRemind={() => sendReminder(med.name)}
                                                onViewPrescription={(rxId) => navigate('/patient/medical-files', { state: { prescriptionId: rxId } })}
                                                onReorder={() => navigate('/patient/pharmacy')}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}

                        {displayedMedications.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                <div style={{
                                    width: '80px', height: '80px', margin: '0 auto 1.5rem',
                                    backgroundColor: '#f1f5f9', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <CheckCircle size={40} style={{ opacity: 0.4, color: '#64748b' }} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '0.5rem' }}>No medications found</h3>
                                <p style={{ color: '#94a3b8' }}>{filterPrescriptionId ? 'Try clearing the filter to see all.' : 'Everything looks good/cleared!'}</p>
                                {filterPrescriptionId && (
                                    <button
                                        onClick={clearFilter}
                                        style={{
                                            marginTop: '1.5rem',
                                            color: 'var(--color-primary)',
                                            fontWeight: '600',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        View all medications
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};

// Component matching the reference design
const MedicationCard = ({ med, onRemind, onViewPrescription, onReorder }) => {

    const getDaysLeftColor = (days) => {
        if (days <= 3) return { bg: '#fee2e2', text: '#ef4444' }; // Red
        if (days <= 7) return { bg: '#ffedd5', text: '#f97316' }; // Orange
        return { bg: '#e0f2f1', text: '#00695c' }; // Cyan/Teal
    };

    const daysStyle = getDaysLeftColor(med.daysLeft);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '1.8rem',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.02)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.5rem',
            border: '1px solid rgba(255,255,255,0.5)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
        }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.08)'; }}
        >

            {/* Top Row: Badge & Info Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {med.status === 'taken' ? (
                    <span style={{
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        padding: '0.4rem 1rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <CheckCircle size={12} strokeWidth={3} /> Completed
                    </span>
                ) : (
                    <span style={{
                        backgroundColor: daysStyle.bg,
                        color: daysStyle.text,
                        padding: '0.4rem 1rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        {med.daysLeft} Days Left
                    </span>
                )}
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                        onClick={onRemind}
                        title="Set Reminder"
                        style={{
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '50%',
                            width: '32px', height: '32px',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#00695c'; e.currentTarget.style.borderColor = '#00695c'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <Bell size={16} />
                    </button>
                    <button style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '50%',
                        width: '32px', height: '32px',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#00695c'; e.currentTarget.style.borderColor = '#00695c'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <Info size={16} />
                    </button>
                </div>
            </div>

            {/* Medicine Info */}
            <div>
                <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    marginBottom: '0.4rem',
                    color: '#1e293b'
                }}>
                    {med.name} <span style={{ fontWeight: '500', color: '#94a3b8', fontSize: '1rem', marginLeft: '4px' }}>{med.dosage}</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
                        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '6px' }}><User size={14} /></div>
                        <span>Prescribed by {med.prescribedBy}</span>
                    </div>
                    {/* INSTRUCTION BADGE */}
                    {med.instruction && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#ea580c', // Orange-600
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            backgroundColor: '#ffedd5', // Orange-100
                            padding: '0.4rem 0.8rem',
                            borderRadius: '10px',
                            width: 'fit-content',
                            boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)'
                        }}>
                            <Utensils size={14} />
                            <span>{med.instruction}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Icons */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '16px',
                justifyContent: 'space-around'
            }}>
                {['morning', 'noon', 'evening', 'night'].map(period => {
                    const isActive = med.schedule.includes(period);

                    let icon, label, color, activeBg;
                    switch (period) {
                        case 'morning': icon = <Sun size={18} />; label = 'Morn'; color = '#f59e0b'; activeBg = '#fffbeb'; break;
                        case 'noon': icon = <Sun size={18} />; label = 'Noon'; color = '#fcd34d'; activeBg = '#fffbeb'; break;
                        case 'evening': icon = <Sunset size={18} />; label = 'Eve'; color = '#f97316'; activeBg = '#ffedd5'; break;
                        case 'night': icon = <Moon size={18} />; label = 'Night'; color = '#6366f1'; activeBg = '#e0e7ff'; break;
                        default: return null;
                    }

                    return (
                        <div key={period} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            opacity: isActive ? 1 : 0.4
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: isActive ? activeBg : '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isActive ? color : '#94a3b8',
                                boxShadow: isActive ? `0 2px 6px ${color}40` : 'none'
                            }}>
                                {icon}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            {med.status === 'taken' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '0.5rem' }}>
                    <button
                        onClick={() => onViewPrescription(med.prescriptionId)}
                        style={{
                            padding: '0.9rem',
                            borderRadius: '14px',
                            background: 'white',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0fdfa'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                    >
                        <Eye size={16} /> View Rx
                    </button>
                    <button
                        onClick={onReorder}
                        style={{
                            padding: '0.9rem',
                            borderRadius: '14px',
                            background: 'var(--color-primary)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: '0 4px 12px rgba(7, 118, 89, 0.25)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(7, 118, 89, 0.35)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 118, 89, 0.25)'; }}
                    >
                        <ShoppingCart size={16} /> Re-order
                    </button>
                </div>
            ) : (
                <button style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '50px', // Fully rounded
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // Teal gradient
                    color: 'white',
                    border: 'none',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem',
                    boxShadow: '0 6px 20px -5px rgba(20, 184, 166, 0.5)'
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(20, 184, 166, 0.6)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px -5px rgba(20, 184, 166, 0.5)'; }}
                >
                    <CheckCircle size={22} strokeWidth={2.5} />
                    Mark as Taken
                </button>
            )}
        </div>
    );
}

export default Medications;

