import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, ArrowRight, Activity, Beaker } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './LabReportAnalyzer.css';

const LabReportAnalyzer = () => {
    const { t } = useTranslation();
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
            setError(err.message || t('lab_report_analyzer.failed'));
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
                    <h1 className="lra-title">{t('lab_report_analyzer.title')}</h1>
                    <p className="lra-subtitle">{t('lab_report_analyzer.subtitle')}</p>
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
                                        <p style={{ fontWeight: 600, color: '#064e3b' }}>{t('lab_report_analyzer.upload.prompt')}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{t('lab_report_analyzer.upload.formats')}</p>
                                    </div>
                                </div>
                            </div>

                            {preview && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginTop: '1.5rem', marginBottom: '0.5rem' }}>{t('lab_report_analyzer.upload.preview')}</p>
                                    <img src={preview} alt="Report Preview" className="lra-preview-img" />

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                        className="lra-btn-primary"
                                    >
                                        {analyzing ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                {t('lab_report_analyzer.analyzing')}
                                            </>
                                        ) : (
                                            <>
                                                <Beaker size={20} />
                                                {t('lab_report_analyzer.analyze_btn')}
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
                                    <p style={{ fontWeight: 600 }}>{t('lab_report_analyzer.failed')}</p>
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
                                    <h2 className="lra-result-title">{t('lab_report_analyzer.complete_title')}</h2>
                                </div>

                                <div className="lra-result-content">
                                    {/* Info Grid */}
                                    <div className="lra-info-grid">
                                        <div className="lra-info-box">
                                            <p className="lra-label-xs">{t('lab_report_analyzer.patient')}</p>
                                            <p className="lra-value">{result.patient_name || "N/A"}</p>
                                        </div>
                                        <div className="lra-info-box">
                                            <p className="lra-label-xs">{t('lab_report_analyzer.date')}</p>
                                            <p className="lra-value">{result.date || "N/A"}</p>
                                        </div>
                                        <div className="lra-info-box">
                                            <p className="lra-label-xs">{t('lab_report_analyzer.lab_name')}</p>
                                            <p className="lra-value">{result.lab_name || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {result.summary && (
                                        <div className="lra-summary-box">
                                            <h3 className="lra-summary-title">💡 {t('lab_report_analyzer.assessment_summary')}</h3>
                                            <p className="lra-summary-text">{result.summary}</p>
                                        </div>
                                    )}

                                    {/* Tests Table */}
                                    <div>
                                        <h3 className="lra-section-title">
                                            <Activity size={20} className="text-emerald-600" />
                                            {t('lab_report_analyzer.test_results')}
                                        </h3>
                                        <div className="lra-table-container">
                                            <table className="lra-table">
                                                <thead>
                                                    <tr>
                                                        <th>{t('lab_report_analyzer.table.test_name')}</th>
                                                        <th>{t('lab_report_analyzer.table.result')}</th>
                                                        <th>{t('lab_report_analyzer.table.ref_range')}</th>
                                                        <th>{t('lab_report_analyzer.table.status')}</th>
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
                                                            <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>{t('lab_report_analyzer.no_specific_tests')}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f0fdf4' }}>
                                        <button className="lra-btn-primary">
                                            {t('lab_report_analyzer.save_records')} <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!result && !analyzing && !error && (
                            <div className="lra-empty-state">
                                <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: '#059669' }} />
                                <p>{t('lab_report_analyzer.empty_state')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabReportAnalyzer;
