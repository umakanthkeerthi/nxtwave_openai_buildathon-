import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Globe } from 'lucide-react';
import './Auth.css'; // We will create this CSS

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (currentUser) {
            navigate('/profiles');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/profiles'); // Redirect to profile selection
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/profiles');
        } catch (err) {
            setError('Failed to login with Google.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Access your health companion</p>
                </div>

                {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button disabled={loading} className="btn-primary auth-btn" type="submit">
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR</span>
                </div>

                <button disabled={loading} onClick={handleGoogleLogin} className="btn-secondary auth-btn google-btn">
                    <Globe size={20} style={{ marginRight: '8px' }} /> Continue with Google
                </button>

                <div className="auth-footer">
                    Need an account? <Link to="/signup">Sign Up</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
