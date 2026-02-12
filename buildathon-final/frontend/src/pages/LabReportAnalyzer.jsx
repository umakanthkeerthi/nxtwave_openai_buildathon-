import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, ArrowRight, Activity, Beaker } from 'lucide-react';
import { motion } from 'framer-motion';
import './LabReportAnalyzer.css';

const LabReportAnalyzer = () => {
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
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/analyze_lab_report`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to analyze lab report");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'lra-status-normal';
        const s = status.toLowerCase();
        if (s.includes('high')) return 'lra-status-high';
        if (s.includes('low')) return 'lra-status-low';
        if (s.includes('abnormal')) return 'lra-status-abnormal';
        return 'lra-status-normal';
    };

    return (
        <div className="lra-container">
            <div className="lra-wrapper">
                {/* Header */}
                <div className="lra-header">
                    <h1 className="lra-title">Lab Report Analyzer</h1>
                    <p className="lra-subtitle">Upload your medical lab reports to get an instant AI summary and understanding of your key health metrics.</p>
                </div>

                <div className="lra-grid">
                    {/* Upload Section */}
                    <div>
                        <div className="lra-card">
                            <div className="lra-upload-area">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="lra-file-input"
                                />
                                <div className="lra-upload-content">
                                    <div className="lra-upload-icon-bg">
                                        <Upload size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#064e3b' }}>Click to upload or drag and drop</p>
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
                                    <img src={preview} alt="Report Preview" className="lra-preview-img" />

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                        className="lra-btn-primary"
                                    >
                                        {analyzing ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Analyzing Report...
                                            </>
                                        ) : (
                                            <>
                                                <Beaker size={20} />
                                                Analyze Report
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
                            <div className="lra-error-box">
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
                                className="lra-card"
                                style={{ padding: 0, overflow: 'hidden' }}
                            >
                                <div className="lra-result-header">
                                    <Check size={24} color="#10b981" />
                                    <h2 className="lra-result-title">Analysis Complete</h2>
                                </div>

                                <div className="lra-result-content">
                                    {/* Info Grid */}
                                    <div className="lra-info-grid">
                                        <div className="lra-info-box">
                                            <p className="lra-label-xs">Patient</p>
                                            <p className="lra-value">{result.patient_name || "N/A"}</p>
                                        </div>
                                        <div className="lra-info-box">
                                            <p className="lra-label-xs">Date</p>
                                            <p className="lra-value">{result.date || "N/A"}</p>
                                        </div>
                                        <div className="lra-info-box">
                                            <p className="lra-label-xs">Lab Name</p>
                                            <p className="lra-value">{result.lab_name || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {result.summary && (
                                        <div className="lra-summary-box">
                                            <h3 className="lra-summary-title">💡 Assessment Summary</h3>
                                            <p className="lra-summary-text">{result.summary}</p>
                                        </div>
                                    )}

                                    {/* Tests Table */}
                                    <div>
                                        <h3 className="lra-section-title">
                                            <Activity size={20} className="text-emerald-600" />
                                            Test Results
                                        </h3>
                                        <div className="lra-table-container">
                                            <table className="lra-table">
                                                <thead>
                                                    <tr>
                                                        <th>Test Name</th>
                                                        <th>Result</th>
                                                        <th>Ref Range</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.tests && result.tests.length > 0 ? (
                                                        result.tests.map((test, idx) => (
                                                            <tr key={idx}>
                                                                <td><strong>{test.name}</strong></td>
                                                                <td>
                                                                    {test.result} <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>{test.units}</span>
                                                                </td>
                                                                <td style={{ color: '#64748b', fontSize: '0.85em' }}>{test.reference_range}</td>
                                                                <td>
                                                                    <span className={`lra-status-badge ${getStatusClass(test.status)}`}>
                                                                        {test.status || "Normal"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No specific tests identified.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f0fdf4' }}>
                                        <button className="lra-btn-primary">
                                            Save to Health Records <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!result && !analyzing && !error && (
                            <div className="lra-empty-state">
                                <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: '#059669' }} />
                                <p>Upload a lab report image to see analysis here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabReportAnalyzer;
