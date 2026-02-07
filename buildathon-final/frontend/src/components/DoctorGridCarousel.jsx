import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DoctorCard from './DoctorCard';
import { motion, AnimatePresence } from 'framer-motion';
import './DoctorGridCarousel.css';

const DoctorGridCarousel = ({ title, doctors, onBookAppointment, showAction = true }) => {
    const scrollRef = React.useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -300 : 300;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Mouse Drag Logic
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast multiplier
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="doctor-carousel-wrapper">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ fontSize: '1.2rem', color: '#333', margin: 0 }}>{title}</h3>

                {/* Desktop Navigation Controls (Hidden on mobile usually via CSS, but good to have) */}
                <div className="carousel-controls" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => scroll('left')}
                        style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '1px solid #ddd', backgroundColor: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#666'
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '1px solid #ddd', backgroundColor: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#666'
                        }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="doctor-scroll-container"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem', // Space for scrollbar or shadow
                    scrollSnapType: isDragging ? 'none' : 'x mandatory', // Disable snap while dragging
                    cursor: isDragging ? 'grabbing' : 'grab',
                    WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
                    scrollbarWidth: 'none', // Hide scrollbar Firefox
                    msOverflowStyle: 'none', // Hide scrollbar IE
                }}
            >
                {doctors.map((doctor, index) => (
                    <motion.div
                        key={doctor.id || index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            minWidth: '280px', // Desktop width
                            scrollSnapAlign: 'start',
                            flexShrink: 0,
                            pointerEvents: isDragging ? 'none' : 'auto' // Prevent clicking while dragging
                        }}
                        className="doctor-card-wrapper"
                    >
                        <DoctorCard
                            {...doctor}
                            onBookAppointment={onBookAppointment}
                            showAction={showAction}
                        />
                    </motion.div>
                ))}
            </div>
            <style>{`
                .doctor-scroll-container::-webkit-scrollbar {
                    display: none;
                }
                @media (max-width: 480px) {
                    .doctor-card-wrapper {
                        min-width: 85vw !important; /* almost full width on mobile for focus */
                    }
                    .carousel-controls {
                        display: none !important; /* Hide arrows on mobile */
                    }
                }
            `}</style>
        </div>
    );
};

export default DoctorGridCarousel;
