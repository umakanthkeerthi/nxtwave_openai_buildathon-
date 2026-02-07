import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Mic, AlertCircle } from 'lucide-react';

const AudioConfirmationModal = ({ isOpen, text, originalText, detectedLanguage, audioUrl, onConfirm, onCancel }) => {
    const [editableText, setEditableText] = useState(text);

    useEffect(() => {
        setEditableText(originalText || text || "");
    }, [text, originalText, isOpen]);

    const handleConfirm = () => {
        onConfirm(editableText);
    };

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
                        zIndex: 2000,
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '90%',
                            maxWidth: '500px',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fcd34d',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            // Removed fixed positioning properties that caused conflict
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div style={{ marginTop: '2px' }}>
                                <AlertCircle size={20} color="#d97706" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#92400e', fontSize: '1.1rem', fontWeight: '600' }}>
                                    Verify Your Message (AI Repaired)
                                </h3>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#b45309', fontSize: '0.9rem' }}>
                                    Target Language: <span style={{ fontWeight: '600' }}>{detectedLanguage || "Detected"} (Selected)</span>
                                </p>
                            </div>
                        </div>

                        {/* Audio Player */}
                        {audioUrl && (
                            <div style={{
                                backgroundColor: '#fef3c7',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid #fde68a'
                            }}>
                                <audio controls src={audioUrl} style={{ width: '100%', height: '36px' }} />
                            </div>
                        )}

                        {/* Text Area */}
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={editableText}
                                onChange={(e) => setEditableText(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #fcd34d',
                                    fontSize: '1.1rem',
                                    lineHeight: '1.6',
                                    color: '#1e293b',
                                    resize: 'none',
                                    outline: 'none',
                                    backgroundColor: 'white',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={onCancel}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#78350f',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirm}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#0f766e',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 6px rgba(15, 118, 110, 0.2)'
                                }}
                            >
                                <Check size={18} /> Confirm & Search
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AudioConfirmationModal;
