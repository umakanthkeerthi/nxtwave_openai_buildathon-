import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ConsultDoctor from './pages/ConsultDoctor';
import DoctorDirectory from './pages/DoctorDirectory';

import MedicalFiles from './pages/MedicalFiles';
import Pharmacy from './pages/Pharmacy';
import ClinicalChat from './pages/ClinicalChat';
import PatientSummary from './pages/PatientSummary';
import EmergencyPage from './pages/EmergencyPage';
import NotFound from './pages/NotFound';
import Wellness from './pages/Wellness';
import PrescriptionAnalyzer from './pages/PrescriptionAnalyzer';
import LabReportAnalyzer from './pages/LabReportAnalyzer';
import NutritionAnalyzer from './pages/NutritionAnalyzer';

// Auth Modules
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ProfileRedirect from './components/ProfileRedirect';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import ProfileSelection from './pages/ProfileSelection';



// Doctor Module
import DoctorLayout from './doctor/DoctorLayout';
import DoctorDashboard from './doctor/DoctorDashboard';
import DoctorPatients from './doctor/DoctorPatients';
import PatientDetail from './doctor/PatientDetail';
import DoctorEmergency from './doctor/DoctorEmergency';
import DoctorScheduledAppointments from './doctor/DoctorScheduledAppointments';
import DoctorProfile from './doctor/DoctorProfile';
import DoctorMessages from './doctor/DoctorMessages';
import DoctorReports from './doctor/DoctorReports';
import DoctorEmergencyDetail from './doctor/DoctorEmergencyDetail';
import DoctorEmergencyQueue from './doctor/DoctorEmergencyQueue';
import DoctorSlotManager from './doctor/DoctorSlotManager';
import DoctorLogin from './pages/DoctorLogin';

// Patient Layout Wrapper
const PatientLayout = () => {
    return (
        <>
            <Navbar />
            <main style={{ paddingTop: '80px' }}>
                <Outlet />
            </main>
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', width: '100%' }}>
                <Routes>
                    {/* PUBLIC ROUTES */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* PROFILE REDIRECT (Handle /profile 404) */}
                    <Route path="/profile" element={<ProfileRedirect />} />


                    {/* PROFILE SELECTION */}
                    <Route path="/profiles" element={
                        <ProtectedRoute requireProfile={false}>
                            <ProfileSelection />
                        </ProtectedRoute>
                    } />

                    {/* PROFILE SETUP (Authenticated but doesn't require profile yet) */}
                    <Route path="/profile-setup" element={
                        <ProtectedRoute requireProfile={false}>
                            <ProfileSetup />
                        </ProtectedRoute>
                    } />

                    {/* DOCTOR PUBLIC ROUTES */}
                    <Route path="/doctor/login" element={<DoctorLogin />} />

                    {/* DOCTOR PORTAL ROUTES (PROTECTED) */}
                    <Route path="/doctor" element={
                        <ProtectedRoute requiredRole="doctor">
                            <DoctorLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<DoctorDashboard />} />
                        <Route path="dashboard" element={<DoctorDashboard />} />
                        <Route path="scheduled-appointments" element={<DoctorScheduledAppointments />} />
                        <Route path="emergency" element={<DoctorEmergency />} />
                        <Route path="emergency/:id" element={<DoctorEmergencyDetail />} />
                        <Route path="emergency-queue" element={<DoctorEmergencyQueue />} />
                        <Route path="profile" element={<DoctorProfile />} />
                        <Route path="messages" element={<DoctorMessages />} />
                        <Route path="reports" element={<DoctorReports />} />
                        <Route path="patients" element={<DoctorPatients />} />
                        <Route path="my-slots" element={<DoctorSlotManager />} />
                        <Route path="patients/:id" element={<PatientDetail />} />
                    </Route>

                    {/* Redirect Root to Patient Home (Default User Flow) */}
                    <Route path="/" element={<Navigate to="/patient" replace />} />

                    {/* PATIENT PORTAL ROUTES (PROTECTED) */}
                    <Route path="/patient" element={
                        <ProtectedRoute requiredRole="patient">
                            <PatientLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Home />} />
                        <Route path="consult" element={<ConsultDoctor view="doctors" />} />
                        <Route path="consult/directory" element={<DoctorDirectory />} />
                        <Route path="consult/my-appointments" element={<ConsultDoctor view="appointments" />} />
                        <Route path="medical-files" element={<MedicalFiles />} />
                        <Route path="pharmacy" element={<Pharmacy />} />
                        <Route path="clinical-chat" element={<ClinicalChat />} />
                        <Route path="patient-summary" element={<PatientSummary />} />
                        <Route path="emergency" element={<EmergencyPage />} />
                        <Route path="wellness" element={<Wellness />} />
                        <Route path="prescription-analyzer" element={<PrescriptionAnalyzer />} />
                        <Route path="lab-report-analyzer" element={<LabReportAnalyzer />} />
                        <Route path="nutrition" element={<NutritionAnalyzer />} />
                    </Route>

                    {/* Handle unknown paths with explicit 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
        </AuthProvider>
    );
}

export default App;
