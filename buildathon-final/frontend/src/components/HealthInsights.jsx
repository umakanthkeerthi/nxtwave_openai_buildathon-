import React from 'react';
import { Moon, Zap, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import './HomeComponents.css'; // Import shared styles

const HealthInsights = () => {
    const insights = [
        {
            icon: <Moon size={20} />,
            label: "Sleep Trend",
            value: "7h 30m",
            trend: "+12%",
            trendUp: true,
            color: "#3b82f6", // Blue
            bg: "#eff6ff",
            badge: null
        },
        {
            icon: <Zap size={20} />,
            label: "Stress Level",
            value: "Low",
            trend: "-5%",
            trendUp: false,
            color: "#f97316", // Orange
            bg: "#fff7ed",
            badge: null
        },
        {
            icon: <Activity size={20} />,
            label: "Activity",
            value: "8,432 steps",
            trend: null,
            trendUp: true,
            color: "#22c55e", // Green
            bg: "#f0fdf4",
            badge: "Daily Goal Met"
        }
    ];



    return (
        <div className="home-section-container">
            <h2 className="home-section-title">
                Health Insights
            </h2>

            <div className="insights-grid">
                {insights.map((item, index) => (
                    <InsightCard key={index} item={item} />
                ))}
            </div>
        </div>
    );
};

const InsightCard = ({ item }) => (
    <motion.div
        whileHover={{
            y: -5,
            boxShadow: `0 20px 40px -5px ${item.color}60`, // Vibrant colored glow
            borderColor: item.color
        }}
        style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            borderBottom: `4px solid ${item.color}`, // Colored bottom strip
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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

            {item.trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: item.trendUp ? '#10b981' : '#b45309',
                    backgroundColor: item.trendUp ? '#ecfdf5' : '#fffbeb',
                    padding: '4px 8px',
                    borderRadius: '20px'
                }}>
                    {item.trend}
                </div>
            )}

            {item.badge && (
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#475569',
                    backgroundColor: '#f1f5f9',
                    padding: '6px 12px',
                    borderRadius: '20px'
                }}>
                    {item.badge}
                </div>
            )}
        </div>

        <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                {item.label}
            </p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                {item.value}
            </h3>
        </div>
    </motion.div>
);

export default HealthInsights;
