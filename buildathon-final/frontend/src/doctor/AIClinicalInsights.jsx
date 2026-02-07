import React, { useState } from 'react';
import {
    Brain, ChevronRight, ChevronDown, AlertTriangle,
    Info, ThumbsUp, ThumbsDown, CheckCircle
} from 'lucide-react';

const AIClinicalInsights = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [insights, setInsights] = useState(MOCK_INSIGHTS);

    return (
        <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px',
            background: 'white', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', background: '#7e22ce', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Brain size={18} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>AI Clinical Assistant</h3>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Beta • Confidence: High</span>
                    </div>
                </div>
                {isExpanded ? <ChevronDown size={20} color="#64748b" /> : <ChevronRight size={20} color="#64748b" />}
            </div>

            {/* Content */}
            {isExpanded && (
                <div style={{ padding: '1.5rem' }}>
                    {/* Severity Badge */}
                    <div style={{
                        padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                        display: 'flex', gap: '12px', marginBottom: '1.5rem'
                    }}>
                        <AlertTriangle size={20} color="#dc2626" style={{ marginTop: '2px' }} />
                        <div>
                            <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.95rem' }}>Flagged as HIGH RISK</div>
                            <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '4px' }}>
                                Based on symptom duration (&gt;48h) and vitals correlation.
                            </div>
                        </div>
                    </div>

                    {/* Insights List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {insights.map(insight => (
                            <InsightCard key={insight.id} data={insight} />
                        ))}
                    </div>

                    {/* Footer Disclaimer */}
                    <div style={{ marginTop: '1.5rem', padding: '12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '8px' }}>
                        <Info size={16} style={{ flexShrink: 0 }} />
                        <span>AI insights are assistive only. Please verify with clinical protocols. Not a diagnosis.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const InsightCard = ({ data }) => {
    const [acknowledged, setAcknowledged] = useState(false);

    if (acknowledged) {
        return (
            <div style={{
                padding: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1',
                borderRadius: '8px', color: '#0f766e', fontSize: '0.9rem', textAlign: 'center'
            }}>
                Insight Acknowledged
            </div>
        );
    }

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#334155' }}>{data.title}</h4>

            <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '12px' }}>
                <strong style={{ color: '#64748b' }}>Why detected:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.2rem' }}>
                    {data.reasons.map((r, i) => <li key={i} style={{ marginBottom: '4px' }}>{r}</li>)}
                </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                    onClick={() => setAcknowledged(true)}
                    style={{
                        background: 'none', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px',
                        fontSize: '0.85rem', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <CheckCircle size={14} /> Acknowledge
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Helpful">
                        <ThumbsUp size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Not Helpful">
                        <ThumbsDown size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MOCK_INSIGHTS = [
    {
        id: 1,
        title: "Potential Cardiac Anomaly",
        reasons: [
            "Reported chest pain radiating to left arm",
            "Heart rate variability detected (110bpm resting)",
            "History of Hypertension"
        ],
        confidence: "High"
    },
    {
        id: 2,
        title: "Medication Interaction Risk",
        reasons: [
            "Current prescription: Warfarin",
            "Patient mentioned taking Aspirin OTC"
        ],
        confidence: "Medium"
    }
];

export default AIClinicalInsights;
