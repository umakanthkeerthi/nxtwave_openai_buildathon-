import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder, FileText, Pill, Activity, Plus, Eye,
    Calendar, FileCheck, Search, Download, Stethoscope, Sparkles, X, ChevronRight, User, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MedicalRecords.css';

// --- REAL DATA INTEGRATION ---
import UploadRecordModal from '../components/UploadRecordModal';
import FileViewerModal from '../components/FileViewerModal';

const MedicalFiles = () => {
    const location = useLocation();
    // [FIX] Initialize state from navigation props if available
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'records');
    const { currentUser, selectedProfile } = useAuth();
    const navigate = useNavigate();

    // View Modal State
    const [viewFile, setViewFile] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // Consolidated View State
    const [selectedCase, setSelectedCase] = useState(null);
    const [isConsolidatedOpen, setIsConsolidatedOpen] = useState(false);

    // Prescription Modal State
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

    // State for all record types
    const [consultationFolders, setConsultationFolders] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [reports, setReports] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [summaries, setSummaries] = useState([]);

    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Fetch Records
    const fetchRecords = async () => {
        const targetId = selectedProfile?.id || currentUser?.uid || selectedProfile?.profile_id;
        if (targetId) {
            console.log("DEBUG: Fetching records for:", targetId);
            // V1.0: Use profile_id param explicitly if available, or fall back to patient_id logic
            // [FIX] Use relative path to avoid CORS and leverage Vite proxy
            fetch(`${import.meta.env.VITE_API_URL}/get_records?profile_id=${targetId}&patient_id=${targetId}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then(async data => {
                    console.log("DEBUG: Records fetched:", data?.records?.length);
                    if (data.records) {
                        // Reset all categories
                        const newFiles = [];
                        const newPrescriptions = [];
                        const newReports = [];
                        const newCertificates = [];
                        const newSummaries = [];
                        const casesMap = {}; // Grouping Logic

                        data.records.forEach(r => {
                            // Normalize Data (Handle V1.0 Flat vs Legacy Nested)
                            const isV1 = !r.data || (r.type === 'AI_SUMMARY' || r.type === 'DOCTOR_SUMMARY');
                            const recordData = isV1 ? r : r.data;

                            const item = {
                                id: r.record_id || r.summary_id || r.id,
                                title: recordData.title || "Untitled Record",
                                date: recordData.date || new Date(r.created_at || r.generated_at).toLocaleDateString(),
                                doctor: recordData.doctor || "Unknown Doctor",
                                type: r.type,
                                caseId: r.case_id,
                                diagnosis: recordData.title,
                                issuer: recordData.doctor,
                                labName: recordData.doctor,
                                status: "Issued",
                                fullData: recordData,
                                fileContent: recordData.fileContent,
                                fileName: recordData.fileName,
                                fileType: recordData.fileType
                            };

                            // Categorize & Group
                            const cId = r.case_id || "Unlinked";
                            if (!casesMap[cId]) {
                                casesMap[cId] = {
                                    caseId: cId,
                                    date: item.date,
                                    doctor: item.doctor !== "Unknown Doctor" ? item.doctor : "Consultation",
                                    items: [],
                                    summary: null,
                                    prescription: null,
                                    remarks: null,
                                    reports: []
                                };
                            }
                            casesMap[cId].items.push(item);
                            // Update Doctor Name if found (Summary usually has it or Prescriptions)
                            if (casesMap[cId].doctor === "Consultation" && item.doctor !== "Unknown Doctor") {
                                casesMap[cId].doctor = item.doctor;
                            }


                            // Specific Type Handling
                            if (r.type === 'Prescription' || r.type === 'PRESCRIPTION_MEDICINES') {
                                newPrescriptions.push(item);
                                casesMap[cId].prescription = item;
                            }
                            else if (r.type === 'Lab Report' || r.type === 'X-Ray' || r.type === 'LAB_REPORT') {
                                newReports.push(item);
                                casesMap[cId].reports.push(item);
                            }
                            else if (r.type === 'Certificate') {
                                newCertificates.push(item);
                            }
                            else if (r.type === 'DOCTOR_REMARKS') {
                                casesMap[cId].remarks = item;
                            }
                            // Handle AI Summaries
                            else if (r.type === 'summary' || r.type === 'AI_SUMMARY_DOCTOR' || r.type === 'AI_SUMMARY') {
                                let summaryObj = {};
                                if (r.type === 'AI_SUMMARY') {
                                    summaryObj = {
                                        id: r.summary_id || r.id,
                                        title: "AI Patient Summary",
                                        date: new Date(r.generated_at).toLocaleDateString(),
                                        caseId: r.case_id,
                                        fullData: r,
                                        color: r.triage_level || "Green",
                                        triage: (r.triage_level === "Red" || r.triage_level === "RED") ? "Emergency" : "Non-Emergency",
                                        chiefComplaints: [],
                                        reportedSymptoms: r.symptoms_reported || [],
                                        deniedSymptoms: r.symptoms_denied || [],
                                        redFlags: r.red_flags_to_watch || [],
                                        guidelines: r.guidelines?.actions?.[0] || "No specific guidelines.",
                                        followUp: "Check doctor instructions"
                                    };
                                } else {
                                    // Parse Patient Summary if available (it might be a JSON string or object)
                                    let patientSummaryParsed = null;
                                    try {
                                        if (typeof r.data?.patient_summary === 'string') {
                                            patientSummaryParsed = JSON.parse(r.data.patient_summary);
                                        } else {
                                            patientSummaryParsed = r.data?.patient_summary;
                                        }
                                    } catch (e) {
                                        console.warn("Failed to parse patient_summary", e);
                                    }

                                    const doctorSummary = r.data?.pre_doctor_consultation_summary || r.data || {};
                                    const history = doctorSummary.history || {};
                                    const assessment = doctorSummary.assessment || {};

                                    summaryObj = {
                                        id: r.record_id,
                                        title: "AI Health Summary",
                                        date: new Date(r.created_at).toLocaleDateString(),
                                        caseId: r.case_id,
                                        fullData: r.data,
                                        // Triaging: Prefer Patient Summary status if available
                                        color: (patientSummaryParsed?.triage_status?.toLowerCase().includes("red") || assessment.severity === "RED") ? "Red" : "Green",
                                        triage: (patientSummaryParsed?.triage_status?.toLowerCase().includes("red") || assessment.severity === "RED") ? "Emergency" : "Non-Emergency",

                                        // Content: Prefer Patient Summary fields
                                        chiefComplaints: doctorSummary.chief_complaint ? [doctorSummary.chief_complaint] : [],
                                        reportedSymptoms: patientSummaryParsed?.symptoms_reported || history.symptoms || [],
                                        deniedSymptoms: patientSummaryParsed?.symptoms_denied || history.negatives || [],
                                        redFlags: patientSummaryParsed?.red_flags || doctorSummary.red_flags || [],

                                        // Guidelines: Use clinical_guidelines from JSON or fallback to raw string
                                        guidelines: patientSummaryParsed?.clinical_guidelines || r.data?.patient_summary || "No specific guidelines."
                                    };
                                }
                                newSummaries.push(summaryObj);
                                casesMap[cId].summary = summaryObj;
                            }
                        });

                        // [NEW] Fetch case statuses for filtering
                        const uniqueCaseIds = [...new Set(
                            Object.keys(casesMap).filter(id => id && id !== "Unlinked")
                        )];

                        console.log("DEBUG: Fetching statuses for", uniqueCaseIds.length, "cases");
                        const caseStatuses = {};

                        await Promise.all(
                            uniqueCaseIds.map(async (caseId) => {
                                try {
                                    const res = await fetch(`${import.meta.env.VITE_API_URL}/get_case?case_id=${caseId}`);
                                    if (res.ok) {
                                        const caseData = await res.json();
                                        caseStatuses[caseId] = caseData.status;
                                    }
                                } catch (err) {
                                    console.error(`Failed to fetch status for ${caseId}`, err);
                                }
                            })
                        );

                        console.log("DEBUG: Case statuses:", caseStatuses);

                        // Convert Map to Array and Filter by Status
                        const folders = Object.values(casesMap)
                            .filter(folder => {
                                // Only show completed consultations in Medical Files
                                const status = caseStatuses[folder.caseId];
                                return status === "CONSULTATION_ENDED" || status === "COMPLETED";
                            })
                            .sort((a, b) => new Date(b.date) - new Date(a.date));

                        console.log("DEBUG: Filtered folders (completed only):", folders.length);
                        setConsultationFolders(folders);

                        setPrescriptions(newPrescriptions);
                        setReports(newReports);
                        setCertificates(newCertificates);
                        setSummaries(newSummaries); // [KEEP] AI Summaries unfiltered
                    }
                })
                .catch(err => console.error("Failed to fetch records:", err));
        }
    };

    React.useEffect(() => {
        fetchRecords();
    }, [currentUser, selectedProfile]);

    const handleUpload = async (formData) => {
        if (!currentUser?.uid) return;
        try {
            // [FIX] Absolute path
            const response = await fetch(`${import.meta.env.VITE_API_URL}/upload_record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedProfile?.id || currentUser.uid,
                    type: formData.type,
                    data: {
                        title: formData.title,
                        doctor: formData.doctor,
                        date: formData.date,
                        notes: formData.notes,
                        fileContent: formData.fileContent,
                        fileName: formData.fileName,
                        fileType: formData.fileType
                    }
                })
            });

            if (response.ok) {
                fetchRecords();
            } else {
                alert("Failed to upload record.");
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Error uploading record.");
        }
    };

    // Tab Configuration
    const tabs = [
        { id: 'records', label: 'Medical Files', icon: <Folder size={20} /> },
        { id: 'prescriptions', label: 'Prescriptions', icon: <Pill size={20} /> },
        { id: 'reports', label: 'Lab Reports', icon: <Activity size={20} /> },
        { id: 'summaries', label: 'AI Summaries', icon: <Sparkles size={20} /> },
        { id: 'certificates', label: 'Certificates', icon: <FileCheck size={20} /> },
    ];

    return (
        <div className="medical-records-container">
            {/* Left Sidebar Navigation */}
            <div className="mr-sidebar">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`mr-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="mr-content">
                <HeaderSection activeTab={activeTab} onUploadClick={() => setIsUploadOpen(true)} />

                <div className="mr-content-body">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'records' && (
                                <ConsultationFoldersView
                                    folders={consultationFolders}
                                    onOpen={(folder) => { setSelectedCase(folder); setIsConsolidatedOpen(true); }}
                                />
                            )}
                            {activeTab === 'prescriptions' && (
                                <PrescriptionsView
                                    prescriptions={prescriptions}
                                    onView={(file) => { setViewFile(file); setIsViewOpen(true); }}
                                    onDetailView={(file) => {
                                        setSelectedPrescription(file);
                                        setIsPrescriptionOpen(true);
                                    }}
                                />
                            )}
                            {activeTab === 'reports' && <ReportsView reports={reports} onView={(file) => { setViewFile(file); setIsViewOpen(true); }} />}
                            {activeTab === 'summaries' && <AISummariesView summaries={summaries} />}
                            {activeTab === 'certificates' && <CertificatesView certificates={certificates} onView={(file) => { setViewFile(file); setIsViewOpen(true); }} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <UploadRecordModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
            />

            <FileViewerModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                fileUrl={viewFile?.fileContent}
                fileName={viewFile?.fileName}
                fileType={viewFile?.fileType}
            />

            {/* NEW Consolidated Modal */}
            <ConsolidatedRecordModal
                isOpen={isConsolidatedOpen}
                onClose={() => setIsConsolidatedOpen(false)}
                data={selectedCase}
            />

            {/* NEW Exclusive Prescription Modal */}
            <PrescriptionDetailModal
                isOpen={isPrescriptionOpen}
                onClose={() => setIsPrescriptionOpen(false)}
                data={selectedPrescription}
            />
        </div>
    );
};

// --- SUB COMPONENTS ---

const HeaderSection = ({ activeTab, onUploadClick }) => {
    const titles = {
        records: { title: 'Medical Files', sub: 'Comprehensive view of all your consultations.' },
        prescriptions: { title: 'Prescriptions', sub: 'View and download your digital prescriptions.' },
        reports: { title: 'Lab Reports', sub: 'Detailed analysis reports from your diagnostics.' },
        summaries: { title: 'AI Health Summaries', sub: 'Smart insights and simplified explanations of your health.' },
        certificates: { title: 'Certificates', sub: 'Medical fitness and leave certificates.' }
    };
    const info = titles[activeTab] || titles.records;
    return (
        <div className="mr-header-section">
            <div>
                <h1 className="mr-title">{info.title}</h1>
                <p className="mr-subtitle">{info.sub}</p>
            </div>
            <button className="btn-add-record" onClick={onUploadClick}>
                <Plus size={20} />
                <span>Upload New</span>
            </button>
        </div>
    );
};

// [NEW] Consultation Folders View (The "Smart View")
const ConsultationFoldersView = ({ folders, onOpen }) => {
    console.log("DEBUG: Rendering Folders View. Count:", folders.length);
    return (
        <div className="files-grid">
            {folders.length === 0 ? (
                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                    <Folder size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto', display: 'block' }} />
                    <p style={{ margin: 0 }}>No consultation records found.</p>
                </div>
            ) : (
                folders.map(folder => (
                    <div key={folder.caseId} className="file-card folder-card" onClick={() => onOpen(folder)} style={{ cursor: 'pointer', borderLeft: '4px solid #0f766e' }}>
                        <div className="file-icon-box" style={{ background: '#f0fdfa', color: '#0f766e' }}>
                            <Folder size={28} />
                        </div>
                        <div className="file-info">
                            <h3 className="file-title">{folder.doctor}</h3>
                            <div className="file-meta-row">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={14} /> {folder.date}
                                </span>
                                <span>•</span>
                                <span className="meta-chip">Case: {folder.caseId ? folder.caseId.slice(0, 8) : "N/A"}...</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', display: 'flex', gap: '8px' }}>
                                {folder.prescription && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Pill size={12} /> Rx</span>}
                                {folder.summary && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Sparkles size={12} /> AI</span>}
                                {folder.remarks && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FileText size={12} /> Notes</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1' }}>
                            <ChevronRight size={20} />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// [NEW] Consolidated Modal
const ConsolidatedRecordModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const { summary, prescription, remarks, reports } = data;
    const medicines = prescription?.fullData?.medicines || [];
    const clinicalNotes = remarks?.fullData?.remarks || "";
    const advice = remarks?.fullData?.advice || "";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', overflowY: 'auto', padding: '0' }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Consultation Record</h2>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                            {data.date} • {data.doctor} • {data.caseId}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '2rem', display: 'grid', gap: '2rem' }}>

                    {/* 1. Doctor Remarks & Advice */}
                    {(clinicalNotes || advice) && (
                        <div className="section-block">
                            <h3 className="section-title"><Stethoscope size={18} /> Clinical Notes</h3>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                {clinicalNotes && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: '600', color: '#334155', marginBottom: '4px', fontSize: '0.9rem' }}>OBSERVATIONS</div>
                                        <div style={{ whiteSpace: 'pre-wrap', color: '#475569' }}>{clinicalNotes}</div>
                                    </div>
                                )}
                                {advice && (
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#0f766e', marginBottom: '4px', fontSize: '0.9rem' }}>ADVICE TO PATIENT</div>
                                        <div style={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>{advice}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. Prescription */}
                    {medicines.length > 0 && (
                        <div className="section-block">
                            <h3 className="section-title"><Pill size={18} /> Prescription</h3>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Medicine</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Dosage</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Frequency</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Duration</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Instruction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicines.map((med, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '10px', fontWeight: '500' }}>{med.name} <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>({med.type})</span></td>
                                                <td style={{ padding: '10px' }}>{med.dosage}</td>
                                                <td style={{ padding: '10px' }}>
                                                    {Object.entries(med.timing).filter(([k, v]) => v).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)).join('-')}
                                                </td>
                                                <td style={{ padding: '10px' }}>{med.duration}</td>
                                                <td style={{ padding: '10px', color: '#64748b' }}>{med.instruction}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. AI Insights */}
                    {summary && (
                        <div className="section-block">
                            <h3 className="section-title"><Sparkles size={18} /> AI Summary</h3>
                            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 'bold' }}>TRIAGE LEVEL</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: summary.color === 'RED' ? '#dc2626' : '#16a34a' }}>
                                            {summary.triage}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 'bold' }}>PRIMARY CONCERN</div>

                                        {/* Show Chief Complaints if available */}
                                        {summary.chiefComplaints && summary.chiefComplaints.length > 0 ? (
                                            <div>{summary.chiefComplaints.join(", ")}</div>
                                        ) : (
                                            <div style={{ fontStyle: 'italic', color: '#666' }}>Not specified</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 'bold' }}>REPORTED SYMPTOMS</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        {summary.reportedSymptoms && summary.reportedSymptoms.length > 0 ? summary.reportedSymptoms.map((s, i) => (
                                            <span key={i} style={{ background: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid #fcd34d' }}>{s}</span>
                                        )) : <span style={{ color: '#666', fontSize: '0.9rem' }}>None reported</span>}
                                    </div>
                                </div>

                                {/* [NEW] Denied Symptoms */}
                                {summary.deniedSymptoms && summary.deniedSymptoms.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 'bold' }}>DENIED SYMPTOMS</div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                            {summary.deniedSymptoms.map((s, i) => (
                                                <span key={i} style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid #e5e7eb' }}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* [NEW] Red Flags */}
                                {summary.redFlags && summary.redFlags.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 'bold' }}>RED FLAGS</div>
                                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.2rem', color: '#b91c1c', fontSize: '0.9rem' }}>
                                            {summary.redFlags.map((flag, i) => (
                                                <li key={i}>{flag}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* [NEW] Guidelines */}
                                {summary.guidelines && (
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 'bold' }}>CLINICAL GUIDELINES</div>
                                        <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{summary.guidelines}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};


const PrescriptionsView = ({ prescriptions, onView, onDetailView }) => {
    return (
        <div className="files-grid">
            {prescriptions.map((px) => (
                <div key={px.id} className="file-card prescription-card" style={{ alignItems: 'stretch' }}>
                    <div style={{
                        width: '50px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        borderRight: '1px solid #f0f0f0',
                        paddingRight: '1rem',
                        marginRight: '0.5rem'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(7, 118, 89, 0.1)', color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                        }}>Rx</div>
                    </div>

                    <div className="file-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 className="file-title">{px.doctor}</h3>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '2px' }}>{px.date}</div>
                            </div>

                            <button className="btn-view-file" style={{
                                padding: '0.6rem 1.2rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }} onClick={() => {
                                if (px.fullData?.medicines) {
                                    onDetailView(px);
                                } else if (px.fileContent) {
                                    onView(px);
                                } else {
                                    alert("No viewable file.");
                                }
                            }}>
                                <Eye size={18} />
                                View
                            </button>
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.8rem 1rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                Linked Case: <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '500' }}>{px.caseId ? px.caseId.slice(0, 8) : 'N/A'}...</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportsView = ({ reports, onView }) => {
    const [filter, setFilter] = useState('All');
    const displayReports = filter === 'All' ? reports : reports.filter(r => {
        if (filter === 'X-Ray') return r.type === 'X-Ray' || r.type === 'Scan';
        return r.type === filter;
    });

    return (
        <div>
            <div className="reports-filter-bar">
                {['All', 'Lab', 'X-Ray'].map(f => (
                    <button
                        key={f}
                        className={`filter-pill ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'X-Ray' ? 'X-Ray & Scans' : f + (f === 'All' ? '' : ' Reports')}
                    </button>
                ))}
            </div>

            <div className="files-grid">
                {displayReports.map((rpt) => (
                    <div key={rpt.id} className="file-card">
                        <div className="file-icon-box" style={{
                            backgroundColor: rpt.type === 'Lab' ? '#e3f2fd' : '#f3e5f5',
                            color: rpt.type === 'Lab' ? '#1565c0' : '#7b1fa2'
                        }}>
                            <Activity size={28} />
                        </div>

                        <div className="file-info">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 className="file-title">{rpt.title}</h3>
                                <span className="meta-chip">{rpt.type}</span>
                            </div>

                            <div className="file-meta-row">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={14} /> {rpt.date}
                                </span>
                            </div>
                        </div>

                        <button className="btn-view-file" onClick={() => {
                            if (rpt.fileContent) {
                                onView(rpt);
                            } else {
                                alert("No report file available.");
                            }
                        }}>
                            <Download size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AISummariesView = ({ summaries }) => {
    const navigate = useNavigate();

    return (
        <div className="files-grid">
            {summaries.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    No summaries generated yet. Complete a consultation to see AI insights here.
                </div>
            ) : (
                summaries.map((summary) => {
                    const isRed = summary.color === 'Red' || summary.color === 'RED';
                    return (
                        <div key={summary.id} className="ai-summary-card">
                            {/* Header with Icon and Badge */}
                            <div className="ai-card-header">
                                <div className="ai-icon-container">
                                    <Sparkles size={24} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span className="ai-badge-premium">AI Generated</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="ai-card-content">
                                <div>
                                    <h3 className="ai-title">{summary.title}</h3>
                                    <div className="ai-meta">
                                        <span className="ai-meta-item">
                                            <span style={{ opacity: 0.5 }}>#</span>
                                            {summary.caseId ? summary.caseId.slice(0, 8) : 'N/A'}...
                                        </span>
                                        <span style={{ opacity: 0.3 }}>|</span>
                                        <span className="ai-meta-item">
                                            <Calendar size={14} /> {summary.date}
                                        </span>
                                    </div>
                                </div>

                                {/* Triage Badge */}
                                <div className="ai-triage-badge" style={{
                                    backgroundColor: isRed ? '#fef2f2' : '#f0fdf4',
                                    color: isRed ? '#dc2626' : '#16a34a',
                                    border: `1px solid ${isRed ? '#fee2e2' : '#dcfce7'}`,
                                    alignSelf: 'flex-start',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isRed ? '#dc2626' : '#16a34a' }}></span>
                                    {summary.triage}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                className="ai-btn-premium"
                                onClick={() => navigate('/patient/patient-summary', {
                                    state: {
                                        readOnly: true,
                                        summary: summary
                                    }
                                })}
                            >
                                View Analysis <ChevronRight size={16} />
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
};

const CertificatesView = ({ certificates, onView }) => {
    return (
        <div className="files-grid">
            {certificates.map((cert) => (
                <div key={cert.id} className="file-card">
                    <div className="file-icon-box" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
                        <FileCheck size={28} />
                    </div>

                    <div className="file-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 className="file-title">{cert.title}</h3>
                            <span className="status-badge" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>{cert.status}</span>
                        </div>

                        <div className="file-meta-row">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} /> Issued: {cert.date}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                            Issuer: <span style={{ fontWeight: '500', color: '#333' }}>{cert.issuer}</span>
                        </div>
                    </div>

                    <button className="btn-view-file" onClick={() => {
                        if (cert.fileContent) {
                            onView(cert);
                        } else {
                            alert("No certificate available.");
                        }
                    }}>
                        <Download size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                        View Certificate
                    </button>
                </div>
            ))}
        </div>
    );
};

const PrescriptionDetailModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;
    const medicines = data.fullData?.medicines || [];
    const navigate = useNavigate();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto', padding: '0' }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#166534', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Pill size={24} /> Prescription Details
                        </h2>
                        <div style={{ fontSize: '0.9rem', color: '#15803d', marginTop: '4px' }}>
                            Issued by {data.doctor} • {data.date}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className="btn-secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: 'white',
                                color: '#166534',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: '1px solid #166534',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                            onClick={() => {
                                onClose();
                                navigate('/patient/medications', { state: { prescription: data } });
                            }}
                        >
                            <Activity size={18} />
                            Track Medication
                        </button>
                        <button
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#166534',
                                color: 'white',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                            onClick={() => {
                                onClose();
                                navigate('/patient/pharmacy', { state: { prescription: data } });
                            }}
                        >
                            <ShoppingCart size={18} />
                            Order Now
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '2rem' }}>
                    {medicines.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center' }}>No medicines listed in this prescription.</p>
                    ) : (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Medicine</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Dosage</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Frequency</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicines.map((med, idx) => (
                                        <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{med.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{med.type}</div>
                                                {med.instruction && (
                                                    <div style={{ fontSize: '0.85rem', color: '#0f766e', marginTop: '4px', fontStyle: 'italic' }}>
                                                        <span style={{ fontWeight: '500' }}>Note:</span> {med.instruction}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', color: '#475569' }}>{med.dosage}</td>
                                            <td style={{ padding: '12px', color: '#475569' }}>
                                                {med.timing ?
                                                    Object.entries(med.timing)
                                                        .filter(([k, v]) => v)
                                                        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                                                        .join(' - ')
                                                    : 'As directed'}
                                            </td>
                                            <td style={{ padding: '12px', color: '#475569' }}>{med.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default MedicalFiles;
