import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './SymptomEvaluator.css';

const SymptomEvaluator = ({ variant = 'home', blinkTrigger }) => {
    const { t } = useTranslation();
    const [language, setLanguage] = useState('Auto-detect');
    const [input, setInput] = useState('');
    const navigate = useNavigate();

    const handleStartChat = () => {
        if (!input.trim()) return;
        // Navigate to the full chat interface with the initial input and language
        navigate('/patient/clinical-chat', { state: { initialInput: input, language: language } });
    };

    // Animation control to trigger from prop
    const blinkVariants = {
        blink: {
            opacity: [1, 0.5, 1, 0.5, 1, 0.5, 1],
            transition: { duration: 0.8, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
        },
        idle: { opacity: 1 }
    };

    return (
        <div className={`symptom-evaluator-container ${variant}`}>
            {variant === 'home' && (
                <h2 className="symptom-title">
                    {t('symptom_evaluator.greeting', { name: 'Karthik' })} <br />
                    <span className="symptom-subtitle">
                        {t('symptom_evaluator.subtitle')}
                    </span>
                </h2>
            )}

            <motion.div
                className="symptom-card"
                variants={blinkVariants}
                animate={blinkTrigger ? "blink" : "idle"}
                key={blinkTrigger}
            >
                <div className="symptom-header">
                    <h3 className="symptom-header-title">{t('symptom_evaluator.title')}</h3>

                    <div className="language-selector-wrapper">
                        <span className="language-label">{t('symptom_evaluator.select_language')}</span>
                        <select
                            className="language-select-input"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option>{t('symptom_evaluator.languages.auto')}</option>
                            <option>{t('symptom_evaluator.languages.hindi')}</option>
                            <option>{t('symptom_evaluator.languages.tamil')}</option>
                            <option>{t('symptom_evaluator.languages.telugu')}</option>
                            <option>{t('symptom_evaluator.languages.kannada')}</option>
                            <option>{t('symptom_evaluator.languages.malayalam')}</option>
                        </select>
                    </div>
                </div>

                <div className="symptom-input-group">
                    <button className="mic-btn">
                        <Mic size={22} />
                    </button>

                    <div className="text-input-wrapper">
                        <input
                            className="text-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
                            placeholder={t('symptom_evaluator.placeholder')}
                        />
                    </div>

                    <button
                        className="send-btn"
                        onClick={handleStartChat}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SymptomEvaluator;
