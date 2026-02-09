import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireProfile = true, requiredRole = null }) => {
    const { currentUser, selectedProfile } = useAuth();
    const location = useLocation();

    // 1. Authentication Check (Must be logged in)
    if (!currentUser) {
        // Smart Redirect: If trying to access doctor portal, send to Doctor Login
        if (location.pathname.startsWith('/doctor')) {
            return <Navigate to="/doctor/login" />;
        }
        return <Navigate to="/login" />;
    }

    // 2. Role Check
    // Check 'role' from 'users' collection (set by init_v1_db.py)
    const userRole = currentUser.role || 'patient';

    if (requiredRole && userRole !== requiredRole) {
        if (requiredRole === 'doctor') {
            // User is Patient, trying to access Doctor
            return <Navigate to="/patient" replace />;
        }
        if (requiredRole === 'patient') {
            // User is Doctor, trying to access Patient
            return <Navigate to="/doctor/dashboard" replace />;
        }
    }

    // 3. Profile Check (Only for Patients)
    // Doctors do not need "Patient Profiles"
    if (userRole === 'patient' && requireProfile && !selectedProfile) {
        console.log("ProtectedRoute: No profile selected, redirecting to /profiles");
        return <Navigate to="/profiles" />;
    }

    return children;
};

export default ProtectedRoute;
