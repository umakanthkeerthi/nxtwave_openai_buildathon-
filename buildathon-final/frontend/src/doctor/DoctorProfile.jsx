import React, { useState, useEffect } from 'react';
import {
    User, Clock, DollarSign, Shield, Video, MapPin,
    CheckCircle, Save, Calendar, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DoctorProfile = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [status, setStatus] = useState({ online: true, emergency: false });
    const [profile, setProfile] = useState({
        name: "",
        specialty: "",
        experience: "",
        fees: "",
        about: "",
        modes: { video: true, offline: true }
    });

    const [schedule, setSchedule] = useState([
        { day: 'Mon', active: true, start: '09:00', end: '17:00' },
        { day: 'Tue', active: true, start: '09:00', end: '17:00' },
        { day: 'Wed', active: true, start: '09:00', end: '14:00' },
        { day: 'Thu', active: true, start: '09:00', end: '17:00' },
        { day: 'Fri', active: true, start: '09:00', end: '17:00' },
        { day: 'Sat', active: false, start: '10:00', end: '14:00' },
        { day: 'Sun', active: false, start: '', end: '' },
    ]);

    // Fetch Profile on Mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser?.doctor_id) {
                setLoading(false);
                return;
            }

            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const res = await fetch(`${apiUrl}/get_doctor?doctor_id=${currentUser.doctor_id}`);
                if (res.ok) {
                    const data = await res.json();

                    // Merge with defaults
                    setProfile({
                        name: data.name || currentUser.displayName || "Doctor",
                        specialty: data.specialization || "",
                        experience: data.experience || "",
                        fees: data.consultation_fees || "",
                        about: data.about || "",
                        modes: data.consultation_modes || { video: true, offline: true }
                    });

                    if (data.schedule) {
                        setSchedule(data.schedule);
                    }

                    if (data.status_flags) {
                        setStatus(data.status_flags);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser?.doctor_id) return;
        setSaving(true);
        try {
            const payload = {
                doctor_id: currentUser.doctor_id,
                data: {
                    name: profile.name,
                    specialization: profile.specialty,
                    experience: profile.experience,
                    consultation_fees: profile.fees,
                    about: profile.about,
                    consultation_modes: profile.modes,
                    schedule: schedule,
                    status_flags: status
                }
            };

            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/update_doctor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Profile and Schedule Saved Successfully!");
            } else {
                alert("Failed to save profile.");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error saving profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    if (loading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <Loader className="spin" size={32} style={{ margin: '0 auto 1rem' }} />
                <p>Loading Profile...</p>
                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Profile & Availability</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Manage your professional details and working hours</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', background: saving ? '#94a3b8' : '#0f766e', border: 'none',
                        borderRadius: '8px', color: 'white', fontWeight: '600', cursor: saving ? 'wait' : 'pointer'
                    }}
                >
                    {saving ? <Loader size={18} className="spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

                {/* Left Column: Profile & Schedule */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Professional Details */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <User size={20} /> Professional Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <InputGroup label="Full Name" value={profile.name} onChange={v => setProfile({ ...profile, name: v })} />
                            <InputGroup label="Specialty" value={profile.specialty} onChange={v => setProfile({ ...profile, specialty: v })} />
                            <InputGroup label="Experience" value={profile.experience} onChange={v => setProfile({ ...profile, experience: v })} />
                            <InputGroup label="Consultation Fees (₹)" value={profile.fees} onChange={v => setProfile({ ...profile, fees: v })} icon={<DollarSign size={16} />} />
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>About</label>
                            <textarea
                                value={profile.about}
                                onChange={e => setProfile({ ...profile, about: e.target.value })}
                                rows={3}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                    fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* Weekly Schedule */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={20} /> Weekly Schedule
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {schedule.map((day, idx) => (
                                <div key={day.day} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: idx < 6 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ width: '50px', fontWeight: '600', color: '#334155' }}>{day.day}</div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '100px' }}>
                                        <input
                                            type="checkbox"
                                            checked={day.active}
                                            onChange={(e) => handleScheduleChange(idx, 'active', e.target.checked)}
                                            style={{ width: '16px', height: '16px', accentColor: '#0f766e' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: day.active ? '#0f766e' : '#94a3b8' }}>
                                            {day.active ? 'Available' : 'Off'}
                                        </span>
                                    </label>

                                    {day.active ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input
                                                type="time" value={day.start}
                                                onChange={(e) => handleScheduleChange(idx, 'start', e.target.value)}
                                                style={inputStyle}
                                            />
                                            <span style={{ color: '#94a3b8' }}>to</span>
                                            <input
                                                type="time" value={day.end}
                                                onChange={(e) => handleScheduleChange(idx, 'end', e.target.value)}
                                                style={inputStyle}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1, fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic' }}>No slots available</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Status & Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Live Status */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Current Status</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: status.online ? '#22c55e' : '#94a3b8' }}></div>
                                <span style={{ fontWeight: '600', color: '#334155' }}>{status.online ? 'Online' : 'Offline'}</span>
                            </div>
                            <Toggle checked={status.online} onChange={() => setStatus({ ...status, online: !status.online })} />
                        </div>

                        <div style={{
                            background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#b91c1c' }}>Emergency Mode</div>
                                <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Accept critical cases</div>
                            </div>
                            <Toggle checked={status.emergency} onChange={() => setStatus({ ...status, emergency: !status.emergency })} color="#ef4444" />
                        </div>
                    </div>

                    {/* Consultation Modes */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Consultation Modes</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                                    <Video size={18} /> Video Consult
                                </div>
                                <Toggle checked={profile.modes.video} onChange={() => setProfile({ ...profile, modes: { ...profile.modes, video: !profile.modes.video } })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                                    <MapPin size={18} /> In-Clinic
                                </div>
                                <Toggle checked={profile.modes.offline} onChange={() => setProfile({ ...profile, modes: { ...profile.modes, offline: !profile.modes.offline } })} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

/* --- Helpers --- */

const InputGroup = ({ label, value, onChange, icon }) => (
    <div>
        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '0.95rem', paddingLeft: icon ? '32px' : '10px'
                }}
            />
            {icon && <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</div>}
        </div>
    </div>
);

const Toggle = ({ checked, onChange, color = '#0f766e' }) => (
    <div
        onClick={onChange}
        style={{
            width: '44px', height: '24px', background: checked ? color : '#e2e8f0',
            borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
        }}
    >
        <div style={{
            width: '18px', height: '18px', background: 'white', borderRadius: '50%',
            position: 'absolute', top: '3px',
            left: checked ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}></div>
    </div>
);

const inputStyle = {
    padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155'
};

export default DoctorProfile;
