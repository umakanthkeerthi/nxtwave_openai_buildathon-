import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

const ComingSoonModal = ({ isOpen, onClose, featureName }) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 3000,
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '90%',
                            maxWidth: '400px',
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            padding: '2rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '1rem',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            padding: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: '#3b82f6',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Info size={32} />
                        </div>

                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                            {t('coming_soon.title')}
                        </h3>

                        <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.6', fontSize: '1.05rem' }}>
                            {featureName ? `${featureName} ` : ''}{t('coming_soon.message')}
                        </p>

                        <button
                            onClick={onClose}
                            style={{
                                marginTop: '1.5rem',
                                padding: '0.8rem 2rem',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%',
                                fontSize: '1rem',
                                transition: 'transform 0.2s, background-color 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {t('coming_soon.ok')}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ComingSoonModal;
