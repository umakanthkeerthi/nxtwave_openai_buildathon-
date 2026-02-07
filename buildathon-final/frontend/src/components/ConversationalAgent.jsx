import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Sparkles, Stethoscope, FileText, Pill, Thermometer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConversationalAgent = () => {
    const [input, setInput] = useState('');
    const navigate = useNavigate();

    const handleAction = (text) => {
        navigate('/patient/clinical-chat', { state: { initialInput: text } });
    };

    const handleSend = () => {
        if (input.trim()) handleAction(input);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
                background: 'white',
                borderRadius: '32px',
                padding: '4rem 3rem', // Massive padding top/bottom
                minHeight: '350px', // Very tall container
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.08)', // Deeper shadow
                marginBottom: '2rem',
                border: '1px solid rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
        >
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center' }}>
                <div style={{
                    width: '64px', height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                }}>
                    <Sparkles size={32} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>How can I help you today?</h3>
                    <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '1rem' }}>
                        I can analyze symptoms, review reports, or track medications.
                    </p>
                </div>
            </div>

            {/* Input Area */}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                borderRadius: '18px',
                border: '2px solid #0f766e', // Teal highlight from HealthHero
                padding: '0.8rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 15px rgba(15, 118, 110, 0.15)', // Teal glow
                transition: 'all 0.2s'
            }}>
                <button style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <Mic size={20} />
                </button>
                <input
                    type="text"
                    placeholder="Describe your symptoms or ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1rem',
                        color: '#374151',
                        padding: '8px'
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        padding: '12px', // Slightly larger touch area
                        background: input.trim() ? '#0f766e' : '#ccfbf1', // Teal / Light Teal
                        color: input.trim() ? 'white' : '#0f766e', // White / Teal
                        border: 'none',
                        borderRadius: '14px',
                        cursor: input.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Quick Action Chips */}
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <ActionChip icon={<Thermometer size={16} />} label="I have a fever" onClick={() => handleAction("I have a fever")} color="orange" />
                <ActionChip icon={<Stethoscope size={16} />} label="Chest pain" onClick={() => handleAction("I have chest pain")} color="red" />
                <ActionChip icon={<FileText size={16} />} label="Explain report" onClick={() => handleAction("Explain my latest blood report")} color="blue" />
                <ActionChip icon={<Pill size={16} />} label="Medication info" onClick={() => handleAction("Information about my current medications")} color="teal" />
            </div>
        </motion.div>
    );
};

const ActionChip = ({ icon, label, onClick, color }) => {
    const colors = {
        orange: { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
        red: { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' },
        blue: { bg: '#eff6ff', text: '#2563eb', border: '#dbeafe' },
        teal: { bg: '#f0fdfa', text: '#0d9488', border: '#ccfbf1' }
    };

    const style = colors[color] || colors.blue;

    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 1rem',
                borderRadius: '50px',
                background: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
            }}
        >
            {icon}
            {label}
        </motion.button>
    );
};

export default ConversationalAgent;
