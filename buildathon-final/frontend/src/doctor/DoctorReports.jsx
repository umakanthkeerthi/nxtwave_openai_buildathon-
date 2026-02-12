import React, { useState, useEffect } from 'react';
import {
    FileText, Search, Filter, Download, Eye,
    CheckCircle, AlertTriangle, ChevronDown
} from 'lucide-react';

const MOCK_REPORTS = [
    {
        id: 1,
        patient: "Rahul Verma",
        type: "Lab Report",
        name: "Complete Blood Count (CBC)",
        date: "Today, 09:30 AM",
        status: "Pending",
        isAbnormal: true,
        summary: "High WBC count detected."
    },
    {
        id: 2,
        patient: "Sarah Jenkins",
        type: "Imaging",
        name: "MRI Brain Scan",
        date: "Yesterday, 04:15 PM",
        status: "Reviewed",
        isAbnormal: false,
        summary: "Normal structural integrity."
    },
    {
        id: 3,
        patient: "Amit Patel",
        type: "Lab Report",
        name: "Lipid Profile",
        date: "Yesterday, 02:00 PM",
        status: "Pending",
        isAbnormal: true,
        summary: "Elevated Cholesterol levels."
    },
    {
        id: 4,
        patient: "John Doe",
        type: "Discharge Summary",
        name: "Post-Surgery Summary",
        date: "2 days ago",
        status: "Reviewed",
        isAbnormal: false
    }
];

const DoctorReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/get_records`);
                if (!response.ok) throw new Error('Failed to fetch reports');
                const data = await response.json();

                // Transform
                const formatted = data.records.map(record => {
                    // Extract patient info from nested data if available
                    // Note: Our records schema might need to save patient name at root level for easier indexing, 
                    // but for now we dig into 'data'. 
                    // If 'data.patient_profile' exists, use it.
                    const profile = record.data?.patient_profile || {};
                    const name = record.type === "PRESCRIPTION" ? "Prescription" :
                        record.type === "AI_SUMMARY_DOCTOR" ? "AI Triage Summary" :
                            record.type;

                    return {
                        id: record.id,
                        patient: profile.name || record.patient_id || "Unknown",
                        type: record.type,
                        name: name,
                        date: new Date(record.created_at).toLocaleString(),
                        status: "Reviewed", // Default for now
                        isAbnormal: record.data?.pre_doctor_consultation_summary?.assessment?.severity === "CRITICAL",
                        summary: record.data?.pre_doctor_consultation_summary?.trigger_reason || "No summary"
                    };
                });
                setReports(formatted);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const getFilteredReports = () => {
        if (filter === 'To Review') return reports.filter(r => r.status === 'Pending');
        if (filter === 'Flagged') return reports.filter(r => r.isAbnormal);
        return reports;
    };

    const handleMarkReviewed = (id) => {
        setReports(reports.map(r => r.id === id ? { ...r, status: 'Reviewed' } : r));
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Clinical Reports</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Centralized inbox for patient diagnostic results</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            style={{
                                padding: '10px 10px 10px 36px', borderRadius: '8px',
                                border: '1px solid #cbd5e1', width: '240px'
                            }}
                        />
                    </div>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1',
                        borderRadius: '8px', color: '#334155', cursor: 'pointer'
                    }}>
                        <Filter size={18} /> Filters
                    </button>
                </div>
            </div>

            {/* Quick Stats / Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <TabButton label="All Reports" count={reports.length} active={filter === 'All'} onClick={() => setFilter('All')} />
                <TabButton label="To Review" count={reports.filter(r => r.status === 'Pending').length} active={filter === 'To Review'} onClick={() => setFilter('To Review')} isWarning />
                <TabButton label="Flagged (Abnormal)" count={reports.filter(r => r.isAbnormal).length} active={filter === 'Flagged'} onClick={() => setFilter('Flagged')} isCritical />
            </div>

            {/* Reports List */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1.5fr',
                    padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                    fontWeight: '600', color: '#64748b', fontSize: '0.9rem'
                }}>
                    <div>REPORT NAME</div>
                    <div>PATIENT</div>
                    <div>DATE RECIEVED</div>
                    <div>STATUS</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                {/* Table Rows */}
                {getFilteredReports().map(item => (
                    <div key={item.id} style={{
                        display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1.5fr',
                        padding: '1.2rem 1.5rem', borderBottom: '1px solid #f1f5f9',
                        alignItems: 'center', transition: 'background 0.1s',
                        background: item.status === 'Pending' ? '#fff' : '#fcfcfc'
                    }}>
                        {/* Report Name */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    padding: '8px', borderRadius: '8px',
                                    background: item.isAbnormal ? '#fef2f2' : '#f1f5f9',
                                    color: item.isAbnormal ? '#ef4444' : '#64748b'
                                }}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.type}</div>
                                </div>
                            </div>
                            {item.isAbnormal && (
                                <div style={{
                                    marginTop: '6px', fontSize: '0.8rem', color: '#ef4444', fontWeight: '500',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <AlertTriangle size={12} /> {item.summary}
                                </div>
                            )}
                        </div>

                        {/* Patient */}
                        <div style={{ fontWeight: '500', color: '#334155' }}>
                            {item.patient}
                        </div>

                        {/* Date */}
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                            {item.date}
                        </div>

                        {/* Status */}
                        <div>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                background: item.status === 'Pending' ? '#fff7ed' : '#f0fdfa',
                                color: item.status === 'Pending' ? '#ea580c' : '#0f766e'
                            }}>
                                {item.status === 'Pending' ? <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }}></div> : <CheckCircle size={14} />}
                                {item.status}
                            </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button style={{
                                padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                background: 'white', cursor: 'pointer', color: '#64748b'
                            }} title="Preview">
                                <Eye size={18} />
                            </button>
                            <button style={{
                                padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                background: 'white', cursor: 'pointer', color: '#64748b'
                            }} title="Download">
                                <Download size={18} />
                            </button>
                            {item.status === 'Pending' && (
                                <button
                                    onClick={() => handleMarkReviewed(item.id)}
                                    style={{
                                        padding: '8px 12px', border: 'none', borderRadius: '6px',
                                        background: '#0f766e', color: 'white', cursor: 'pointer', fontWeight: '500',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Review
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TabButton = ({ label, count, active, onClick, isWarning, isCritical }) => {
    let activeColor = '#0f766e';
    if (isWarning) activeColor = '#ea580c';
    if (isCritical) activeColor = '#ef4444';

    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: active ? activeColor : 'white',
                color: active ? 'white' : '#64748b',
                fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: active ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
            }}
        >
            {label}
            <span style={{
                background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem'
            }}>
                {count}
            </span>
        </button>
    );
};

export default DoctorReports;
