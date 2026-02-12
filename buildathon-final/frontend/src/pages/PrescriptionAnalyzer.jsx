import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './PrescriptionAnalyzer.css';

const PrescriptionAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setAnalyzing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8003/analyze_prescription', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to analyze prescription");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="pa-container">
            <div className="pa-wrapper">
                {/* Header */}
                <div className="pa-header">
                    <h1 className="pa-title">Prescription Analyzer</h1>
                    <p className="pa-subtitle">Upload a prescription to get an AI-powered summary of medicines and instructions.</p>
                </div>

                <div className="pa-grid">
                    {/* Upload Section */}
                    <div>
                        <div className="pa-card">
                            <div className="pa-upload-area">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="pa-file-input"
                                />
                                <div className="pa-upload-content">
                                    <div className="pa-upload-icon-bg">
                                        <Upload size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#334155' }}>Click to upload or drag and drop</p>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>JPG, PNG, GIF (max. 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            {preview && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Preview:</p>
                                    <img src={preview} alt="Prescription Preview" className="pa-preview-img" />

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                        className="pa-btn-primary"
                                    >
                                        {analyzing ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={20} />
                                                Analyze Prescription
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Results Section */}
                    <div>
                        {error && (
                            <div className="pa-error-box">
                                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <p style={{ fontWeight: 600 }}>Analysis Failed</p>
                                    <p style={{ fontSize: '0.875rem' }}>{error}</p>
                                </div>
                            </div>
                        )}

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                            >
                                <div className="pa-result-header">
                                    <Check size={20} color="#22c55e" />
                                    <h2 className="pa-result-title">Analysis Complete</h2>
                                </div>

                                <div className="pa-result-content">
                                    {/* Patient/Doctor Info */}
                                    <div className="pa-info-grid">
                                        <div className="pa-info-box">
                                            <p className="pa-label-xs">Doctor</p>
                                            <p className="pa-value">{result.doctor_name || "Not detected"}</p>
                                        </div>
                                        <div className="pa-info-box">
                                            <p className="pa-label-xs">Date</p>
                                            <p className="pa-value">{result.date || "Not detected"}</p>
                                        </div>
                                    </div>

                                    {/* Medicines */}
                                    <div>
                                        <h3 className="pa-section-title">
                                            <span className="pa-dot" style={{ backgroundColor: '#3b82f6' }}></span>
                                            Medicines Identified
                                        </h3>
                                        <div>
                                            {result.medicines && result.medicines.length > 0 ? (
                                                result.medicines.map((med, idx) => (
                                                    <div key={idx} className="pa-med-card">
                                                        <div className="pa-med-header">
                                                            <h4 className="pa-med-name">{med.name}</h4>
                                                            <span className="pa-med-dosage">
                                                                {med.dosage}
                                                            </span>
                                                        </div>
                                                        <div className="pa-med-chips">
                                                            <div className="pa-chip">
                                                                <span style={{ color: '#94a3b8' }}>Freq:</span>
                                                                {med.frequency}
                                                            </div>
                                                            <div className="pa-chip">
                                                                <span style={{ color: '#94a3b8' }}>Dur:</span>
                                                                {med.duration}
                                                            </div>
                                                        </div>
                                                        {med.instructions && (
                                                            <p className="pa-med-instruction">
                                                                ℹ️ {med.instructions}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No medicines clearly identified.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lab Tests */}
                                    {result.lab_tests_recommended && result.lab_tests_recommended.length > 0 && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <h3 className="pa-section-title">
                                                <span className="pa-dot" style={{ backgroundColor: '#a855f7' }}></span>
                                                Recommended Tests
                                            </h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {result.lab_tests_recommended.map((test, idx) => (
                                                    <span key={idx} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f3e8ff', color: '#7e22ce', borderRadius: '9999px', fontSize: '0.875rem', border: '1px solid #e9d5ff' }}>
                                                        {test}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                        <button className="pa-btn-primary" style={{ backgroundColor: '#0f172a', marginTop: 0 }}>
                                            Save to Records <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!result && !analyzing && !error && (
                            <div className="pa-empty-state">
                                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>Upload a prescription to see analysis here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionAnalyzer;
