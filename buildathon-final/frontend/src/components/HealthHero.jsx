import React, { useState, useRef } from 'react';
import {
    Activity, Clock, FileText, Sparkles, Search, Send,
    Thermometer, Heart, Pill, FileBarChart, Mic, Lightbulb, ChevronLeft, ChevronRight,
    Loader, Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AudioConfirmationModal from './AudioConfirmationModal';

import './HealthHero.css';
import { useTranslation } from 'react-i18next';

const HealthHero = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const navigate = useNavigate();
    const { currentUser, selectedProfile } = useAuth();

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [showAudioModal, setShowAudioModal] = useState(false);
    const [audioText, setAudioText] = useState("");
    const [audioOriginalText, setAudioOriginalText] = useState("");
    const [audioDetectedLang, setAudioDetectedLang] = useState("");
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Safe Access to User Name using Selected Profile
    const firstName = selectedProfile?.fullName
        ? selectedProfile.fullName.split(' ')[0]
        : (currentUser?.displayName ? currentUser.displayName.split(' ')[0] : "User");

    const handleSearch = () => {
        if (!input.trim()) return;
        navigate('/patient/clinical-chat', { state: { initialInput: input } });
    };

    const handleChipClick = (text) => {
        navigate('/patient/clinical-chat', { state: { initialInput: text } });
    };

    // Audio Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                // Create URL
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                await processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const processAudio = async (audioBlob) => {
        setIsProcessingAudio(true);
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.wav");
            // Default to English hint for home page simple search
            formData.append("language_hint", "en");

            const response = await fetch(`${import.meta.env.VITE_API_URL}/process_audio`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.repaired_text || data.english_text) {
                setAudioText(data.english_text); // Fallback english
                setAudioOriginalText(data.repaired_text); // Native text
                setAudioDetectedLang(data.detected_language);
                setShowAudioModal(true);
            } else {
                alert("Could not transcribe audio. Please try again.");
            }
        } catch (error) {
            console.error("Audio processing error:", error);
            alert("Failed to process audio. Please check your connection.");
        }
        setIsProcessingAudio(false);
    };

    const handleConfirmAudio = (confirmedText) => {
        setShowAudioModal(false);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);

        // Navigate to Clinical Chat with the transcribed text
        navigate('/patient/clinical-chat', { state: { initialInput: confirmedText } });
    };

    return (
        <>
            <div className="health-hero-container">
                <div className="hero-header">
                    <div className="hero-header-content">
                        <div className="hero-main-content">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="hero-greeting">
                                    {t('health_hero.greeting', { name: firstName })} <span style={{ fontSize: '1.5rem' }}>👋</span>
                                </h1>
                                <p className="hero-subtitle">
                                    {t('health_hero.subtitle')}
                                </p>
                            </motion.div>

                            <div className="hero-stats-row">
                                <GlassCard
                                    icon={<Heart size={20} />}
                                    title={t('health_hero.stats.heart_rate')}
                                    value={t('health_hero.stats.heart_rate_val')}
                                    delay={0.1}
                                />
                                <GlassCard
                                    icon={<Clock size={20} />}
                                    title={t('health_hero.stats.last_check')}
                                    value={t('health_hero.stats.last_check_val')}
                                    delay={0.2}
                                />
                                <GlassCard
                                    icon={<FileText size={20} />}
                                    title={t('health_hero.stats.pending_reports')}
                                    value={t('health_hero.stats.pending_reports_val')}
                                    delay={0.3}
                                    isAlert
                                />
                            </div>
                        </div>

                        <div className="hero-side-content">
                            <DidYouKnowCard />
                        </div>
                    </div>
                </div>
            </div>

            <div className="hero-action-card-wrapper">
                <motion.div
                    className="hero-action-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <div className="action-header">
                        <div className="ai-avatar">
                            <Sparkles size={24} />
                        </div>
                        <div className="action-title">
                            <h3>{t('health_hero.action_card.title')}</h3>
                            <p>{t('health_hero.action_card.subtitle')}</p>
                        </div>
                    </div>

                    <div className="search-bar-container">
                        <button
                            className={`mic-btn ${isRecording ? 'recording' : ''}`}
                            onClick={toggleRecording}
                            style={{
                                backgroundColor: isRecording ? '#ef4444' : 'var(--bg-secondary)',
                                color: isRecording ? 'white' : 'var(--text-secondary)'
                            }}
                        >
                            {isProcessingAudio ? <Loader className="spin" size={20} /> : (isRecording ? <Square size={20} fill="white" /> : <Mic size={20} />)}
                        </button>

                        <input
                            className="hero-search-input"
                            placeholder={isRecording ? t('health_hero.action_card.listening') : t('health_hero.action_card.search_placeholder')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            disabled={isRecording || isProcessingAudio}
                        />

                        <button className="send-btn-solid" onClick={handleSearch}>
                            <Send size={20} />
                        </button>
                    </div>

                    <div className="quick-chips">
                        <Chip
                            icon={<Thermometer size={16} />}
                            label={t('health_hero.chips.fever')}
                            type="fever"
                            onClick={() => handleChipClick(t('health_hero.chip_actions.fever'))}
                        />
                        <Chip
                            icon={<Heart size={16} />}
                            label={t('health_hero.chips.chest_pain')}
                            type="chest"
                            onClick={() => handleChipClick(t('health_hero.chip_actions.chest'))}
                        />
                        <Chip
                            icon={<FileBarChart size={16} />}
                            label={t('health_hero.chips.explain_report')}
                            type="report"
                            onClick={() => handleChipClick(t('health_hero.chip_actions.report'))}
                        />
                        <Chip
                            icon={<Pill size={16} />}
                            label={t('health_hero.chips.med_info')}
                            type="meds"
                            onClick={() => handleChipClick(t('health_hero.chip_actions.meds'))}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Audio Confirmation Modal */}
            <AudioConfirmationModal
                isOpen={showAudioModal}
                text={audioText}
                originalText={audioOriginalText}
                detectedLanguage={audioDetectedLang}
                audioUrl={audioUrl}
                onConfirm={handleConfirmAudio}
                onCancel={() => setShowAudioModal(false)}
            />
        </>
    );
};

const GlassCard = ({ icon, title, value, isAlert, delay, isDark }) => (
    <motion.div
        className="glass-stat-card"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay, duration: 0.4 }}
    >
        <div className="stat-icon-wrapper" style={{ background: isAlert ? 'rgba(254, 202, 202, 0.3)' : 'rgba(255, 255, 255, 0.2)' }}>
            {icon}
        </div>
        <div className="stat-details">
            <h4 style={{ color: isDark ? '#64748b' : 'white' }}>{title}</h4>
            <p style={{ color: isDark ? '#0f172a' : 'white' }}>{value}</p>
        </div>
    </motion.div>
);

const Chip = ({ icon, label, type, onClick }) => (
    <div className={`chip ${type} `} onClick={onClick}>
        {icon}
        {label}
    </div>
);

const DidYouKnowCard = () => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const facts = t('health_hero.did_you_know.facts', { returnObjects: true });

    const nextFact = () => {
        setCurrentIndex((prev) => (prev + 1) % facts.length);
    };

    const prevFact = () => {
        setCurrentIndex((prev) => (prev - 1 + facts.length) % facts.length);
    };

    return (
        <motion.div
            className="did-you-know-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
        >
            <div className="dyk-header">
                <div className="dyk-title">
                    <Lightbulb size={18} className="dyk-icon" />
                    <span>{t('health_hero.did_you_know.wellness')}</span>
                </div>
                <div className="dyk-nav">
                    <ChevronLeft size={16} onClick={prevFact} style={{ cursor: 'pointer' }} />
                    <ChevronRight size={16} onClick={nextFact} style={{ cursor: 'pointer' }} />
                </div>
            </div>
            <h4 className="dyk-heading">{t('health_hero.did_you_know.title')}</h4>
            <div style={{ minHeight: '60px' }}>
                <p className="dyk-text">
                    {facts[currentIndex] || "Stay Healthy!"}
                </p>
            </div>
            <div className="dyk-footer">
                <button className="dyk-helpful">
                    <Heart size={14} /> {t('health_hero.did_you_know.helpful')}
                </button>
                <div className="dyk-dots">
                    {facts.map((_, index) => (
                        <div
                            key={index}
                            className={`dot ${index === currentIndex ? 'active' : ''}`}
                        ></div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default HealthHero;
