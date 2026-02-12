import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, User, Activity, Droplet, Globe, LogOut, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ isOpen, onClose }) => {

    const { currentUser, selectedProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [address, setAddress] = useState("Fetching location...");
    const [loadingLocation, setLoadingLocation] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoadingLocation(true);
            // [MVP] Hardcoded Location: Bharat Mandapam, New Delhi
            // This ensures "Near You" logic always finds our seeded doctors.
            const MVP_LAT = 28.6129;
            const MVP_LON = 77.2295;

            const fetchLocation = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/get_location?lat=${MVP_LAT}&lon=${MVP_LON}`);
                    const data = await response.json();
                    setAddress(data.display_name || "New Delhi (Bharat Mandapam)");
                } catch (error) {
                    console.error("Error fetching address:", error);
                    setAddress("New Delhi, India");
                }
                setLoadingLocation(false);
            };

            fetchLocation();

            // Original Geolocation Code (Disabled for Demo Reliability)
            /*
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(...)
            } ...
            */
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const profile = selectedProfile || currentUser?.profile || {};

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 1001,
                            backdropFilter: 'blur(5px)'
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        style={{
                            position: 'fixed',
                            top: '80px',
                            right: '20px',
                            width: '350px',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                            zIndex: 1002,
                            padding: '1.5rem',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>My Profile</h3>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#475569'
                            }}>
                                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: '#0f172a' }}>{profile.fullName || currentUser?.displayName || "User"}</h4>
                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{currentUser?.email}</span>
                            </div>
                        </div>

                        <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <DetailItem icon={<Activity size={16} />} label="Age" value={profile.age || "--"} />
                            <DetailItem icon={<Droplet size={16} />} label="Blood Group" value={profile.bloodGroup || "--"} />
                            <DetailItem icon={<User size={16} />} label="Gender" value={profile.gender || "--"} />
                            <DetailItem icon={<Globe size={16} />} label="Language" value="English" />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                                <MapPin size={16} />
                                <span>Current Location</span>
                            </div>
                            <div style={{
                                padding: '0.8rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                color: '#334155',
                                lineHeight: '1.4'
                            }}>
                                {loadingLocation ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="loader-dot"></span> Locating...
                                    </span>
                                ) : address}
                            </div>
                        </div>

                        <button
                            onClick={() => { logout(); onClose(); }}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                backgroundColor: '#fef2f2',
                                color: '#ef4444',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <LogOut size={18} /> Sign Out
                        </button>

                        <button
                            onClick={() => { onClose(); navigate('/profiles'); }}
                            style={{
                                width: '100%',
                                marginTop: '0.8rem',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                color: '#475569',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Repeat size={18} /> Switch Profile
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div style={{ padding: '0.8rem', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
            {icon} {label}
        </div>
        <div style={{ fontWeight: '600', color: '#334155' }}>{value}</div>
    </div>
);

export default ProfileModal;
