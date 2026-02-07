import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorLogin = () => {
    const navigate = useNavigate();
    const { login, currentUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in and verification passed
    useEffect(() => {
        if (currentUser && currentUser.profile?.role === 'doctor') {
            navigate('/doctor/dashboard');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic domain check for speed (optional)
        if (!email.endsWith('@docai.in')) {
            setError("Access Restricted: Please use your official @docai.in email.");
            return;
        }

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            // Navigation handled by useEffect or AuthContext logic
        } catch (err) {
            console.error("Login Error:", err);
            setError("Invalid credentials. Please contact Admin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f9d86', // Teal Green from mockup
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    backgroundColor: 'white',
                    padding: '3rem',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    width: '100%',
                    maxWidth: '480px',
                    textAlign: 'center'
                }}
            >
                {/* Logo Section */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{
                        border: '2px solid #0f9d86',
                        borderRadius: '8px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0f9d86'
                    }}>
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <h2 style={{ color: '#0f766e', margin: 0, fontSize: '1.5rem' }}>DocAI Provider</h2>
                </div>

                <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '0.5rem' }}>Doctor Login</h1>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Access your dashboard to manage appointments and patients</p>

                {error && <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="doctor@docai.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outlineColor: '#0f9d86'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Password</label>
                        <input
                            type="password"
                            required
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outlineColor: '#0f9d86'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.9rem',
                            backgroundColor: '#0f9d86',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.8 : 1
                        }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {/* Demo Credentials Box */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f0fdf9',
                    border: '1px solid #ccfbf1',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    color: '#334155'
                }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f766e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demo Credentials:</strong>
                    <div style={{ fontFamily: 'monospace' }}>
                        <div style={{ marginBottom: '4px' }}>
                            <span style={{ color: '#0f9d86', fontWeight: 'bold' }}>Cardiology:</span> shahrukh.khan@docai.in
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            <span style={{ color: '#0f9d86', fontWeight: 'bold' }}>General:</span> amit.sharma@docai.in
                        </div>
                        <div>
                            <span style={{ color: '#0f9d86', fontWeight: 'bold' }}>Password:</span> password123
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <Link to="/patient" style={{
                        color: '#0f9d86',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}>
                        <ArrowLeft size={16} /> Back to Patient Portal
                    </Link>
                </div>

            </motion.div>
        </div>
    );
};

export default DoctorLogin;
