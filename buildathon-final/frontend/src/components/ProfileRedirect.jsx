import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileRedirect = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.role === 'doctor') {
        return <Navigate to="/doctor/profile" replace />;
    }

    // Default to patient home or profile setup
    return <Navigate to="/patient" replace />;
};

export default ProfileRedirect;
