import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import './Auth.css'; // Reuse basic auth styles but we will add specific inline styles or new class

const ProfileSelection = () => {
    const { currentUser, selectProfile, logout } = useAuth();
    const navigate = useNavigate();

    // V1.0 Schema: Profiles are attached directly to currentUser by AuthContext
    const profiles = currentUser?.profiles || [];

    // Auto-redirect to setup if no profiles exist (New User Flow)
    React.useEffect(() => {
        if (profiles.length === 0) {
            navigate('/profile-setup');
        }
    }, [profiles, navigate]);

    const handleProfileClick = (profileId) => {
        selectProfile(profileId);
        navigate('/patient');
    };

    const handleAddProfile = () => {
        navigate('/profile-setup');
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#dcfce7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ position: 'absolute', top: '20px', right: '30px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 24px',
                        backgroundColor: 'white',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Logout
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', width: '100%', maxWidth: '1200px' }}
            >
                <h1 style={{
                    color: '#047857',
                    fontSize: '3rem',
                    fontWeight: '700',
                    marginBottom: '3rem',
                    letterSpacing: '-0.5px'
                }}>
                    Who's checking in?
                </h1>

                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    padding: '0 2rem'
                }}>
                    {/* Map through all profiles */}
                    {profiles.map((profile) => {
                        const initial = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';
                        const displayName = profile.fullName ? profile.fullName.split(' ')[0] : 'User';
                        return (
                            <div
                                key={profile.id}
                                onClick={() => handleProfileClick(profile.id)}
                                className="profile-card"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        backgroundColor: '#5eead4', // Bright teal
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#134e4a' }}>
                                        {initial}
                                    </span>
                                </motion.div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.25rem', color: '#047857', fontWeight: '600' }}>
                                        {displayName}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: '#059669' }}>
                                        {profile.relation}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Profile Card */}
                    <div
                        onClick={handleAddProfile}
                        className="profile-card"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05, backgroundColor: 'white' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: '150px',
                                height: '150px',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed #10b981',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={64} color="#10b981" />
                        </motion.div>
                        <span style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: '600' }}>
                            Add Profile
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileSelection;
