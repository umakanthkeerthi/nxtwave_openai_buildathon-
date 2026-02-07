import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Siren, Phone, Video, MapPin, Activity,
    CheckCircle, AlertOctagon, ArrowLeft, Ambulance, Pill
} from 'lucide-react';

const DoctorEmergencyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('ACTIVE'); // ACTIVE, STABILIZED, ESCALATED

    // Mock Data (In real app, fetch by ID)
    const data = {
        name: "Rahul Verma",
        age: 45,
        gender: "Male",
        trigger: "Chest Pain + Breathlessness",
        severity: "CRITICAL",
        vitals: { hr: 110, bp: "140/90", spo2: 92, temp: 37.2 },
        location: "12th Main, Indiranagar (0.8 km away)",
        contact: "9876543210"
    };

    if (status !== 'ACTIVE') {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', background: status === 'STABILIZED' ? '#dcfce7' : '#fee2e2',
                    borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {status === 'STABILIZED' ? <CheckCircle size={40} color="#16a34a" /> : <AlertOctagon size={40} color="#dc2626" />}
                </div>
                <h1 style={{ color: '#1e293b', marginBottom: '1rem' }}>Case {status === 'STABILIZED' ? 'Resolved' : 'Escalated'}</h1>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                    The emergency case has been marked as <strong>{status.toLowerCase()}</strong>.
                </p>
                <button
                    onClick={() => navigate('/doctor/emergency')}
                    style={{ padding: '12px 24px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Return to Queue
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <button
                onClick={() => navigate('/doctor/emergency')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                    marginBottom: '1rem', padding: 0, fontSize: '0.95rem'
                }}
            >
                <ArrowLeft size={18} /> Back to Queue
            </button>

            {/* Critical Banner */}
            <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1.5rem',
                marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '56px', height: '56px', background: '#ef4444', color: 'white',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Siren size={28} className="pulse-animation" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#991b1b' }}>Emergency Active</h1>
                        <div style={{ color: '#b91c1c', marginTop: '4px', fontWeight: '500' }}>
                            Patient: {data.name} ({data.age}, {data.gender})
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#dc2626', fontFamily: 'monospace' }}>04:12</div>
                    <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600' }}>CASE DURATION</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                {/* Left: Patient Overview (Read Only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Trigger & Location */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} /> Clinical Snapshot
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <InfoBlock label="Trigger" value={data.trigger} isCritical />
                            <InfoBlock label="Severity" value={data.severity} isCritical />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <VitalBox label="HR" value={data.vitals.hr} unit="bpm" />
                            <VitalBox label="BP" value={data.vitals.bp} unit="" />
                            <VitalBox label="SpO2" value={data.vitals.spo2} unit="%" />
                            <VitalBox label="Temp" value={data.vitals.temp} unit="°C" />
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={18} /> Location & Mode
                        </h3>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{data.location}</p>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <button style={{ flex: 1, padding: '10px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Video size={18} /> Join Video
                            </button>
                            <button style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Phone size={18} /> Audio Call
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Immediate Actions */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertOctagon size={18} /> Action Required
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button style={{
                                padding: '12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'spaceBetween', cursor: 'pointer',
                                fontWeight: '500', color: '#1e293b'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Ambulance size={20} color="#dc2626" /> Request Ambulance
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Notify Dispatch</span>
                            </button>

                            <button style={{
                                padding: '12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'spaceBetween', cursor: 'pointer',
                                fontWeight: '500', color: '#1e293b'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Pill size={20} color="#0f766e" /> Prescribe SOS Meds
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Quick RX</span>
                            </button>
                        </div>
                    </div>

                    {/* Resolution */}
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Case Resolution</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={() => setStatus('STABILIZED')}
                                style={{ padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Mark as Stabilized
                            </button>
                            <button
                                onClick={() => setStatus('ESCALATED')}
                                style={{ padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Escalate to ER
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .pulse-animation {
                    animation: pulse 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

const InfoBlock = ({ label, value, isCritical }) => (
    <div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: isCritical ? '#b91c1c' : '#1e293b' }}>{value}</div>
    </div>
);

const VitalBox = ({ label, value, unit }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>{value} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{unit}</span></div>
    </div>
);

export default DoctorEmergencyDetail;
