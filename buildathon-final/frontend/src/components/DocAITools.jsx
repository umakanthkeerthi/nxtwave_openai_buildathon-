import React from 'react';
import { FileText, Stethoscope, Activity, Mic, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './HomeComponents.css'; // Shared styles

const DocAITools = () => {
    const navigate = useNavigate();

    const tools = [
        {
            icon: <FileText size={20} />,
            label: "Prescription Analyzer",
            sub: "Upload & Understand",
            color: "#8b5cf6", // Violet
            bg: "#f3e8ff",
            path: '/patient/prescription-analyzer'
        },
        {
            icon: <Activity size={20} />,
            label: "Lab Report Analyzer",
            sub: "Analyze medical lab reports for key metrics and abnormalities.",
            color: "#06b6d4", // Cyan
            bg: "#cffafe",
            path: '/patient/lab-report-analyzer'
        },
        {
            icon: <Utensils size={20} />,
            label: "Nutrition Analyzer",
            sub: "AI Diet & Wellness Plan",
            color: "#84cc16", // Lime
            bg: "#ecfccb",
            path: '/patient/nutrition'
        }
    ];

    return (
        <div className="home-section-container">
            <h2 className="home-section-title">
                DocAI Tools
            </h2>
            <div className="insights-grid">
                {tools.map((item, index) => (
                    <AiToolCard key={index} item={item} navigate={navigate} />
                ))}
            </div>
        </div>
    );
};

const AiToolCard = ({ item, navigate }) => (
    <motion.div
        whileHover={{
            y: -5,
            boxShadow: `0 20px 40px -5px ${item.color}60`,
            borderColor: item.color
        }}
        onClick={() => item.path && navigate(item.path)}
        style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            borderBottom: `4px solid ${item.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{
                backgroundColor: item.bg,
                color: item.color,
                padding: '12px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {item.icon}
            </div>

            <div style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: item.color,
                backgroundColor: item.bg,
                padding: '4px 8px',
                borderRadius: '20px',
                textTransform: 'uppercase'
            }}>
                AI Powered
            </div>
        </div>

        <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                {item.label}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                {item.sub}
            </p>
        </div>
    </motion.div>
);

export default DocAITools;
