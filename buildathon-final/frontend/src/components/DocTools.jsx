import React from 'react';
import { Calendar, FileText, Video, Bell, Pill, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './HomeComponents.css'; // Import shared styles

const DocTools = () => {
    const navigate = useNavigate();

    const tools = [
        {
            icon: <Calendar size={20} />,
            label: "Appointments",
            sub: "Next: Tomorrow, 10:30 AM",
            color: "#3b82f6", // Blue
            bg: "#eff6ff",
            path: '/consult/my-appointments'
        },
        {
            icon: <FileText size={20} />,
            label: "Reports",
            sub: "1 new report uploaded",
            color: "#8b5cf6", // Purple
            bg: "#f5f3ff",
            path: '/health-records' // Assuming path
        },
        {
            icon: <Pill size={20} />,
            label: "Medications",
            sub: "Take Paracetamol at 9 PM",
            color: "#10b981", // Green
            bg: "#ecfdf5",
            path: '/medicines' // Assuming path
        },
        {
            icon: <Video size={20} />,
            label: "Consult Doctor",
            sub: "12 Doctors online now",
            color: "#6366f1", // Indigo
            bg: "#e0e7ff",
            path: '/consult'
        }
    ];

    return (
        <div className="home-section-container" style={{ margin: '2rem auto 4rem' }}>
            <div className="doctools-grid">
                {tools.map((tool, index) => (
                    <ToolCard key={index} tool={tool} navigate={navigate} />
                ))}
            </div>
        </div>
    );
};

const ToolCard = ({ tool, navigate }) => (
    <motion.div
        onClick={() => tool.path && navigate(tool.path)}
        whileHover={{
            y: -5,
            boxShadow: `0 20px 40px -5px ${tool.color}60`, // Brighter glow (37% opacity)
            borderColor: tool.color // Highlight border fully on hover
        }}
        whileTap={{ scale: 0.98 }}
        style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            border: '1px solid #f1f5f9',
            borderBottom: `4px solid ${tool.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: '140px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.3s ease'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{
                backgroundColor: tool.bg,
                color: tool.color,
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {tool.icon}
            </div>
            {/* Chevron icon placeholder or actual icon if needed, using a simple arrow character for now or could import ChevronRight */}
            <div style={{ color: tool.color }}>
                <ChevronRight size={20} />
            </div>
        </div>

        <div>
            <h3 style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b'
            }}>
                {tool.label}
            </h3>
            <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#64748b',
                lineHeight: '1.4'
            }}>
                {tool.sub}
            </p>
        </div>
    </motion.div>
);

export default DocTools;
