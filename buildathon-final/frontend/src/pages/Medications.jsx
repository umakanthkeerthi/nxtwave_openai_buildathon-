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
    Pill,
    RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';


const Medications = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('active');
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, selectedProfile } = useAuth();
    const [filterPrescriptionId, setFilterPrescriptionId] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // State for real data
    const [dynamicMedications, setDynamicMedications] = useState([]);
    const [medicationLogs, setMedicationLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Medications & Logs
    useEffect(() => {
        const fetchMedicationData = async () => {
            setLoading(true);
            try {
                const targetId = selectedProfile?.id || currentUser?.uid;
                if (!targetId) return;

                // 1. Fetch ALL Records (Prescriptions + Logs are now included in one call)
                const recordsUrl = new URL(`${import.meta.env.VITE_API_URL}/get_records`);
                recordsUrl.searchParams.append("patient_id", targetId);
                recordsUrl.searchParams.append("profile_id", targetId);

                const recResponse = await fetch(recordsUrl);
                const recordsData = await recResponse.json();

                // recordsData is { records: [...] }
                const allRecords = recordsData.records || [];

                const fetchedLogs = [];
                const fetchedPrescriptions = [];

                // 2. Separate Records
                allRecords.forEach(rec => {
                    // Logic to identify types
                    // Prescriptions usually have fullData.medicines OR type='PRESCRIPTION'
                    if (rec.type === 'PRESCRIPTION' || rec.fullData?.medicines || rec.data?.medicines) {
                        fetchedPrescriptions.push(rec);
                    }
                    // Medication Logs
                    else if (rec.type === 'MEDICATION_LOG' || (rec.status === 'TAKEN' && rec.medicine_name)) {
                        fetchedLogs.push(rec);
                    }
                });

                setMedicationLogs(fetchedLogs);

                // 3. Extract Medicines from Prescriptions
                let allMeds = [];
                fetchedPrescriptions.forEach(prescription => {
                    // Normalize data structure (handle V1 vs Legacy)
                    const data = prescription.fullData || prescription.data || prescription;

                    if (data.medicines) {
                        data.medicines.forEach((med, idx) => {
                            // Parse duration
                            let totalDuration = 5;
                            if (typeof med.duration === 'string') {
                                const match = med.duration.match(/(\d+)/);
                                if (match) totalDuration = parseInt(match[0]);
                            }

                            // [NEW] Dynamic Days Left Calculation
                            const startDate = new Date(prescription.created_at || new Date());
                            const today = new Date();
                            const timeDiff = today.getTime() - startDate.getTime();
                            const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));
                            const daysLeft = Math.max(0, totalDuration - daysPassed);

                            // Parse timing
                            const schedule = [];
                            if (med.timing) {
                                if (med.timing.morning) schedule.push('morning');
                                if (med.timing.afternoon || med.timing.noon) schedule.push('noon');
                                if (med.timing.evening) schedule.push('evening');
                                if (med.timing.night) schedule.push('night');
                            }

                            allMeds.push({
                                id: `med-${prescription.id}-${idx}`,
                                name: med.name,
                                dosage: med.dosage,
                                prescribedBy: data.doctor || prescription.doctor || "Unknown Doctor",
                                daysLeft: daysLeft,
                                totalDuration: totalDuration,
                                startDate: startDate,
                                schedule: schedule.length > 0 ? schedule : ['morning'],
                                status: 'pending', // Will be updated by log check
                                type: med.type,
                                prescriptionId: prescription.id,
                                caseId: prescription.case_id || prescription.caseId || 'Imported',
                                instruction: med.instruction,
                                advice: data.advice || data.remarks || "Follow prescription instructions."
                            });
                        });
                    }
                });

                setDynamicMedications(allMeds);

            } catch (error) {
                console.error("Error fetching medications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedicationData();
    }, [currentUser, selectedProfile]);


    // Handle URL/State Filters
    useEffect(() => {
        if (location.state?.prescriptionId) {
            setFilterPrescriptionId(location.state.prescriptionId);
            setActiveTab(location.state.tab || 'active');
        } else {
            // Check URL params if state is empty (for deep linking)
            const params = new URLSearchParams(location.search);
            const pId = params.get('prescriptionId');
            if (pId) setFilterPrescriptionId(pId);
        }
    }, [location.state, location.search]);


    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications');
            return;
        }
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
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
        navigate('.', { replace: true, state: {} });
    };

    // --- LOGIC: Merge Logs with Medications ---
    const allMedications = dynamicMedications.map(med => {
        const matchingLog = medicationLogs.find(log => {
            // Normalize names
            const nameMatch = (log.medicine_name || "").trim().toLowerCase() === (med.name || "").trim().toLowerCase();
            // Optional: stricter match on prescription ID if available
            const idMatch = log.prescription_id
                ? String(log.prescription_id) === String(med.prescriptionId)
                : true;

            return nameMatch && idMatch && log.status === 'TAKEN'; // For now, simple Taken check
        });

        // If today is logged as taken, mark as taken. 
        // NOTE: Real prod logic would check DATE of log vs Today. 
        // For Hackathon demo: if *any* log exists, we treat as "taken today" or rely on detailed timestamp check.
        // Let's do a simple same-day check:
        const isTakenToday = matchingLog && new Date(matchingLog.timestamp).toDateString() === new Date().toDateString();

        // [NEW] Status Logic
        let status = 'active_pending';
        let currentDay = med.totalDuration - med.daysLeft + 1;
        if (currentDay > med.totalDuration) currentDay = med.totalDuration; // Clamp to max

        if (med.daysLeft <= 0) {
            status = 'completed';
        } else if (isTakenToday) {
            status = 'active_taken';
        }

        return {
            ...med,
            status: status,
            currentDay: currentDay,
            logId: matchingLog ? (matchingLog.id || matchingLog.record_id) : null // [NEW] Capture ID for Undo
        };
    });


    // Filter Logic
    const displayedMedications = filterPrescriptionId
        ? allMedications.filter(m => m.prescriptionId === filterPrescriptionId)
        : allMedications;

    // Group by Case ID
    const groupedMedications = displayedMedications.reduce((acc, med) => {
        const caseId = med.caseId || 'Other';
        if (!acc[caseId]) acc[caseId] = [];
        acc[caseId].push(med);
        return acc;
    }, {});


    // --- ACTION: Mark as Taken ---
    const handleMarkAsTaken = async (med) => {
        try {
            const targetId = selectedProfile?.id || currentUser?.uid;

            const payload = {
                patient_id: targetId,
                medicine_name: med.name,
                dosage: med.dosage,
                status: "TAKEN",
                type: "MEDICATION_LOG",
                timestamp: new Date().toISOString(),
                prescription_id: med.prescriptionId,
                case_id: med.caseId
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/log_medication`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.status === "success") {
                // Optimistic Update
                setMedicationLogs([...medicationLogs, { ...payload, id: result.id }]); // [FIX] Save ID for Undo
            } else {
                alert("Failed to log medication.");
            }

        } catch (error) {
            console.error("Error logging medication:", error);
            alert("Network error.");
        }
    };
    // --- ACTION: Undo Taken ---
    const handleUndoTaken = async (med) => {
        if (!med.logId) return;

        try {
            // Optimistic Remove
            const previousLogs = [...medicationLogs];
            setMedicationLogs(prev => prev.filter(log => log.id !== med.logId && log.record_id !== med.logId));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/delete_medication_log?log_id=${med.logId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.status !== "success") {
                // Revert on failure
                alert("Failed to undo.");
                setMedicationLogs(previousLogs);
            }
        } catch (error) {
            console.error("Error undoing medication:", error);
            alert("Network error.");
        }
    };


    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('my_appointments.loading')}</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{t('medications.title')}</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>{t('medications.subtitle')}</p>
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
                            <Pill size={18} /> {t('medications.filter_banner')}: {displayedMedications[0]?.caseId || filterPrescriptionId}
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
                        {t(`medications.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {
                (activeTab === 'active' || activeTab === 'completed') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {Object.entries(groupedMedications).length > 0 ? Object.entries(groupedMedications).map(([caseId, meds]) => {
                            // Filter meds based on tab
                            // [UX IMPROVEMENT] Active tab shows Pending + Taken (for today). Completed tab shows finished courses.
                            let tabMeds = meds.filter(m => {
                                if (activeTab === 'completed') return m.status === 'completed';
                                return m.status === 'active_pending' || m.status === 'active_taken';
                            });

                            // Sort: Pending first, then Taken
                            tabMeds.sort((a, b) => {
                                if (a.status === b.status) return 0;
                                return a.status === 'active_pending' ? -1 : 1;
                            });

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
                                            {t('medications.case_id')}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', fontWeight: '700' }}>{caseId}</h3>
                                    </div>

                                    {/* Doctor Advice (from first med of case) */}
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
                                                <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('medications.doctor_advice')}</div>
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
                                                onMarkTaken={() => handleMarkAsTaken(med)}
                                                onUndo={() => handleUndoTaken(med)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        }) : (
                            // Empty state if no groups found at all after filtering
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                <div style={{
                                    width: '80px', height: '80px', margin: '0 auto 1.5rem',
                                    backgroundColor: '#f1f5f9', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <CheckCircle size={40} style={{ opacity: 0.4, color: '#64748b' }} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '0.5rem' }}>{t('medications.no_medications')}</h3>
                                <p style={{ color: '#94a3b8' }}>{filterPrescriptionId ? t('medications.clear_filter_hint') : t('medications.all_cleared_hint')}</p>
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
                                        {t('medications.view_all')}
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
const MedicationCard = ({ med, onRemind, onViewPrescription, onReorder, onMarkTaken, onUndo }) => {
    const { t } = useTranslation();



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
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(med.status === 'active_taken' || med.status === 'completed') && (
                        <span style={{
                            backgroundColor: med.status === 'completed' ? '#e2e8f0' : '#ecfdf5',
                            color: med.status === 'completed' ? '#64748b' : '#059669',
                            padding: '0.4rem 1rem',
                            borderRadius: '50px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            <CheckCircle size={12} strokeWidth={3} /> {med.status === 'completed' ? t('medications.card.course_completed') : t('medications.card.completed_today')}
                        </span>
                    )}

                </div>
                {/* [NEW] Next Dose Text */}
                {med.status === 'active_taken' && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '4px', textAlign: 'right' }}>
                        {t('medications.card.next_dose')}
                    </div>
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

                {/* Course Progress Bar */}
                {med.status !== 'completed' && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                            <span>{t('medications.card.day_progress', { current: med.currentDay, total: med.totalDuration })}</span>
                            <span>{Math.round((med.currentDay / med.totalDuration) * 100)}%</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '10px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(med.currentDay / med.totalDuration) * 100}%`,
                                height: '100%',
                                backgroundColor: med.status === 'active_taken' ? '#10b981' : '#3b82f6', // Green if taken, Blue if pending
                                borderRadius: '10px',
                                transition: 'width 0.5s ease-in-out'
                            }} />
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
                        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '6px' }}><User size={14} /></div>
                        <span>{t('medications.card.prescribed_by')} {med.prescribedBy}</span>
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
                        case 'morning': icon = <Sun size={18} />; label = t('medications.card.schedule.morning'); color = '#f59e0b'; activeBg = '#fffbeb'; break;
                        case 'noon': icon = <Sun size={18} />; label = t('medications.card.schedule.noon'); color = '#fcd34d'; activeBg = '#fffbeb'; break;
                        case 'evening': icon = <Sunset size={18} />; label = t('medications.card.schedule.evening'); color = '#f97316'; activeBg = '#ffedd5'; break;
                        case 'night': icon = <Moon size={18} />; label = t('medications.card.schedule.night'); color = '#6366f1'; activeBg = '#e0e7ff'; break;
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

            {(med.status === 'active_taken' || med.status === 'completed') ? (
                <div style={{ display: 'grid', gridTemplateColumns: (med.status === 'completed') ? '1fr 1fr' : '1fr', gap: '12px', marginTop: '0.5rem' }}>

                    {/* [MODIFIED] View Rx - Only for Completed */}
                    {med.status === 'completed' && (
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
                            <Eye size={16} /> {t('medications.card.view_rx')}
                        </button>
                    )}

                    {/* [MODIFIED] Reorder - Only for Completed */}
                    {med.status === 'completed' && (
                        <button
                            onClick={onReorder}
                            style={{
                                padding: '0.9rem',
                                borderRadius: '14px',
                                background: 'white',
                                border: '1px solid #0891b2', // Cyan-600
                                color: '#0891b2',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfeff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                        >
                            <ShoppingCart size={16} /> {t('medications.card.reorder')}
                        </button>
                    )}

                    {/* [Preserved] Undo Button - Only for Active Taken */}
                    {(med.status === 'active_taken' && !med.completed) && (
                        <button
                            onClick={onUndo}
                            style={{
                                padding: '0.9rem',
                                borderRadius: '14px',
                                background: 'white',
                                border: '1px solid #94a3b8',
                                color: '#64748b',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s',
                                gridColumn: '1 / -1' // Full width
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                        >
                            <RotateCcw size={16} /> {t('medications.card.undo')}
                        </button>
                    )}
                </div>
            ) : (
                <button
                    onClick={onMarkTaken}
                    style={{
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
                    {t('medications.card.mark_taken')}
                </button>
            )}
        </div>
    );
};

export default Medications;

