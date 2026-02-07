import React from 'react';
import DoctorDirectory from './DoctorDirectory';
import MyAppointments from './MyAppointments';
import './ConsultDoctor.css';

const ConsultDoctor = ({ view }) => {
    return (
        <div className="consult-doctor-page">
            {view === 'doctors' && <DoctorDirectory />}
            {view === 'appointments' && <MyAppointments />}
        </div>
    );
};

export default ConsultDoctor;
