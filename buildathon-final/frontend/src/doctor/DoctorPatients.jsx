import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_PATIENTS = [
    { id: 'P-101', name: 'Rahul Verma', age: 45, gender: 'M', lastVisit: '2 days ago', condition: 'Angina Pectoris', risk: 'High', type: 'Emergency' },
    { id: 'P-102', name: 'Sarah Jenkins', age: 29, gender: 'F', lastVisit: '1 week ago', condition: 'Migraine', risk: 'Low', type: 'Active' },
    { id: 'P-103', name: 'Amit Patel', age: 62, gender: 'M', lastVisit: 'Today', condition: 'Type 2 Diabetes', risk: 'Medium', type: 'Follow-up' },
    { id: 'P-104', name: 'Priya Sharma', age: 34, gender: 'F', lastVisit: '3 days ago', condition: 'Viral Fever', risk: 'Low', type: 'Active' },
    { id: 'P-105', name: 'John Doe', age: 50, gender: 'M', lastVisit: 'Just now', condition: 'Hypertension', risk: 'High', type: 'Emergency' },
    { id: 'P-106', name: 'Emily Clark', age: 24, gender: 'F', lastVisit: '1 month ago', condition: 'Routine Checkup', risk: 'Low', type: 'Active' },
];

const DoctorPatients = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // TODO: Get real doctor ID
    const DOCTOR_ID = "doc_mock_001";

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await fetch(`/get_patients?doctor_id=${DOCTOR_ID}`);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();

                // Transform Backend Data (Patient Snapshot)
                const formatted = data.map(p => ({
                    id: p.id,
                    // If snapshot data is missing, provide fallbacks
                    name: p.name || p.id,
                    age: p.age || "?",
                    gender: p.gender || "?",
                    lastVisit: 'Recently', // We don't track this yet in snapshot
                    condition: 'Under Observation', // Placeholder until we have diagnosis history
                    risk: 'Medium', // Default risk
                    type: 'Active'
                }));
                setPatients(formatted);
            } catch (error) {
                console.error("Error fetching patients:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.condition.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || p.type.includes(filter) || (filter === 'High Risk' && p.risk === 'High');
        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>My Patients</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Manage patient records and medical history</p>
                </div>
                <button style={{
                    background: '#0f766e', color: 'white', padding: '10px 20px',
                    borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer'
                }}>
                    + Add New Patient
                </button>
            </div>

            {/* Filters & Search */}
            <div style={{
                background: 'white', padding: '1rem', borderRadius: '12px',
                border: '1px solid #e2e8f0', marginBottom: '1.5rem',
                display: 'flex', gap: '1rem', alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by Name, ID or Condition..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 40px',
                            borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {['All', 'Active', 'Emergency', 'Follow-up', 'High Risk'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px', borderRadius: '20px',
                                border: filter === f ? '1px solid #0f766e' : '1px solid #e2e8f0',
                                background: filter === f ? '#f0fdfa' : 'white',
                                color: filter === f ? '#0f766e' : '#64748b',
                                fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Patients Table */}
            <div style={{
                background: 'white', borderRadius: '12px',
                border: '1px solid #e2e8f0', overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Patient Info</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Last Visit</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Condition</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>AI Risk Analysis</th>
                            <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map((patient, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '600', color: '#475569'
                                        }}>
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{patient.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{patient.id} • {patient.age}yrs, {patient.gender}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.95rem' }}>{patient.lastVisit}</td>
                                <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '500' }}>{patient.condition}</td>
                                <td style={{ padding: '1rem' }}>
                                    <RiskBadge level={patient.risk} />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                        background: patient.type === 'Emergency' ? '#fef2f2' : '#f0fdfa',
                                        color: patient.type === 'Emergency' ? '#991b1b' : '#0f766e'
                                    }}>
                                        {patient.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                                        style={{
                                            padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                            background: 'white', color: '#64748b', cursor: 'pointer'
                                        }}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RiskBadge = ({ level }) => {
    const colors = {
        High: { color: '#dc2626', bg: '#fef2f2', icon: <AlertCircle size={14} /> },
        Medium: { color: '#d97706', bg: '#fffbeb', icon: <Activity size={14} /> },
        Low: { color: '#16a34a', bg: '#dcfce7', icon: <Activity size={14} /> },
    };
    const theme = colors[level] || colors.Low;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: theme.bg, color: theme.color,
            padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600'
        }}>
            {theme.icon}
            {level} Risk
        </div>
    );
};

export default DoctorPatients;
