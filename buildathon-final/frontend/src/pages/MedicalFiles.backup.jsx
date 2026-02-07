import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder, FileText, Pill, Activity, Plus, Eye,
    Calendar, FileCheck, Search, Download, Stethoscope, Sparkles
} from 'lucide-react';
import './MedicalRecords.css';

// --- MOCK DATA ---
const mockFiles = [
    {
        id: "MR-2026-001",
        title: "Annual General Checkup Summary",
        date: "02 Feb, 2026 at 10:30 AM",
        type: "General",
        doctor: "Dr. Priya Sharma"
    },
    {
        id: "MR-2026-009",
        title: "Viral Fever Diagnostics",
        date: "28 Jan, 2026 at 04:00 PM",
        type: "Lab Report",
        doctor: "Dr. Rajesh Gupta"
    },
    {
        id: "MR-2025-156",
        title: "Dermatology Consultation Notes",
        date: "15 Dec, 2025 at 11:15 AM",
        type: "Consultation",
        doctor: "Dr. Emily Clark"
    }
];

const mockPrescriptions = [
    {
        id: "RX-2026-88",
        caseId: "MR-2026-009",
        doctor: "Dr. Rajesh Gupta",
        date: "28 Jan, 2026",
        diagnosis: "Viral Pyrexia",
        medicines: ["Dolo 650mg (SOS)", "Cetzine 10mg (Night)", "Multivitamin"]
    },
    {
        id: "RX-2025-45",
        caseId: "MR-2025-156",
        doctor: "Dr. Emily Clark",
        date: "15 Dec, 2025",
        diagnosis: "Allergic Dermatitis",
        medicines: ["Levocetirizine 5mg", "Calamine Lotion", "Hydrocortisone Cream"]
    }
];

const mockReports = [
    {
        id: "RPT-LAB-001",
        title: "Complete Blood Count (CBC)",
        date: "28 Jan, 2026",
        type: "Lab",
        labName: "City Path Labs"
    },
    {
        id: "RPT-SCAN-099",
        title: "Chest X-Ray PA View",
        date: "30 Jan, 2026",
        type: "X-Ray",
        labName: "Apollo Diagnostics"
    },
    {
        id: "RPT-LAB-002",
        title: "Lipid Profile",
        date: "15 Dec, 2025",
        type: "Lab",
        labName: "City Path Labs"
    },
    {
        id: "RPT-SCAN-102",
        title: "MRI Knee Joint",
        date: "10 Nov, 2025",
        type: "Scan",
        labName: "MediScan Center"
    }
];

const mockCertificates = [
    {
        id: "CERT-001",
        title: "Medical Leave Certificate - 2 Days",
        date: "29 Jan, 2026",
        issuer: "Dr. Rajesh Gupta",
        status: "Issued"
    },
    {
        id: "CERT-002",
        title: "Physical Fitness Certificate",
        date: "01 Jan, 2026",
        issuer: "Dr. Priya Sharma",
        status: "Issued"
    }
];

const mockSummaries = [
    {
        id: "SUM-2026-001",
        title: "Viral Fever Recovery Plan",
        date: "29 Jan, 2026",
        caseId: "MR-2026-009"
    },
    {
        id: "SUM-2025-055",
        title: "Annual Health Overview 2025",
        date: "31 Dec, 2025",
        caseId: "MR-2025-GEN"
    }
];

const MedicalFiles = () => {
    const [activeTab, setActiveTab] = useState('records');

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
                <HeaderSection activeTab={activeTab} />

                <div className="mr-content-body">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'records' && <MedicalFilesView files={mockFiles} />}
                            {activeTab === 'prescriptions' && <PrescriptionsView prescriptions={mockPrescriptions} />}
                            {activeTab === 'reports' && <ReportsView reports={mockReports} />}
                            {activeTab === 'summaries' && <AISummariesView summaries={mockSummaries} />}
                            {activeTab === 'certificates' && <CertificatesView certificates={mockCertificates} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const HeaderSection = ({ activeTab }) => {
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
            <button className="btn-add-record">
                <Plus size={20} />
                <span>Upload New</span>
            </button>
        </div>
    );
};

const MedicalFilesView = ({ files }) => {
    return (
        <div className="files-grid">
            {files.map((file) => (
                <div key={file.id} className="file-card">
                    <div className="file-icon-box">
                        <Folder size={28} />
                    </div>

                    <div className="file-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 className="file-title">{file.title}</h3>
                            <span className="meta-chip" style={{ display: 'none' }}>{file.type}</span>
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

                    <button className="btn-view-file">
                        <Eye size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                        View File
                    </button>
                </div>
            ))}
        </div>
    );
};

const PrescriptionsView = ({ prescriptions }) => {
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

const ReportsView = ({ reports }) => {
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

                        <button className="btn-view-file">
                            <Download size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                            Download
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CertificatesView = ({ certificates }) => {
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

                    <button className="btn-view-file">
                        <Download size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                        Download
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
            {summaries.map((summary) => (
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
                            <span className="meta-chip">Case ID: {summary.caseId}</span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} /> {summary.date}
                            </span>
                        </div>
                    </div>

                    <button
                        className="btn-view-file"
                        style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)', backgroundColor: 'transparent' }}
                        onClick={() => navigate('/patient-summary', {
                            state: {
                                readOnly: true,
                                summary: {
                                    ...summary, // In a real app, we'd fetch the full summary here. For now, we'll let PatientSummary use its default mock data or we could pass specific mock data here if needed.
                                    caseId: summary.caseId,
                                    title: summary.title
                                }
                            }
                        })}
                    >
                        <Sparkles size={16} style={{ marginRight: '6px' }} />
                        View Summary
                    </button>
                </div>
            ))}
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
