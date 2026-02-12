import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, Calendar, MessageSquare, FileText,
    Settings, LogOut, Bell, Siren, Menu, X, Clock
} from 'lucide-react';
import './DoctorLayout.css';

const DoctorLayout = () => {
    const { currentUser, logout } = useAuth(); // Get currentUser
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [doctorProfile, setDoctorProfile] = useState(null);

    // Close menu when route changes (mobile convenience)
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Fetch Doctor Profile
    useEffect(() => {
        const fetchDoctorProfile = async () => {
            if (currentUser && currentUser.doctor_id) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/get_doctor?doctor_id=${currentUser.doctor_id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setDoctorProfile(data);
                    }
                } catch (error) {
                    console.error("Error fetching doctor profile:", error);
                }
            }
        };
        fetchDoctorProfile();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/doctor/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="doctor-layout">
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`doctor-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div style={{
                        width: '32px', height: '32px',
                        background: '#0f766e',
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>D</div>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                        DOC AI <span style={{ fontWeight: '400', color: '#64748b' }}>Pro</span>
                    </span>
                    <button
                        className="mobile-menu-btn"
                        style={{ marginLeft: 'auto', display: isMobileMenuOpen ? 'block' : 'none' }}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group">
                        <NavItem to="/doctor/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                        <NavItem to="/doctor/emergency" icon={<Siren size={20} />} label="Emergency Queue" isCritical />
                        <NavItem to="/doctor/patients" icon={<Users size={20} />} label="My Patients" />
                        <NavItem to="/doctor/scheduled-appointments" icon={<Calendar size={20} />} label="Scheduled Appointments" />
                        <NavItem to="/doctor/my-slots" icon={<Clock size={20} />} label="Manage Slots" />
                        <NavItem to="/doctor/messages" icon={<MessageSquare size={20} />} label="Messages" />
                        <NavItem to="/doctor/reports" icon={<FileText size={20} />} label="Reports" />
                        <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
                        <NavItem to="/doctor/profile" icon={<Settings size={20} />} label="Settings & Profile" />
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="switch-patient-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555' }}>
                            {doctorProfile?.name ? doctorProfile.name.charAt(0) : "D"}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>
                                {doctorProfile?.name || "Dr. Loading..."}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {doctorProfile?.specialization || "Specialist"}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="doctor-main">
                {/* Header */}
                <header className="doctor-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logo Area */}
                    <div
                        className="header-logo"
                        onClick={() => navigate('/doctor/dashboard')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginLeft: '1rem' }}
                    >
                        <div style={{
                            width: '32px', height: '32px',
                            background: '#0f766e',
                            borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold'
                        }}>D</div>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                            DOC AI <span style={{ fontWeight: '400', color: '#64748b' }}>Pro</span>
                        </span>
                    </div>

                    <div className="header-title-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button style={{ background: 'none', border: 'none', position: 'relative', cursor: 'pointer', color: '#64748b' }}>
                                <Bell size={20} />
                                <span style={{ position: 'absolute', top: -2, right: -2, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
                            </button>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', marginTop: '64px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ to, icon, label, isCritical }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''} ${isCritical ? 'critical' : ''}`
        }
    >
        {icon}
        {label}
    </NavLink>
);

export default DoctorLayout;
