import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName, fileType }) => {
    if (!isOpen) return null;

    // Helper to determine render type
    const isPDF = fileType?.includes('pdf') || (fileUrl?.startsWith('data:application/pdf'));
    const isImage = fileType?.includes('image') || (fileUrl?.startsWith('data:image'));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="modal-overlay"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            zIndex: 1050,
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="modal-content"
                        style={{
                            position: 'fixed',
                            top: '5%',
                            left: '5%',
                            right: '5%',
                            bottom: '5%',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            zIndex: 1051,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            maxWidth: '1200px',
                            margin: '0 auto',
                            maxHeight: '90vh'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: '600' }}>
                                {fileName || 'View File'}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <a
                                    href={fileUrl}
                                    download={fileName || "download"}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        textDecoration: 'none',
                                        color: '#0f766e',
                                        fontWeight: '500',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <Download size={18} /> Download
                                </a>
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                            {isImage ? (
                                <img
                                    src={fileUrl}
                                    alt="Medical Record"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                />
                            ) : (
                                <iframe
                                    src={fileUrl}
                                    title="PDF Viewer"
                                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', backgroundColor: 'white' }}
                                />
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FileViewerModal;
