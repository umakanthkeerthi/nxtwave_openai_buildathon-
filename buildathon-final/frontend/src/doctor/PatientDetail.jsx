import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Activity, AlertTriangle, FileText,
    Pill, Clock, CheckCircle, Plus, File, Star, Stethoscope, Video, PhoneOff, X
} from 'lucide-react';
import VideoPopup from './VideoPopup';

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'Medical Files');
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Fetch Records
    React.useEffect(() => {
        const fetchRecords = async () => {
            try {
                // Use caseId if available for context-specific records
                const caseId = location.state?.patientData?.caseId;
                let url = `http://localhost:8003/get_records?patient_id=${id || ''}`;
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
    }, [id, location.state]);

    const handleSubmitConsultation = async (consultationData) => {
        setSubmitting(true);
        try {
            const payload = {
                patient_id: id,
                type: "PRESCRIPTION",
                data: consultationData
            };

            const response = await fetch('http://localhost:8003/upload_record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Consultation saved successfully!");
                navigate('/doctor/patients');
            } else {
                alert("Failed to save consultation.");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("Network error.");
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
    const patientData = location.state?.patientData || {};

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
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            background: isVideoOpen ? '#ef4444' : '#0f766e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginTop: '1rem',
                            boxShadow: isVideoOpen ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(15, 118, 110, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => setIsVideoOpen(!isVideoOpen)}
                        onMouseOver={(e) => e.target.style.background = isVideoOpen ? '#dc2626' : '#0d6560'}
                        onMouseOut={(e) => e.target.style.background = isVideoOpen ? '#ef4444' : '#0f766e'}
                    >
                        {isVideoOpen ? (
                            <>
                                <PhoneOff size={18} /> End Consultation
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
                <ConsultationMode records={medicalRecords} onSubmit={handleSubmitConsultation} submitting={submitting} />
            ) : (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                    Content for {activeTab} will appear here.
                </div>
            )}

            {/* Action Bar */}
            <div style={{
                position: 'fixed', bottom: '2rem', right: '2rem',
                background: 'white', padding: '1rem', borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
                display: 'flex', gap: '1rem', zIndex: 100
            }}>
                <ActionButton icon={<Plus size={18} />} label="Add Notes" color="white" />
                <ActionButton icon={<FileText size={18} />} label="Request Lab" color="white" />
                <ActionButton icon={<Pill size={18} />} label="Prescribe Meds" color="primary" />
                <ActionButton icon={<CheckCircle size={18} />} label="Mark Reviewed" color="success" />
            </div>
            {/* Video Popup */}
            {isVideoOpen && (
                <VideoPopup
                    patientName={patient ? patient.name : "Patient"}
                    onClose={() => setIsVideoOpen(false)}
                />
            )}
        </div>
    );
};

const MedicalFilesView = ({ records, loading }) => {
    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading records...</div>;

    // Filter Records
    const aiSummaries = records.filter(r => r.type === 'AI_SUMMARY_DOCTOR' || r.type === 'summary');
    const prescriptions = records.filter(r => r.type === 'PRESCRIPTION');
    const labReports = records.filter(r => r.type === 'LAB_REPORT');

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <FileSection title="Pre-Doctor Consultation Summary File" count={aiSummaries.length}>
                {aiSummaries.length === 0 ? <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No AI summaries found.</div> :
                    aiSummaries.map(doc => (
                        <FileCard
                            key={doc.record_id}
                            name={`AI Insight: ${doc.data?.pre_doctor_consultation_summary?.trigger_reason || "General Checkup"}`}
                            date={new Date(doc.created_at).toLocaleDateString()}
                            type="AI Insight"
                            isAI
                            summary={`Severity: ${doc.data?.triage_decision || "Unknown"}`}
                        />
                    ))
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

const ActionButton = ({ icon, label, color }) => {
    const styles = {
        white: { bg: 'white', text: '#334155', border: '1px solid #cbd5e1' },
        primary: { bg: '#0f766e', text: 'white', border: '1px solid #0f766e' },
        success: { bg: '#15803d', text: 'white', border: '1px solid #15803d' }
    };
    const theme = styles[color];

    return (
        <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: theme.bg, color: theme.text, border: theme.border,
            padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
        }}>
            {icon} {label}
        </button>
    );
};

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

const FileCard = ({ name, date, type, isAbnormal, isAI, summary }) => (
    <div style={{
        background: isAI ? '#f5f3ff' : 'white',
        border: isAbnormal ? '1px solid #fecaca' : (isAI ? '1px solid #ddd6fe' : '1px solid #e2e8f0'),
        borderRadius: '10px', padding: '1rem',
        position: 'relative', cursor: 'pointer', transition: 'box-shadow 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
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
    </div>
);

const ConsultationMode = ({ records, onSubmit, submitting }) => {
    const [remarks, setRemarks] = useState("");
    const [medicines, setMedicines] = useState([]);
    const [currentMed, setCurrentMed] = useState({ name: "", dosage: "", frequency: "", duration: "" });

    // Pre-fill remarks from AI Summary if available
    React.useEffect(() => {
        const latestSummary = records.find(r => r.type === 'AI_SUMMARY_DOCTOR' || r.type === 'summary');
        if (latestSummary) {
            const reason = latestSummary.data?.pre_doctor_consultation_summary?.trigger_reason || "";
            const assessment = latestSummary.data?.pre_doctor_consultation_summary?.assessment?.likely_diagnosis || "";
            if (!remarks) { // Only set if empty
                // setRemarks(`AI Trigger: ${reason}\nAssessment: ${assessment}\n\n`); // Optional: Auto-fill
            }
        }
    }, [records]);

    const addMedicine = () => {
        if (currentMed.name && currentMed.dosage) {
            setMedicines([...medicines, { ...currentMed, id: Date.now() }]);
            setCurrentMed({ name: "", dosage: "", frequency: "", duration: "" });
        }
    };

    const removeMedicine = (id) => {
        setMedicines(medicines.filter(med => med.id !== id));
    };

    const handleFinalSubmit = () => {
        const data = {
            remarks,
            medicines,
            timestamp: new Date().toISOString()
        };
        onSubmit(data);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            {/* Left: Doctor's Remarks (Pre-Consultation Summary) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginTop: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} color="#0f766e" /> Doctor's remarks
                    </h3>

                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter clinical notes here..."
                        style={{
                            flex: 1, width: '100%', minHeight: '300px', padding: '1rem',
                            borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '1rem', fontFamily: 'inherit', resize: 'none',
                            outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                </div>
            </div>

            {/* Right: Digital Prescription & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Prescription Form */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <Pill size={20} color="#0f766e" /> Digital Prescription
                    </h3>

                    {/* Add Medicine Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                            <input
                                type="text" placeholder="Medicine Name (e.g. Paracetamol)"
                                value={currentMed.name}
                                onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                            />
                            <select
                                value={currentMed.frequency}
                                onChange={(e) => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                            >
                                <option value="">Frequency</option>
                                <option value="1-0-1">1-0-1 (Morning-Night)</option>
                                <option value="1-0-0">1-0-0 (Morning)</option>
                                <option value="0-0-1">0-0-1 (Night)</option>
                                <option value="1-1-1">1-1-1 (TDS)</option>
                                <option value="SOS">SOS (As needed)</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <input
                                type="text" placeholder="Dosage (e.g. 500mg)"
                                value={currentMed.dosage}
                                onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                            />
                            <input
                                type="text" placeholder="Duration (e.g. 5 days)"
                                value={currentMed.duration}
                                onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                            />
                            <input
                                type="text" placeholder="Instruction (e.g. After food)"
                                value={currentMed.instruction}
                                onChange={(e) => setCurrentMed({ ...currentMed, instruction: e.target.value || "" })} // Handle optional logic
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                            />
                        </div>
                        <button
                            onClick={addMedicine}
                            style={{
                                alignSelf: 'flex-end', padding: '10px 20px', background: '#0f766e', color: 'white',
                                border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '600'
                            }}
                        >
                            <Plus size={16} /> Add Medicine
                        </button>
                    </div>

                    {/* Medicine List Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', borderRadius: '6px 0 0 6px' }}>Medicine</th>
                                    <th style={{ padding: '10px' }}>Dosage</th>
                                    <th style={{ padding: '10px' }}>Freq</th>
                                    <th style={{ padding: '10px' }}>Duration</th>
                                    <th style={{ padding: '10px' }}>Instruction</th>
                                    <th style={{ padding: '10px', borderRadius: '0 6px 6px 0' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                            No medicines prescribed yet.
                                        </td>
                                    </tr>
                                ) : (
                                    medicines.map((med) => (
                                        <tr key={med.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: '600', color: '#334155' }}>{med.name}</td>
                                            <td style={{ padding: '12px 10px', color: '#64748b' }}>{med.dosage}</td>
                                            <td style={{ padding: '12px 10px', color: '#0f766e', fontWeight: '500' }}>{med.frequency}</td>
                                            <td style={{ padding: '12px 10px', color: '#64748b' }}>{med.duration}</td>
                                            <td style={{ padding: '12px 10px', color: '#64748b' }}>{med.instruction || "-"}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                                <button onClick={() => removeMedicine(med.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ background: '#f0fdfa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                    <h4 style={{ marginTop: 0, color: '#0f766e', marginBottom: '1rem' }}>Consultation Actions</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button style={{
                            padding: '12px', background: 'white', color: '#0f766e', border: '1px solid #0f766e',
                            borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <FileText size={18} /> Save Draft
                        </button>
                        <button
                            onClick={handleFinalSubmit}
                            disabled={submitting}
                            style={{
                                padding: '12px', background: submitting ? '#9ca3af' : '#0f766e', color: 'white', border: 'none',
                                borderRadius: '8px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.4)'
                            }}>
                            {submitting ? 'Submitting...' : 'Submit and end consultation'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetail;
