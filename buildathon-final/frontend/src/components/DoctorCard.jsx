import React from 'react';
import { Clock } from 'lucide-react';
import './DoctorCard.css';

const DoctorCard = ({ id, name, degrees, specialty, experience, availableTime, image, onBookAppointment, showAction = true }) => {
    return (
        <div className="doctor-card-container">
            {/* Header: Image & Info */}
            <div className="doctor-card-header">
                <img
                    src={image || "https://via.placeholder.com/60"}
                    alt={name}
                    className="doctor-card-img"
                />
                <div>
                    <h4 className="doctor-card-name">{name}</h4>
                    <p className="doctor-card-degree">{degrees}</p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px'
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            border: '2px solid var(--color-primary)'
                        }}></span>
                        <span className="doctor-card-specialty">
                            {specialty}
                        </span>
                    </div>
                </div>
            </div>

            {/* Experience */}
            <div>
                <p style={{ fontSize: '0.9rem', fontWeight: '500', color: '#444' }}>
                    {experience} years experience
                </p>
            </div>

            {/* Availability */}
            <div style={{
                fontSize: '0.8rem',
                color: '#666',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <span>Available for</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: '#333' }}>
                    <Clock size={14} />
                    <span>Online Consultation {availableTime}</span>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                <button style={{
                    color: '#0066cc',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    padding: '0.6rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                }}>
                    View Details
                </button>
                {showAction && (
                    <button
                        className="btn-book-ppt"
                        onClick={onBookAppointment}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            marginTop: '0.5rem', // Adjusted margin to fit the new gap
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        Book Now
                    </button>
                )}
            </div>
        </div>
    );
};

export default DoctorCard;
