import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireProfile = true, requiredRole = null }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    // 1. Authentication Check (Must be logged in)
    if (!currentUser) {
        // Smart Redirect: If trying to access doctor portal, send to Doctor Login
        if (location.pathname.startsWith('/doctor')) {
            return <Navigate to="/doctor/login" />;
        }
        return <Navigate to="/login" />;
    }

    // 2. Profile Check (Must have profile setup)
    if (requireProfile && currentUser.profile === null) {
        return <Navigate to="/profile-setup" />;
    }

    // 3. Role Check (RESTORED)
    const userRole = currentUser.profile?.role || 'patient'; // Default to patient if missing
    if (requiredRole && userRole !== requiredRole) {
        if (requiredRole === 'doctor') {
            return <Navigate to="/patient" replace />;
        }
        // If a Doctor tries to access Patient pages, send them to their dashboard
        if (requiredRole === 'patient') {
            return <Navigate to="/doctor/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
