import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, Pill, Video, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SmartModules = () => {
    const navigate = useNavigate();

    const modules = [
        {
            title: "Appointments",
            status: "Next: Tomorrow, 10:30 AM",
            icon: <Calendar size={22} />,
            color: "blue",
            link: "/consult/my-appointments"
        },
        {
            title: "Reports",
            status: "1 new report uploaded",
            icon: <FileText size={22} />,
            color: "purple",
            link: "/medical-files"
        },
        {
            title: "Medications",
            status: "Take Paracetamol at 9 PM",
            icon: <Pill size={22} />,
            color: "emerald",
            link: "/pharmacy"
        },
        {
            title: "Consult Doctor",
            status: "12 Doctors online now",
            icon: <Video size={22} />,
            color: "indigo",
            link: "/consult"
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.4 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}
        >
            {modules.map((mod, idx) => (
                <ModuleCard key={idx} data={mod} variants={item} navigate={navigate} />
            ))}
        </motion.div>
    );
};

const ModuleCard = ({ data, variants, navigate }) => {
    const colors = {
        blue: { bg: '#eff6ff', iconBg: '#dbeafe', iconColor: '#2563eb' },
        purple: { bg: '#fbf7ff', iconBg: '#f3e8ff', iconColor: '#9333ea' },
        emerald: { bg: '#f0fdf9', iconBg: '#ccfbf1', iconColor: '#059669' },
        indigo: { bg: '#eef2ff', iconBg: '#e0e7ff', iconColor: '#4f46e5' }
    };

    const theme = colors[data.color];

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -5, boxShadow: "0 12px 24px -8px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(data.link)}
            style={{
                background: 'white',
                borderRadius: '20px',
                padding: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '160px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 4px 6px -2px rgba(0, 0, 0, 0.03)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '14px',
                    background: theme.iconBg,
                    color: theme.iconColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {data.icon}
                </div>
                <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: '#f9fafb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af'
                }}>
                    <ChevronRight size={18} />
                </div>
            </div>

            <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#1f2937' }}>{data.title}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>{data.status}</p>
            </div>

            {/* Hover Gradient Overlay */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                background: theme.iconColor, opacity: 0.6
            }} />
        </motion.div>
    );
};

export default SmartModules;
