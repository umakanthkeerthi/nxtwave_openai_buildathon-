import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder, FileText, Pill, Activity, Plus, Eye,
    Calendar, FileCheck, Search, Download, Stethoscope, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MedicalRecords.css';

// --- REAL DATA INTEGRATION ---
import UploadRecordModal from '../components/UploadRecordModal';
import FileViewerModal from '../components/FileViewerModal';

const MedicalFiles = () => {
    const [activeTab, setActiveTab] = useState('records');
    const { currentUser, selectedProfile } = useAuth();

    // View Modal State
    const [viewFile, setViewFile] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // State for all record types
    const [files, setFiles] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [reports, setReports] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [summaries, setSummaries] = useState([]);

    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Fetch Records
    const fetchRecords = () => {
        const targetId = selectedProfile?.id || currentUser?.uid;
        if (targetId) {
            fetch(`/get_records?patient_id=${targetId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.records) {
                        // Reset all categories
                        const newFiles = [];
                        const newPrescriptions = [];
                        const newReports = [];
                        const newCertificates = [];
                        const newSummaries = [];

                        data.records.forEach(r => {
                            const item = {
                                id: r.record_id,
                                title: r.data.title || "Untitled Record",
                                date: r.data.date || new Date(r.created_at).toLocaleDateString(),
                                doctor: r.data.doctor || "Unknown Doctor",
                                type: r.type,
                                caseId: r.case_id,
                                diagnosis: r.data.title, // Map title to diagnosis for prescriptions
                                issuer: r.data.doctor, // Map doctor to issuer for certificates
                                labName: r.data.doctor, // Map doctor to labName for reports
                                status: "Issued",
                                fullData: r.data,
                                fileContent: r.data.fileContent,
                                fileName: r.data.fileName,
                                fileType: r.data.fileType
                            };

                            // Add ALL files to main 'Medical Records' list
                            if (r.type !== 'summary') {
                                newFiles.push(item);
                            }

                            // Also categorize into specific tabs
                            if (r.type === 'Prescription') newPrescriptions.push(item);
                            else if (r.type === 'Lab Report' || r.type === 'X-Ray') newReports.push(item);
                            else if (r.type === 'Certificate') newCertificates.push(item);
                            else if (r.type === 'summary' || r.type === 'AI_SUMMARY_DOCTOR') {
                                // Extract nested data for easier mapping
                                const doctorSummary = r.data.pre_doctor_consultation_summary || {};
                                const history = doctorSummary.history || {};
                                const assessment = doctorSummary.assessment || {};

                                newSummaries.push({
                                    id: r.record_id,
                                    title: "AI Health Summary",
                                    date: new Date(r.created_at).toLocaleDateString(),
                                    caseId: r.case_id,
                                    fullData: r.data,
                                    // Map nested fields to flat structure expected by Client
                                    color: assessment.severity || "Green",
                                    triage: assessment.severity === "RED" ? "Emergency" : "Non-Emergency",
                                    chiefComplaints: doctorSummary.chief_complaint ? [doctorSummary.chief_complaint] : [],
                                    reportedSymptoms: history.symptoms || [],
                                    deniedSymptoms: history.negatives || [],
                                    redFlags: doctorSummary.red_flags || [],
                                    guidelines: r.data.patient_summary || "No specific guidelines.",
                                    followUp: doctorSummary.plan?.referral_needed ? "Consult Doctor immediately" : "Monitor for 24 hours",
                                    raw_patient_summary: r.data.patient_summary,
                                    raw_doctor_summary: doctorSummary
                                });
                            }
                        });

                        setFiles(newFiles);
                        setPrescriptions(newPrescriptions);
                        setReports(newReports);
                        setCertificates(newCertificates);
                        setSummaries(newSummaries);
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
            const response = await fetch('/upload_record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedProfile?.id || currentUser.uid,
                    type: formData.type,
                    data: {
                        title: formData.title,
                        doctor: formData.doctor,
                        date: formData.date,
                        date: formData.date,
                        notes: formData.notes,
                        fileContent: formData.fileContent,
                        fileName: formData.fileName,
                        fileType: formData.fileType
                    }
                })
            });

            if (response.ok) {
                // Refresh records
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
        { id: 'records', label: 'Medical Records', icon: <Folder size={20} /> },
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
                            {activeTab === 'records' && <MedicalFilesView files={files} onView={(file) => { setViewFile(file); setIsViewOpen(true); }} />}
                            {activeTab === 'prescriptions' && <PrescriptionsView prescriptions={prescriptions} onView={(file) => { setViewFile(file); setIsViewOpen(true); }} />}
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
        </div>
    );
};

// --- SUB COMPONENTS ---

const HeaderSection = ({ activeTab, onUploadClick }) => {
    // Defines the Title displayed at the top of the content area
    const titles = {
        records: { title: 'Medical Files', sub: 'Access all your case history and visit summaries.' },
        prescriptions: { title: 'Prescriptions', sub: 'View and download your digital prescriptions.' },
        reports: { title: 'Lab Reports', sub: 'Detailed analysis reports from your diagnostics.' },
        summaries: { title: 'AI Health Summaries', sub: 'Smart insights and simplified explanations of your health.' },
        certificates: { title: 'Certificates', sub: 'Medical fitness and leave certificates.' }
    };

    const info = titles[activeTab];

    return (
        <div className="mr-header-section">
            <div>
                {/* Main Section Title */}
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

const MedicalFilesView = ({ files, onView }) => {
    return (
        <div className="files-grid">
            {files.map((file) => (
                <div key={file.id} className="file-card">
                    <div className="file-icon-box" style={{
                        backgroundColor: file.type === 'Prescription' ? 'rgba(7, 118, 89, 0.1)' :
                            file.type === 'Lab Report' ? '#e3f2fd' :
                                file.type === 'X-Ray' ? '#f3e5f5' :
                                    file.type === 'Certificate' ? '#fff3e0' : '#f5f5f5',
                        color: file.type === 'Prescription' ? 'var(--color-primary)' :
                            file.type === 'Lab Report' ? '#1565c0' :
                                file.type === 'X-Ray' ? '#7b1fa2' :
                                    file.type === 'Certificate' ? '#e65100' : '#666'
                    }}>
                        {file.type === 'Prescription' ? <Pill size={28} /> :
                            (file.type === 'Lab Report' || file.type === 'X-Ray') ? <Activity size={28} /> :
                                file.type === 'Certificate' ? <FileCheck size={28} /> :
                                    <Folder size={28} />}
                    </div>

                    <div className="file-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 className="file-title">{file.title}</h3>
                            <span className="meta-chip" style={{
                                display: 'inline-block',
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: file.type === 'Prescription' ? 'rgba(7, 118, 89, 0.1)' :
                                    file.type === 'Lab Report' ? '#e3f2fd' :
                                        file.type === 'X-Ray' ? '#f3e5f5' :
                                            file.type === 'Certificate' ? '#fff3e0' : '#f1f5f9',
                                color: file.type === 'Prescription' ? 'var(--color-primary)' :
                                    file.type === 'Lab Report' ? '#1565c0' :
                                        file.type === 'X-Ray' ? '#7b1fa2' :
                                            file.type === 'Certificate' ? '#e65100' : '#64748b'
                            }}>
                                {file.type}
                            </span>
                        </div>

                        <div className="file-meta-row">
                            <span className="meta-chip">Case ID: {file.id}</span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} /> {file.date}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                            Physician: <span style={{ fontWeight: '500', color: '#333' }}>{file.doctor}</span>
                        </div>
                    </div>

                    <button className="btn-view-file" onClick={() => {
                        if (file.fileContent) {
                            onView(file);
                        } else {
                            alert("No file attached to this record.");
                        }
                    }}>
                        <Eye size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                        View File
                    </button>
                </div>
            ))}
        </div>
    );
};

const PrescriptionsView = ({ prescriptions, onView }) => {
    return (
        <div className="files-grid">
            {prescriptions.map((px) => (
                <div key={px.id} className="file-card prescription-card" style={{ alignItems: 'stretch' }}>
                    {/* Rx Icon Strip */}
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

                            {/* Action Button */}
                            <button className="btn-view-file" style={{
                                padding: '0.6rem 1.2rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }} onClick={() => {
                                if (px.fileContent) {
                                    onView(px);
                                } else {
                                    alert("No prescription file uploaded.");
                                }
                            }}>
                                <Eye size={18} />
                                View Prescription
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '500', color: '#444' }}>
                                <Stethoscope size={16} color="var(--color-secondary)" />
                                <span>Diagnosis: <span style={{ fontWeight: '600', color: '#333' }}>{px.diagnosis}</span></span>
                            </div>

                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                Linked Case: <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '500' }}>{px.caseId}</span>
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
    const filters = ['All', 'Lab', 'X-Ray', 'Scan'];

    const displayReports = filter === 'All' ? reports : reports.filter(r => {
        if (filter === 'X-Ray') return r.type === 'X-Ray' || r.type === 'Scan'; // Group for UI
        return r.type === filter;
    });

    return (
        <div>
            {/* Filter Bar */}
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
                                <span className="meta-chip">ID: {rpt.id}</span>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={14} /> {rpt.date}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                Lab: <span style={{ fontWeight: '500', color: '#333' }}>{rpt.labName}</span>
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
                            View Report
                        </button>
                    </div>
                ))}
            </div>
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

const AISummariesView = ({ summaries }) => {
    const navigate = useNavigate();

    return (
        <div className="files-grid">
            {summaries.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    No summaries generated yet. Complete a consultation to see AI insights here.
                </div>
            ) : (
                summaries.map((summary) => (
                    <div key={summary.id} className="file-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                        <div className="file-icon-box" style={{ backgroundColor: 'rgba(7, 118, 89, 0.1)', color: 'var(--color-primary)' }}>
                            <Sparkles size={28} />
                        </div>

                        <div className="file-info">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 className="file-title">{summary.title}</h3>
                                <span className="meta-chip">AI Generated</span>
                            </div>

                            <div className="file-meta-row">
                                <span className="meta-chip">Case ID: {summary.caseId.slice(0, 8)}...</span>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={14} /> {summary.date}
                                </span>
                            </div>
                        </div>

                        <button
                            className="btn-view-file"
                            style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)', backgroundColor: 'transparent' }}
                            onClick={() => navigate('/patient/patient-summary', {
                                state: {
                                    readOnly: true,
                                    summary: summary
                                }
                            })}
                        >
                            <Sparkles size={16} style={{ marginRight: '6px' }} />
                            View Summary
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

const PlaceholderView = ({ title, icon }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px dashed #ddd',
        color: '#999'
    }}>
        <div style={{ marginBottom: '1rem', opacity: 0.5 }}>{icon}</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '500' }}>{title} Coming Soon</h3>
        <p>We are currently digitizing your records.</p>
    </div>
);

export default MedicalFiles;
