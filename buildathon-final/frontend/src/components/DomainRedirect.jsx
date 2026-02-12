import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * DomainRedirect
 * 
 * Handles strict redirection based on the subdomain.
 * - docai.doctor.toplabs.in -> /doctor/login
 * - docai.patient.toplabs.in -> /patient
 * - localhost -> /patient (Default)
 */
const DomainRedirect = () => {
    const host = window.location.hostname;

    console.log("DomainRedirect: Checking host:", host);

    // Doctor Domain Logic
    if (host.includes('doctor')) {
        return <Navigate to="/doctor/login" replace />;
    }

    // Default / Patient Logic
    return <Navigate to="/patient" replace />;
};

export default DomainRedirect;
