import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Activity, AlertTriangle, FileText,
    Pill, Clock, CheckCircle, Plus, File, Star, Stethoscope, Video, PhoneOff, X, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // [NEW] Import Auth
import VideoPopup from './VideoPopup';

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth(); // [NEW] Get Doctor Details


    // [FIX] Robust Patient Data Derivation
    const locationStateData = location.state?.patientData || {};
    const urlParams = new URLSearchParams(location.search);
    const derivedCaseId = locationStateData.caseId || urlParams.get('caseId');
    const patientData = { ...locationStateData, caseId: derivedCaseId };
    console.log("PATIENT DETAIL DEBUG:", { locationStateData, urlCaseId: urlParams.get('caseId'), derivedCaseId, patientData }); // [DEBUG]

    // [NEW] Consultation State
    const initialStatus = 'PENDING'; // [FIX] Start safe, then sync
    const [consultationStatus, setConsultationStatus] = useState(initialStatus);
    const [isVideoOpen, setIsVideoOpen] = useState(false); // [FIX] No auto-open
    const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'Medical Files');
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isPrescriptionSubmitted, setIsPrescriptionSubmitted] = useState(false); // [NEW] Track prescription submission

    // Medical History Agent State
    const [historyData, setHistoryData] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);


    // Toast notification state
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // [NEW] Sync Status from Backend
    useEffect(() => {
        const syncStatus = async () => {
            if (patientData?.caseId) {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL;
                    const res = await fetch(`${apiUrl}/get_case?case_id=${patientData.caseId}`);
                    if (res.ok) {
                        const caseDetails = await res.json();
                        console.log("Synced Case Status:", caseDetails.status);
                        if (caseDetails.status) {
                            setConsultationStatus(caseDetails.status);
                        }
                    }
                } catch (e) {
                    console.error("Status Sync Error:", e);
                }
            }
        };
        syncStatus();
    }, [patientData?.caseId]);

    // [NEW] Fetch Medical History when Tab Active
    useEffect(() => {
        if (activeTab === 'History' && (id || patientData.id)) {
            const fetchHistory = async () => {
                setLoadingHistory(true);
                try {
                    const pid = id || patientData.id; // prefer URL param id
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/get_patient_history?patient_id=${pid}`);
                    if (res.ok) {
                        const data = await res.json();
                        setHistoryData(data);
                    }
                } catch (e) {
                    console.error("History Fetch Error:", e);
                } finally {
                    setLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [activeTab, id, patientData.id]);


    // Fetch Records
    React.useEffect(() => {
        const fetchRecords = async () => {
            try {
                // [FIX] Use derived caseId (from State OR URL)
                const caseId = patientData.caseId;
                let url = `${import.meta.env.VITE_API_URL}/get_records?patient_id=${id || ''}`;
                if (caseId) {
                    url += `&case_id=${caseId}`;
                }

                console.log("Fetching records from:", url);
                const response = await fetch(url);
                const data = await response.json();
                if (data.records) {
                    setMedicalRecords(data.records);
                    console.log("Loaded records:", data.records.length);
                }
            } catch (error) {
                console.error("Error fetching records:", error);
            } finally {
                setLoadingRecords(false);
            }
        };
        fetchRecords();
    }, [id, location.state, patientData.caseId]);

    const handleSubmitConsultation = async (consultationData, recordType = "PRESCRIPTION") => {
        setSubmitting(true);
        try {
            const payload = {
                patient_id: id,
                type: recordType,
                data: {
                    ...consultationData,
                    doctor: currentUser?.doctorProfile?.name || currentUser?.displayName || "Unknown Doctor", // [FIX] Send Doctor Name
                    title: recordType === "PRESCRIPTION" ? "Prescription" : "Consultation Record", // [FIX] Send Title
                    doctorId: currentUser?.doctor_id // [NEW] Save Doctor ID for future reference
                },
                case_id: patientData?.caseId // [FIX] Link to Case
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/upload_record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast('Consultation saved successfully!', 'success');
                // navigate('/doctor/patients'); // [FIX] Stay on page
            } else {
                // [FIX] Detailed Error Handling
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || "Failed to save consultation.";
                console.error("Upload failed:", response.status, errorData);

                if (response.status === 500) {
                    showToast(`Server Error: ${errorMessage}`, 'error');
                } else {
                    showToast(`Error: ${errorMessage}`, 'error');
                }
            }
        } catch (error) {
            console.error("Submit network error:", error);
            showToast('Network error. Please check your connection and try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Mock Patient Database
    const patientDatabase = {
        'P-922': {
            name: "Unknown Patient",
            id: "P-922",
            age: 45,
            gender: "Male",
            bloodGroup: "O+",
            allergies: [],
            vitals: {
                bp: "140/90",
                heartRate: "110 bpm",
                temp: "98.2°F",
                weight: "78 kg"
            },
            emergency: true
        },
        'P-104': {
            name: "Priya Sharma",
            id: "P-104",
            age: 28,
            gender: "Female",
            bloodGroup: "A+",
            allergies: ["Peanuts", "Shellfish"],
            vitals: {
                bp: "110/70",
                heartRate: "102 bpm",
                temp: "99.1°F",
                weight: "58 kg"
            },
            emergency: true
        },
        'P-101': {
            name: "Rahul Verma",
            id: "P-101",
            age: 62,
            gender: "Male",
            bloodGroup: "B+",
            allergies: ["Penicillin", "Peanuts"],
            vitals: {
                bp: "130/85",
                heartRate: "78 bpm",
                temp: "98.6°F",
                weight: "72 kg"
            },
            emergency: false
        }
    };

    // Use passed patient data or fallback to a default structure
    // const patientData = location.state?.patientData || {}; // [REMOVED] Defined at top

    // Default / Fallback Data
    const patient = {
        name: patientData.name || "Unknown Patient",
        id: id || "Unknown",
        age: patientData.age || "?",
        gender: patientData.gender || "?",
        bloodGroup: "O+", // Placeholder
        allergies: [], // Placeholder
        vitals: {
            bp: "120/80", // Placeholder
            heartRate: "72 bpm", // Placeholder
            temp: "98.6°F", // Placeholder
            weight: "70 kg" // Placeholder
        },
        emergency: location.state?.type === 'emergency'
    };

    // [NEW] Handle Start/End Consultation
    // [NEW] Handle Start Consultation
    const handleStartConsultation = async () => {
        console.log("handleStartConsultation called");
        console.log("Current Status:", consultationStatus);
        console.log("Patient Data:", patientData);

        if (consultationStatus !== 'APPOINTMENT_IN_PROGRESS' && consultationStatus !== 'CONSULTATION_ENDED') {
            // --- STARTING CONSULTATION ---
            // --- STARTING CONSULTATION ---
            // [FIX] Check patientData for mode, fallback to location.state
            const mode = patientData?.mode || location.state?.mode;
            const type = patientData?.type || location.state?.type;

            // Logic: Auto-open if mode is 'Video' OR (Standard + Online)
            const isVideoMode = mode === 'Video' || (type === 'standard' && mode === 'online');

            console.log("Starting Consult - Mode:", mode, "Type:", type, "IsVideoMode:", isVideoMode);

            if (isVideoMode) setIsVideoOpen(true);

            // 1. Update Case Status
            if (patientData?.caseId) {
                console.log("Updating Case Status for:", patientData.caseId);
                const apiUrl = import.meta.env.VITE_API_URL;
                try {
                    await fetch(`${apiUrl}/update_case_status?case_id=${patientData.caseId}&status=APPOINTMENT_IN_PROGRESS`, {
                        method: 'POST'
                    });
                    console.log("Case Status Updated");
                } catch (e) {
                    console.error("Error updating case status:", e);
                }
            } else {
                console.warn("No Case ID found for status update");
            }

            // 2. Update Appointment Status
            if (patientData?.appointmentId) {
                console.log("Updating Appointment Status for:", patientData.appointmentId);
                const apiUrl = import.meta.env.VITE_API_URL;
                try {
                    await fetch(`${apiUrl}/update_appointment_status?appointment_id=${patientData.appointmentId}&status=APPOINTMENT_IN_PROGRESS`, {
                        method: 'POST'
                    });
                    console.log("Appointment Status Updated");
                } catch (e) {
                    console.error("Error updating appointment status:", e);
                }
            } else {
                console.warn("No Appointment ID found for status update");
            }

            setConsultationStatus('APPOINTMENT_IN_PROGRESS');
        } else {
            console.log("Consultation already in progress or ended. Skipping start logic.");
        }
    };

    // [NEW] Handle End Consultation (Explicit Action)
    const handleEndConsultation = async () => {
        // --- ENDING CONSULTATION ---
        setIsVideoOpen(false);
        // 1. Update Case Status
        const apiUrl = import.meta.env.VITE_API_URL;
        if (patientData?.caseId) {
            await fetch(`${apiUrl}/update_case_status?case_id=${patientData.caseId}&status=CONSULTATION_ENDED`, {
                method: 'POST'
            });
        }
        // 2. Update Appointment Status
        if (patientData?.appointmentId) {
            await fetch(`${apiUrl}/update_appointment_status?appointment_id=${patientData.appointmentId}&status=CONSULTATION_ENDED`, {
                method: 'POST'
            });
        }
        setConsultationStatus('CONSULTATION_ENDED');

        // [NEW] Auto-Navigate back to Patient List
        setTimeout(() => {
            navigate('/doctor/patients');
        }, 2000);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header & Back */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                    marginBottom: '1rem', padding: 0, fontSize: '0.95rem'
                }}
            >
                <ArrowLeft size={18} /> Back to Patients
            </button>

            {/* Patient Identity Card */}
            <div style={{
                background: 'white', borderRadius: '12px', padding: '1.5rem',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 'bold', color: '#475569'
                    }}>
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>{patient.name}</h1>
                        <div style={{ color: '#64748b', marginTop: '4px' }}>
                            ID: {patient.id} • {patient.age} yrs • {patient.gender} • {patient.bloodGroup}
                        </div>
                        {patient.allergies.length > 0 && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                marginTop: '8px', background: '#fef2f2', color: '#b91c1c',
                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600'
                            }}>
                                <AlertTriangle size={14} />
                                Allergies: {patient.allergies.join(", ")}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    {/* Vitals Summary */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <VitalItem label="Blood Pressure" value={patient.vitals.bp} />
                        <VitalItem label="Heart Rate" value={patient.vitals.heartRate} />
                    </div>

                    <button
                        type="button"
                        onClick={consultationStatus === 'APPOINTMENT_IN_PROGRESS' ? handleEndConsultation : handleStartConsultation}
                        disabled={consultationStatus === 'CONSULTATION_ENDED' || (consultationStatus === 'APPOINTMENT_IN_PROGRESS' && !isPrescriptionSubmitted)}
                        style={{
                            padding: '10px 20px',
                            background: consultationStatus === 'APPOINTMENT_IN_PROGRESS' ?
                                (!isPrescriptionSubmitted ? '#9ca3af' : '#ef4444') :
                                (consultationStatus === 'CONSULTATION_ENDED' ? '#94a3b8' : '#0f766e'),
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontWeight: '600',
                            cursor: (consultationStatus === 'CONSULTATION_ENDED' || (consultationStatus === 'APPOINTMENT_IN_PROGRESS' && !isPrescriptionSubmitted)) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            marginTop: '1rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {consultationStatus === 'APPOINTMENT_IN_PROGRESS' ? (
                            <>
                                <PhoneOff size={18} /> End Consultation
                            </>
                        ) : consultationStatus === 'CONSULTATION_ENDED' ? (
                            <>
                                <CheckCircle size={18} /> Consultation Ended
                            </>
                        ) : (
                            <>
                                <Video size={18} /> Start Consultation
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                {['Overview', 'Medical Files', 'Consultation', 'History'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 0',
                            border: 'none', background: 'none',
                            borderBottom: activeTab === tab ? '2px solid #0f766e' : '2px solid transparent',
                            color: activeTab === tab ? '#0f766e' : '#64748b',
                            fontWeight: activeTab === tab ? '600' : '500',
                            cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'Consultation' && <span style={{ marginRight: '6px', fontSize: '1.1rem' }}>🩺</span>}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'Medical Files' ? (
                <MedicalFilesView records={medicalRecords} loading={loadingRecords} />
            ) : activeTab === 'Consultation' ? (
                <ConsultationMode
                    records={medicalRecords}
                    onSubmit={handleSubmitConsultation}
                    submitting={submitting}
                    patientData={patientData}
                    isPrescriptionSubmitted={isPrescriptionSubmitted}
                    setIsPrescriptionSubmitted={setIsPrescriptionSubmitted}
                    consultationStatus={consultationStatus}
                />
            ) : activeTab === 'History' ? (
                <PatientHistoryView history={historyData} loading={loadingHistory} />
            ) : (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                    Content for {activeTab} will appear here.
                </div>
            )}


            {/* Action Bar REMOVED per user request */}
            {/* Video Popup */}
            {isVideoOpen && (
                <VideoPopup
                    patientName={patientData?.patient_name || "Patient"}
                    onClose={() => setIsVideoOpen(false)}
                    caseId={patientData?.caseId}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div
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
                        maxWidth: '500px',
                        animation: 'slideIn 0.3s ease-out'
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
                </div>
            )}
        </div>
    );
};

const MedicalFilesView = ({ records, loading }) => {
    const [selectedSummary, setSelectedSummary] = useState(null);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading records...</div>;

    // Filter Records
    const aiSummaries = records.filter(r =>
        r.type === 'AI_SUMMARY_DOCTOR' ||
        r.type === 'DOCTOR_SUMMARY'
        // r.type === 'summary' || // Legacy
        // r.type === 'AI_SUMMARY' // Patient-facing summary (Excluded per user request)
    );
    const prescriptions = records.filter(r => r.type === 'PRESCRIPTION');
    const labReports = records.filter(r => r.type === 'LAB_REPORT');

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <FileSection title="Pre-Doctor Consultation Summary File" count={aiSummaries.length}>
                {aiSummaries.length === 0 ? <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No AI summaries found.</div> :
                    aiSummaries.map(doc => {
                        // Compatibility: Handle both legacy nested 'data' and new flat structure
                        const isDoctorSummary = doc.type === 'DOCTOR_SUMMARY' || doc.type === 'AI_SUMMARY_DOCTOR';
                        const summaryData = doc.data?.pre_doctor_consultation_summary || (isDoctorSummary ? doc : (doc.data || {}));

                        const reason = summaryData.trigger_reason || "General Checkup";
                        const severity = doc.triage_level || doc.data?.triage_decision || summaryData.assessment?.severity || "Unknown";

                        return (
                            <FileCard
                                key={doc.summary_id || doc.id || doc.record_id}
                                name={`AI Insight: ${reason}`}
                                date={new Date(doc.created_at || doc.generated_at).toLocaleDateString()}
                                type={isDoctorSummary ? "Pre-Consult Summary" : "AI Triage"}
                                isAI
                                summary={`Severity: ${severity}`}
                                onClick={() => isDoctorSummary ? setSelectedSummary(doc) : null}
                                actionLabel={isDoctorSummary ? "View Full Details" : null}
                            />
                        );
                    })
                }
            </FileSection>

            <FileSection title="Prescriptions" count={prescriptions.length}>
                {prescriptions.map(doc => (
                    <FileCard
                        key={doc.record_id}
                        name={`Prescription: ${new Date(doc.created_at).toLocaleDateString()}`}
                        date={new Date(doc.created_at).toLocaleDateString()}
                        type="Rx"
                        summary={`${doc.data?.medicines?.length || 0} medicines prescribed.`}
                    />
                ))}
            </FileSection>

            <FileSection title="Lab Reports" count={labReports.length}>
                {labReports.length === 0 ? <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No lab reports found.</div> :
                    labReports.map(doc => (
                        <FileCard
                            key={doc.record_id}
                            name={doc.data?.test_name || "Lab Report"}
                            date={new Date(doc.created_at).toLocaleDateString()}
                            type="Lab Report"
                        />
                    ))
                }
            </FileSection>

            {/* Summary Modal */}
            <SummaryModal data={selectedSummary} onClose={() => setSelectedSummary(null)} />
        </div>
    );
};

/* --- Helpers --- */

const VitalItem = ({ label, value }) => (
    <div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>{value}</div>
    </div>
);



const FileSection = ({ title, count, children }) => (
    <div>
        <h3 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {title} <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>{count}</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {children}
        </div>
    </div>
);

const FileCard = ({ name, date, type, isAbnormal, isAI, summary, onClick, actionLabel }) => (
    <div style={{
        background: isAI ? '#f5f3ff' : 'white',
        border: isAbnormal ? '1px solid #fecaca' : (isAI ? '1px solid #ddd6fe' : '1px solid #e2e8f0'),
        borderRadius: '10px', padding: '1rem',
        position: 'relative', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
            <div style={{
                padding: '6px', borderRadius: '6px',
                background: isAI ? '#8b5cf6' : '#e2e8f0', color: isAI ? 'white' : '#64748b'
            }}>
                {isAI ? <Star size={18} /> : <File size={18} />}
            </div>
            {isAbnormal && (
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#b91c1c', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>
                    ABNORMAL
                </span>
            )}
        </div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1e293b' }}>{name}</h4>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{date} • {type}</div>

        {summary && (
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: isAbnormal ? '#b91c1c' : '#475569', fontStyle: 'italic' }}>
                "{summary}"
            </div>
        )}

        {actionLabel && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {actionLabel} <ExternalLink size={14} />
                </span>
            </div>
        )}
    </div>
);

const ConsultationMode = ({ records, onSubmit, submitting, patientData, isPrescriptionSubmitted, setIsPrescriptionSubmitted, consultationStatus }) => {
    console.log("DEBUG: ConsultationMode Props:", { patientData, records, consultationStatus });
    const [remarks, setRemarks] = useState("");
    const [advice, setAdvice] = useState("");
    const [medicines, setMedicines] = useState([]);
    const [currentMed, setCurrentMed] = useState({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instruction: "",
        type: "Tablet",
        timing: { morning: false, noon: false, evening: false, night: false }
    });

    const isReadOnly = consultationStatus === 'CONSULTATION_ENDED' || consultationStatus === 'COMPLETED';

    // [NEW] Persistence Key
    const storageKey = patientData?.caseId ? `consultation_draft_${patientData.caseId}` : null;

    // [NEW] Load Data (Draft OR Submitted)
    useEffect(() => {
        console.log("DEBUG: ConsultationMode Effect Triggered", { isReadOnly, recordsLen: records?.length, storageKey });

        // Priority 1: Submitted Data (if Read Only)
        if (isReadOnly) {
            if (!records || records.length === 0) {
                console.log("DEBUG: ReadOnly but no records yet.");
                return;
            }

            console.log("DEBUG: Processing Submitted Data...");
            const rxRecord = records.find(r => r.type === 'PRESCRIPTION_MEDICINES' || r.type === 'PRESCRIPTION');
            const notesRecord = records.find(r => r.type === 'DOCTOR_REMARKS');

            console.log("DEBUG: Found Records:", { rxRecord, notesRecord });

            if (rxRecord?.data?.medicines) {
                console.log("DEBUG: Setting Medicines:", rxRecord.data.medicines);
                setMedicines(rxRecord.data.medicines);
            }
            if (notesRecord?.data) {
                console.log("DEBUG: Setting Notes:", notesRecord.data);
                setRemarks(notesRecord.data.remarks || "");
                setAdvice(notesRecord.data.advice || "");
            }
            return; // Don't load draft if we have submitted data
        }

        // Priority 2: Saved Draft
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    console.log("DEBUG: Loading Draft:", data);
                    if (data.remarks) setRemarks(data.remarks);
                    if (data.advice) setAdvice(data.advice);
                    if (data.medicines) setMedicines(data.medicines);
                } catch (e) {
                    console.error("Failed to parse saved draft", e);
                }
            }
        }
    }, [storageKey, isReadOnly, records]);

    // [NEW] Save Draft on Change (Only if NOT Read Only)
    useEffect(() => {
        if (storageKey && !isReadOnly) {
            const data = { remarks, advice, medicines };
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    }, [remarks, advice, medicines, storageKey, isReadOnly]);

    // Pre-fill remarks from AI Summary if available (Only if empty and editable)
    React.useEffect(() => {
        if (isReadOnly) return;
        const latestSummary = records.find(r =>
            r.type === 'DOCTOR_SUMMARY' ||
            r.type === 'AI_SUMMARY_DOCTOR' ||
            r.type === 'summary'
        );

        if (latestSummary) {
            const isDoctorSummary = latestSummary.type === 'DOCTOR_SUMMARY' || latestSummary.type === 'AI_SUMMARY_DOCTOR';
            const summaryData = latestSummary.data?.pre_doctor_consultation_summary || (latestSummary.type === 'DOCTOR_SUMMARY' ? latestSummary : (latestSummary.data || {}));

            const reason = summaryData.trigger_reason || "";
            const assessment = summaryData.assessment?.likely_diagnosis || "";

            // Only set if empty AND no saved draft was loaded (simple check: if remarks is still empty)
            // But wait, the Load Draft effect runs once. The Pre-fill runs when records change.
            // If we restore draft, remarks might be non-empty. 
            // The condition `!remarks` handles this safe-guard.
            if (!remarks) {
                // setRemarks(`AI Trigger: ${reason}\nAssessment: ${assessment}\n\n`); // DISABLED: Doctor fills manually
            }
        }
    }, [records]);

    const addMedicine = () => {
        if (currentMed.name && currentMed.dosage) {
            setMedicines([...medicines, { ...currentMed, id: Date.now() }]);
            setCurrentMed({
                name: "",
                dosage: "",
                frequency: "",
                duration: "",
                instruction: "",
                type: "Tablet",
                timing: { morning: false, noon: false, evening: false, night: false }
            });
        } else {
            showToast('Please enter medicine name and dosage.', 'error');
        }
    };

    const removeMedicine = (id) => {
        setMedicines(medicines.filter(med => med.id !== id));
    };



    const handleFinalSubmit = async () => {
        const data = {
            remarks,
            advice,
            medicines,
            timestamp: new Date().toISOString()
        };
        // [NEW] Submit Prescription & Update Status
        await onSubmit(data, "PRESCRIPTION");

        // 1. Update Case Status to Intermediate Step
        const apiUrl = import.meta.env.VITE_API_URL;
        if (patientData?.caseId) {
            await fetch(`${apiUrl}/update_case_status?case_id=${patientData.caseId}&status=DOCTOR_NOTES_AND_PRESCRIPTION_READY`, {
                method: 'POST'
            });
        }

        // [NEW] Clear Persistence
        if (storageKey) localStorage.removeItem(storageKey);

        setIsPrescriptionSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Prescription submitted. You can now end the consultation.', 'success');
    };

    const handleSaveDraft = () => {
        const data = {
            remarks,
            advice,
            medicines,
            timestamp: new Date().toISOString()
        };
        onSubmit(data, "DRAFT_PRESCRIPTION");
        // [NEW] Clear Persistence (Optional: or keep it? Draft usually implies saved to DB, so clear local)
        if (storageKey) localStorage.removeItem(storageKey);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column: Notes & Advice */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Clinical Notes */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '400px' }}>
                    <h3 style={{ marginTop: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Clinical Notes
                    </h3>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter examination notes, symptoms, and diagnosis..."
                        disabled={isReadOnly}
                        style={{
                            flex: 1, width: '100%', padding: '1rem',
                            borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '1rem', fontFamily: 'inherit', resize: 'none',
                            outline: 'none', transition: 'border-color 0.2s',
                            background: isReadOnly ? '#f8fafc' : 'white'
                        }}
                        onFocus={(e) => !isReadOnly && (e.target.style.borderColor = '#0f766e')}
                        onBlur={(e) => !isReadOnly && (e.target.style.borderColor = '#cbd5e1')}
                    />
                </div>

                {/* Patient Advice */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '300px' }}>
                    <h3 style={{ marginTop: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} color="#0f766e" /> Patient Advice & Instructions
                    </h3>
                    <textarea
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                        placeholder="Enter advice for the patient (e.g., Diet restrictions, rest, follow-up plan, warning signs)..."
                        disabled={isReadOnly}
                        style={{
                            flex: 1, width: '100%', padding: '1rem',
                            borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '1rem', fontFamily: 'inherit', resize: 'none',
                            outline: 'none', background: isReadOnly ? '#f8fafc' : '#fffbeb'
                        }}
                    />
                </div>
            </div>

            {/* Right Column: Prescription Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        Prescribe Medicine
                    </h3>

                    {/* Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                        {/* Row 1: Name & Dosage */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                            <input
                                type="text" placeholder="Medicine Name (e.g. Paracetamol)"
                                value={currentMed.name}
                                onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                                disabled={isReadOnly}
                                style={{
                                    padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem',
                                    background: isReadOnly ? '#f8fafc' : 'white'
                                }}
                            />
                            <input
                                type="text" placeholder="Dosage (500mg)"
                                value={currentMed.dosage}
                                onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                disabled={isReadOnly}
                                style={{
                                    padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem',
                                    background: isReadOnly ? '#f8fafc' : 'white'
                                }}
                            />
                        </div>

                        {/* Row 2: Type & Duration */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <select
                                value={currentMed.type}
                                onChange={(e) => setCurrentMed({ ...currentMed, type: e.target.value })}
                                disabled={isReadOnly}
                                style={{
                                    padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem',
                                    background: isReadOnly ? '#f8fafc' : 'white'
                                }}
                            >
                                {['Tablet', 'Syrup', 'Capsule', 'Injection', 'Cream', 'Drops'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input
                                type="text" placeholder="Duration (e.g. 5 days)"
                                value={currentMed.duration}
                                onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                disabled={isReadOnly}
                                style={{
                                    padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem',
                                    background: isReadOnly ? '#f8fafc' : 'white'
                                }}
                            />
                        </div>

                        {/* Row 3: Instruction */}
                        <input
                            type="text" placeholder="Instruction (e.g. After Food)"
                            value={currentMed.instruction}
                            onChange={(e) => setCurrentMed({ ...currentMed, instruction: e.target.value })}
                            disabled={isReadOnly}
                            style={{
                                padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem',
                                background: isReadOnly ? '#f8fafc' : 'white'
                            }}
                        />

                        {/* Row 4: Timing Toggles */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Timing</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['Morning', 'Noon', 'Evening', 'Night'].map(t => {
                                    const key = t.toLowerCase();
                                    const active = currentMed.timing[key];
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setCurrentMed({ ...currentMed, timing: { ...currentMed.timing, [key]: !active } })}
                                            disabled={isReadOnly}
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: '6px',
                                                border: active ? '1px solid #0f766e' : '1px solid #cbd5e1',
                                                background: active ? '#f0fdfa' : (isReadOnly ? '#f8fafc' : 'white'),
                                                color: active ? '#0f766e' : '#64748b',
                                                fontSize: '0.85rem', cursor: isReadOnly ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                            }}
                                        >
                                            {t === 'Morning' && '☀️'}
                                            {t === 'Noon' && '🔆'}
                                            {t === 'Evening' && 'ws'}
                                            {t === 'Night' && '🌙'}
                                            {t}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {!isReadOnly && (
                            <button
                                onClick={addMedicine}
                                style={{
                                    marginTop: '10px', width: '100%', padding: '10px', background: '#0f766e', color: 'white',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                                }}
                            >
                                + Add Medicine
                            </button>
                        )}
                    </div>

                    {/* Medicine Table */}
                    <div style={{ minHeight: '100px', border: '1px dashed #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                        {medicines.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '30px' }}>
                                No medicines added yet.
                            </div>
                        ) : (
                            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {medicines.map((med, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 0' }}>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{med.name} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>({med.dosage}, {med.type})</span></div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    {Object.entries(med.timing).filter(([k, v]) => v).map(([k]) => k).join('-')} • {med.duration} • {med.instruction}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {!isReadOnly && (
                                                    <button onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ background: '#f0fdfa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                    <h4 style={{ marginTop: 0, color: '#0f766e', marginBottom: '1rem' }}>Actions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isReadOnly ? (
                            <div style={{
                                padding: '12px', background: '#ecfdf5', color: '#047857',
                                borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                border: '1px solid #6ee7b7'
                            }}>
                                <CheckCircle size={20} /> Consultation Completed
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={submitting || isPrescriptionSubmitted}
                                    style={{
                                        padding: '12px',
                                        background: isPrescriptionSubmitted ? '#cbd5e1' : '#0f766e',
                                        color: isPrescriptionSubmitted ? '#64748b' : 'white',
                                        border: 'none',
                                        borderRadius: '8px', fontWeight: '600',
                                        cursor: isPrescriptionSubmitted ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: isPrescriptionSubmitted ? 'none' : '0 4px 6px -1px rgba(15, 118, 110, 0.4)'
                                    }}>
                                    {isPrescriptionSubmitted ? (
                                        <>
                                            <CheckCircle size={18} /> Prescription Submitted
                                        </>
                                    ) : "Finalize & Submit Prescription"}
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={submitting}
                                    style={{
                                        padding: '12px', background: 'white', color: '#0f766e', border: '1px solid #0f766e',
                                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}>
                                    Save Consultation as Draft
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

const SummaryModal = ({ data, onClose }) => {
    if (!data) return null;

    // Normalize data
    const isDoctorSummary = data.type === 'DOCTOR_SUMMARY' || data.type === 'AI_SUMMARY_DOCTOR';
    const summary = isDoctorSummary ? (data.pre_doctor_consultation_summary || data) : (data.data || {});

    const assessment = summary.assessment || {};
    const vitals = summary.vitals_reported || summary.vitals || {};
    const actions = summary.immediate_actions || summary.plan?.immediate_actions || [];
    const redFlags = summary.red_flags || summary.red_flags_to_watch || [];

    // Extract Symptoms
    const history = summary.history || {};
    const reportedSymptoms = history.symptoms || [];
    const deniedSymptoms = history.negatives || [];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                background: 'white', width: '90%', maxWidth: '800px', maxHeight: '90vh',
                borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#0f766e', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={24} /> Pre-Doctor Consultation Summary
                        </h2>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                            Generated on {new Date(data.created_at || data.generated_at).toLocaleString()}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', overflowY: 'auto' }}>

                    {/* 1. Assessment & Severity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#f0fdfa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f766e', textTransform: 'uppercase', fontSize: '0.85rem' }}>Likely Diagnosis</h4>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#134e4a' }}>
                                {assessment.likely_diagnosis || "Under Evaluation"}
                            </div>
                        </div>
                        <div style={{ background: '#fff1f2', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#be123c', textTransform: 'uppercase', fontSize: '0.85rem' }}>Severity Level</h4>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#881337', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {assessment.severity || (assessment.severity_score ? (assessment.severity_score >= 70 ? "High" : (assessment.severity_score >= 40 ? "Medium" : "Low")) : "Unknown")}
                                {assessment.severity_score && <span style={{ fontSize: '0.9rem', background: 'white', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fecdd3' }}>Score: {assessment.severity_score}</span>}
                            </div>
                        </div>
                    </div>

                    {/* 2. Reasoning & Symptom Analysis */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Clinical Reasoning</h4>

                        {/* Symptoms Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            {/* Reported Symptoms */}
                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <h5 style={{ margin: '0 0 0.5rem 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={16} /> Reported Symptoms
                                </h5>
                                {reportedSymptoms.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {reportedSymptoms.map((sym, idx) => (
                                            <span key={idx} style={{ background: 'white', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid #dcfce7' }}>
                                                {sym}
                                            </span>
                                        ))}
                                    </div>
                                ) : <span style={{ color: '#86efac', fontStyle: 'italic', fontSize: '0.9rem' }}>None recorded</span>}
                            </div>

                            {/* Denied Symptoms */}
                            <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                <h5 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <X size={16} /> Denied / Absent
                                </h5>
                                {deniedSymptoms.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {deniedSymptoms.map((sym, idx) => (
                                            <span key={idx} style={{ background: 'white', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid #fee2e2' }}>
                                                {sym}
                                            </span>
                                        ))}
                                    </div>
                                ) : <span style={{ color: '#fca5a5', fontStyle: 'italic', fontSize: '0.9rem' }}>None recorded</span>}
                            </div>
                        </div>

                        <p style={{ lineHeight: '1.6', color: '#475569', background: '#f8fafc', padding: '1rem', borderRadius: '8px', margin: 0 }}>
                            {assessment.reasoning || summary.reasoning || "No additional reasoning provided."}
                        </p>
                    </div>

                    {/* 3. Vitals & Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                        {/* Reported Vitals */}
                        <div>
                            <h4 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Vitals</h4>
                            {Object.keys(vitals).length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.8rem' }}>
                                    {Object.entries(vitals).map(([key, val]) => (
                                        <li key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                                            <span style={{ textTransform: 'capitalize', color: '#64748b' }}>{key.replace(/_/g, ' ')}</span>
                                            <span style={{ fontWeight: '600', color: '#334155' }}>{val}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No specific vitals reported.</div>
                            )}
                        </div>

                        {/* Immediate Actions */}
                        <div>
                            <h4 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Recommended Actions</h4>
                            {actions.length > 0 ? (
                                <ul style={{ paddingLeft: '20px', color: '#475569' }}>
                                    {actions.map((action, idx) => (
                                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{action}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No actions listed.</div>
                            )}
                        </div>
                    </div>

                    {/* 4. Red Flags */}
                    {redFlags.length > 0 && (
                        <div style={{ marginTop: '2rem', background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} /> Red Flags to Watch
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {redFlags.map((flag, idx) => (
                                    <span key={idx} style={{ background: 'white', color: '#9a3412', padding: '4px 10px', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid #fdba74' }}>
                                        {flag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>




            </div>


        </div>
    );
};


const PatientHistoryView = ({ history, loading }) => {
    if (loading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTop: '3px solid #0f766e', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                Loading medical history...
            </div>
        );
    }

    if (!history || Object.keys(history).length === 0) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No structured medical history available yet.</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Complete a consultation to generate history.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Chronic Conditions */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#0f766e', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <Activity size={20} /> Chronic Conditions
                </h3>
                {history.chronic_conditions?.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {history.chronic_conditions.map((item, idx) => (
                            <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #0f766e' }}>
                                <div style={{ fontWeight: '600', color: '#334155' }}>{item.condition}</div>
                                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>Status: {item.status}</div>
                                {item.diagnosed_date && <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Since: {item.diagnosed_date}</div>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontStyle: 'italic', color: '#94a3b8' }}>No chronic conditions recorded.</div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Allergies */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <AlertTriangle size={20} /> Allergies
                    </h3>
                    {history.allergies?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {history.allergies.map((alg, idx) => (
                                <span key={idx} style={{ background: '#fef2f2', color: '#991b1b', padding: '4px 12px', borderRadius: '20px', border: '1px solid #fee2e2', fontWeight: '500' }}>
                                    {alg}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontStyle: 'italic', color: '#94a3b8' }}>No known allergies.</div>
                    )}
                </div>

                {/* Surgical / Family History */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <FileText size={20} /> Other History
                    </h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Surgical:</strong>
                        {history.surgical_history?.length > 0 ? history.surgical_history.join(", ") : <span style={{ color: '#94a3b8' }}>None</span>}
                    </div>
                    <div>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Family:</strong>
                        {history.family_history?.length > 0 ? history.family_history.join(", ") : <span style={{ color: '#94a3b8' }}>None</span>}
                    </div>
                </div>
            </div>

            {/* Past Visits / Acute Issues */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <Clock size={20} /> Acute / Past Consultations
                </h3>
                {history.past_consultations?.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {history.past_consultations.map((visit, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px dashed #e2e8f0' }}>
                                <div style={{ minWidth: '100px', fontWeight: 'bold', color: '#64748b' }}>{visit.date || 'Unknown Date'}</div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#334155' }}>{visit.diagnosis}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '4px' }}>{visit.doctor_notes}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontStyle: 'italic', color: '#94a3b8' }}>No past consultations recorded in history agent.</div>
                )}
            </div>

        </div>
    );
};

export default PatientDetail;
