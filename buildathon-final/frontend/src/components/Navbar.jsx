import React from 'react';
import { User, Activity, Stethoscope, Pill, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ProfileModal from './ProfileModal';

const Navbar = () => {
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    return (
        <>
            <nav className="main-navbar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                // Premium Glassmorphism
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
            }}>
                <Link to="/patient" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'var(--color-primary)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                    }}>
                        D
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-primary)' }}>DocAI</span>
                </Link>

                <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <NavItem to="/patient/pharmacy" icon={<Pill size={18} />} label="Pharmacy" />
                    <NavItem to="/patient/medical-files" icon={<Activity size={18} />} label="Medical Files" />
                    <NavItem to="/patient/consult" icon={<Stethoscope size={18} />} label="Consult Doctor" />
                    <NavItem to="/patient/medications" icon={<Activity size={18} />} label="Medications" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button style={{
                        position: 'relative',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Bell size={22} />
                        <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ff4d4f',
                            border: '1px solid white'
                        }}></span>
                    </button>

                    <div
                        onClick={() => setIsProfileOpen(true)}
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#e0e7e5',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <User size={20} />
                    </div>
                </div>
            </nav>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

            {/* Mobile Bottom Navigation */}
            <div className="mobile-nav">
                <NavItem to="/patient/pharmacy" icon={<Pill size={20} />} label="Pharmacy" />
                <NavItem to="/patient/medical-files" icon={<Activity size={20} />} label="Files" />
                <NavItem to="/patient/consult" icon={<Stethoscope size={20} />} label="Consult" />
                <NavItem to="/patient/medications" icon={<Activity size={20} />} label="Meds" />
            </div>
        </>
    );
};

const NavItem = ({ icon, label, to = "#" }) => {
    const location = useLocation();
    const isActive = to === '/'
        ? location.pathname === to
        : location.pathname.startsWith(to);

    return (
        <Link to={to} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'all 0.2s',
            backgroundColor: isActive ? 'rgba(7, 118, 89, 0.08)' : 'transparent',
            padding: '0.5rem 0.8rem',
            borderRadius: '8px'
        }}>
            <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)' }}>{icon}</span>
            <span className="nav-text" style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: isActive ? '700' : '500',
                textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,1)'
            }}>
                {label}
            </span>
        </Link>
    );
};

export default Navbar;
