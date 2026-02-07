import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Stethoscope, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{
                    width: '80px', height: '80px',
                    backgroundColor: '#fee2e2', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem', color: '#dc2626'
                }}>
                    <AlertTriangle size={40} />
                </div>

                <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>404</h1>
                <h2 style={{ fontSize: '1.5rem', color: '#334155', marginBottom: '1rem' }}>Page Not Found</h2>
                <p style={{ color: '#64748b', marginBottom: '2.5rem', maxWidth: '400px' }}>
                    Oops! The page you are looking for doesn't exist or has been moved.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate('/patient')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', borderRadius: '12px',
                            backgroundColor: '#0f766e', color: 'white',
                            border: 'none', cursor: 'pointer', fontWeight: '600',
                            fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
                        }}
                    >
                        <Home size={18} />
                        Patient Home
                    </button>

                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', borderRadius: '12px',
                            backgroundColor: 'white', color: '#334155',
                            border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: '600',
                            fontSize: '1rem'
                        }}
                    >
                        <Stethoscope size={18} />
                        Doctor Portal
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
