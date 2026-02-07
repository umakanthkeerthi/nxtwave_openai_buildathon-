import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Calendar, User, Tag, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadRecordModal = ({ isOpen, onClose, onUpload }) => {
    const [formData, setFormData] = useState({
        type: 'General',
        title: '',
        doctor: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset Form when Modal Opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'General',
                title: '',
                doctor: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                fileContent: null,
                fileName: '',
                fileType: ''
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onUpload(formData);
        setIsSubmitting(false);
        onClose();
    };

    const recordTypes = [
        { value: 'General', label: 'General Record' },
        { value: 'Prescription', label: 'Prescription' },
        { value: 'Lab Report', label: 'Lab Report' },
        { value: 'X-Ray', label: 'X-Ray / Scan' },
        { value: 'Certificate', label: 'Certificate' }
    ];

    return (
        <div className="modal-overlay">
            <motion.div
                className="modal-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}
            >
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>Upload Medical Record</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} color="#666" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Custom Dropdown for Record Type */}
                    <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#444' }}>Record Type</label>
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            {/* Trigger */}
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 0.8rem 0.8rem 2.8rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${isDropdownOpen ? 'var(--color-primary)' : '#ddd'}`,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'border-color 0.2s'
                                }}
                            >
                                <Tag size={18} style={{ position: 'absolute', left: '12px', color: isDropdownOpen ? 'var(--color-primary)' : '#888' }} />
                                <span style={{ color: '#333' }}>{recordTypes.find(t => t.value === formData.type)?.label}</span>
                                <ChevronDown size={18} color="#888" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </div>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            position: 'absolute',
                                            top: '110%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            border: '1px solid #eee',
                                            overflow: 'hidden',
                                            zIndex: 20
                                        }}
                                    >
                                        {recordTypes.map((type) => (
                                            <div
                                                key={type.value}
                                                onClick={() => {
                                                    setFormData({ ...formData, type: type.value });
                                                    setIsDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: '0.8rem 1rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: formData.type === type.value ? 'rgba(7, 118, 89, 0.08)' : 'white',
                                                    color: formData.type === type.value ? 'var(--color-primary)' : '#444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.95rem',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (formData.type !== type.value) e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (formData.type !== type.value) e.currentTarget.style.backgroundColor = 'white';
                                                }}
                                            >
                                                {type.label}
                                                {formData.type === type.value && <Check size={16} />}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#444' }}>Title / Diagnosis</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                            <input
                                type="text"
                                required
                                placeholder="E.g. Viral Fever Checkup"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    </div>

                    {/* Doctor / Issuer */}
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#444' }}>Doctor / Lab Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                            <input
                                type="text"
                                required
                                placeholder="E.g. Dr. Rajesh Gupta"
                                value={formData.doctor}
                                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#444' }}>Date</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            id="file-upload"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    // Validating file size (limit to 1MB for MVP Firestore storage)
                                    if (file.size > 1024 * 1024) {
                                        alert("File size exceeds 1MB limit for Hackathon MVP.");
                                        return;
                                    }

                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setFormData({
                                            ...formData,
                                            fileName: file.name,
                                            fileType: file.type,
                                            fileContent: reader.result // Base64 string
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        <label
                            htmlFor="file-upload"
                            style={{
                                border: `2px dashed ${formData.fileContent ? 'var(--color-primary)' : '#ddd'}`,
                                borderRadius: '12px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                color: formData.fileContent ? 'var(--color-primary)' : '#666',
                                marginTop: '0.5rem',
                                cursor: 'pointer',
                                display: 'block',
                                transition: 'all 0.2s',
                                backgroundColor: formData.fileContent ? 'rgba(7, 118, 89, 0.05)' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.fileContent ? 'rgba(7, 118, 89, 0.05)' : 'transparent'}
                        >
                            <Upload size={32} color={formData.fileContent ? "var(--color-primary)" : "#aaa"} style={{ marginBottom: '0.5rem' }} />
                            {formData.fileName ? (
                                <div>
                                    <p style={{ fontWeight: '600' }}>{formData.fileName}</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Click to replace file</p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontWeight: '500' }}>Click to Upload File</p>
                                    <p style={{ fontSize: '0.8rem', color: '#999' }}>PNG, JPG, PDF (Max 1MB)</p>
                                </div>
                            )}
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {isSubmitting ? 'Uploading...' : 'Save Record'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default UploadRecordModal;
