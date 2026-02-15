import React, { useState, useEffect } from 'react';
import { Flame, Moon, Heart, Droplets, Info, TrendingUp, Award, Target, Zap } from 'lucide-react';
import './Wellness.css';
import { useTranslation } from 'react-i18next';

const Wellness = () => {
    const { t } = useTranslation();
    // --- STATE ---
    const [viewMode, setViewMode] = useState('week');
    const [waterCount, setWaterCount] = useState(3);
    const [heartRate, setHeartRate] = useState(72);
    const [activeGraphIndex, setActiveGraphIndex] = useState(null);
    const [streak, setStreak] = useState(7);

    const [stats, setStats] = useState({
        steps: 0,
        goal: 10000,
        sleepHours: 0,
        sleepMinutes: 0
    });

    // Achievement Badges
    const achievements = [
        { id: 1, icon: '🏃', title: t('wellness.achievements.badges.first_steps.title'), desc: t('wellness.achievements.badges.first_steps.desc'), unlocked: true },
        { id: 2, icon: '💪', title: t('wellness.achievements.badges.week_warrior.title'), desc: t('wellness.achievements.badges.week_warrior.desc'), unlocked: true },
        { id: 3, icon: '🌟', title: t('wellness.achievements.badges.goal_crusher.title'), desc: t('wellness.achievements.badges.goal_crusher.desc'), unlocked: false },
        { id: 4, icon: '😴', title: t('wellness.achievements.badges.sleep_master.title'), desc: t('wellness.achievements.badges.sleep_master.desc'), unlocked: false },
        { id: 5, icon: '💧', title: t('wellness.achievements.badges.hydration_hero.title'), desc: t('wellness.achievements.badges.hydration_hero.desc'), unlocked: true },
        { id: 6, icon: '🔥', title: t('wellness.achievements.badges.on_fire.title'), desc: t('wellness.achievements.badges.on_fire.desc'), unlocked: false }
    ];

    // Mock Data
    const weeklySleep = [6.5, 7.2, 5.8, 8.0, 7.5, 6.8, 7.4];
    const monthlySleep = [6, 7, 6.5, 8, 7, 6, 7.5, 6.8, 7, 6.5, 8, 7.2];
    const currentSleepData = viewMode === 'week' ? weeklySleep : monthlySleep;
    const days = viewMode === 'week' ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : Array.from({ length: 12 }, (_, i) => i + 1);

    const tips = [
        "Walking 30 mins a day reduces heart disease risk by 19%.",
        "Staying hydrated improves cognitive function and mood.",
        "Consistent sleep schedules boost immune system health.",
        "Deep breathing for 2 mins can lower stress significantly."
    ];
    const [tip, setTip] = useState(tips[0]);

    // Weekly Summary Stats
    const weeklyStats = {
        avgSteps: 8234,
        avgSleep: 7.2,
        totalCalories: 2450,
        activeMinutes: 156,
        stepsChange: +12,
        sleepChange: -5,
        caloriesChange: +8,
        activeChange: +15
    };

    // --- EFFECTS ---
    useEffect(() => {
        setTimeout(() => {
            setStats({
                steps: 8432,
                goal: 10000,
                sleepHours: 7,
                sleepMinutes: 24
            });
        }, 100);

        setTip(tips[Math.floor(Math.random() * tips.length)]);

        const interval = setInterval(() => {
            setHeartRate(prev => {
                const change = Math.floor(Math.random() * 5) - 2;
                return Math.max(60, Math.min(100, prev + change));
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // --- CALCULATIONS ---
    const stepsPercentage = Math.min((stats.steps / stats.goal) * 100, 100);
    const circumference = 440;
    const strokeDashoffset = circumference - (stepsPercentage / 100) * circumference;
    const caloriesBurned = Math.round(stats.steps * 0.04);

    // Water Handler
    const handleWaterClick = (index) => {
        if (index + 1 === waterCount) {
            setWaterCount(index);
        } else {
            setWaterCount(index + 1);
        }
    };

    return (
        <div className="wellness-container">
            <header className="wellness-header">
                <div>
                    <h1 className="wellness-title">{t('wellness.title')}</h1>
                    <p className="wellness-subtitle">{t('wellness.subtitle')}</p>
                </div>
                <div className="wellness-date">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </header>

            <div className="wellness-grid">

                {/* === LEFT COLUMN: MAIN CONTENT === */}
                <div className="wellness-main-content">

                    {/* 1. Weekly Summary */}
                    <div className="wellness-card summary-card">
                        <div className="card-header" style={{ borderBottom: 'none' }}>
                            <div className="card-title">
                                <Zap size={20} />
                                <span>Weekly Summary</span>
                            </div>
                        </div>
                        <div className="summary-stats">
                            <div className="summary-stat">
                                <div className="stat-value">{weeklyStats.avgSteps.toLocaleString()}</div>
                                <div className="stat-label">{t('wellness.weekly_summary.avg_steps')}</div>
                                <div className={`stat-change ${weeklyStats.stepsChange > 0 ? 'positive' : 'negative'}`}>
                                    {weeklyStats.stepsChange > 0 ? '↑' : '↓'} {Math.abs(weeklyStats.stepsChange)}%
                                </div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-value">{weeklyStats.avgSleep}h</div>
                                <div className="stat-label">{t('wellness.weekly_summary.avg_sleep')}</div>
                                <div className={`stat-change ${weeklyStats.sleepChange > 0 ? 'positive' : 'negative'}`}>
                                    {weeklyStats.sleepChange > 0 ? '↑' : '↓'} {Math.abs(weeklyStats.sleepChange)}%
                                </div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-value">{weeklyStats.totalCalories}</div>
                                <div className="stat-label">{t('wellness.weekly_summary.calories_burned')}</div>
                                <div className={`stat-change ${weeklyStats.caloriesChange > 0 ? 'positive' : 'negative'}`}>
                                    {weeklyStats.caloriesChange > 0 ? '↑' : '↓'} {Math.abs(weeklyStats.caloriesChange)}%
                                </div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-value">{weeklyStats.activeMinutes}</div>
                                <div className="stat-label">{t('wellness.weekly_summary.active_minutes')}</div>
                                <div className={`stat-change ${weeklyStats.activeChange > 0 ? '↑' : '↓'} ${weeklyStats.activeChange > 0 ? 'positive' : 'negative'}`}>
                                    {weeklyStats.activeChange > 0 ? '↑' : '↓'} {Math.abs(weeklyStats.activeChange)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity, Sleep, Vitals Row */}
                    <div className="wellness-cards-row">
                        {/* 1. ACTIVITY CARD */}
                        <div className="wellness-card activity-card">
                            <div className="card-header">
                                <div className="card-title">
                                    <div className="card-icon steps-icon-bg">
                                        <Flame size={20} />
                                    </div>
                                    <span>{t('wellness.activity.title')}</span>
                                </div>
                                <TrendingUp size={18} color="#34c759" />
                            </div>

                            <div className="steps-circle-container">
                                <svg viewBox="0 0 160 160" className="circular-chart">
                                    <path className="circle-bg"
                                        d="M80 10 a 70 70 0 0 1 0 140 a 70 70 0 0 1 0 -140"
                                    />
                                    <path className="circle steps-circle"
                                        strokeDasharray={`${circumference}, ${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        d="M80 10 a 70 70 0 0 1 0 140 a 70 70 0 0 1 0 -140"
                                    />
                                </svg>
                                <div className="steps-center-content">
                                    <Flame size={24} className="center-icon" fill="currentColor" />
                                    <div className="current-steps">{stats.steps.toLocaleString()}</div>
                                    <div className="goal-steps">/ {stats.goal.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="calories-burned">
                                🔥 {caloriesBurned} {t('wellness.activity.burned')}
                            </div>
                        </div>

                        {/* 2. SLEEP CARD */}
                        <div className="wellness-card sleep-card">
                            <div className="card-header" style={{ marginBottom: '1rem' }}>
                                <div className="card-title">
                                    <div className="card-icon sleep-icon-bg">
                                        <Moon size={20} />
                                    </div>
                                    <span>{t('wellness.sleep.title')}</span>
                                </div>
                                <div className="sleep-quality">{t('wellness.sleep.quality')}</div>
                            </div>

                            <div className="sleep-stats">
                                <div className="sleep-duration">
                                    {stats.sleepHours}<span>h</span> {stats.sleepMinutes}<span>m</span>
                                </div>

                                <div className="time-toggle">
                                    <button
                                        className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                                        onClick={() => setViewMode('week')}
                                    >
                                        {t('wellness.sleep.week')}
                                    </button>
                                    <button
                                        className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                                        onClick={() => setViewMode('month')}
                                    >
                                        {t('wellness.sleep.month')}
                                    </button>
                                </div>
                            </div>

                            <div className="sleep-graph">
                                {currentSleepData.map((hours, index) => (
                                    <div
                                        key={index}
                                        className={`graph-column ${index === currentSleepData.length - 1 ? 'active' : ''}`}
                                        onMouseEnter={() => setActiveGraphIndex(index)}
                                        onMouseLeave={() => setActiveGraphIndex(null)}
                                    >
                                        <div className="graph-tooltip">
                                            {hours}h
                                        </div>
                                        <div
                                            className="graph-bar"
                                            style={{ height: `${(hours / 10) * 100}%` }}
                                        ></div>
                                        <div className="graph-label">
                                            {viewMode === 'week' ? days[index] : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. VITALS & WATER */}
                        <div className="wellness-card combined-card">
                            <div className="heart-section">
                                <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                                    <div className="card-title">
                                        <div className="card-icon heart-icon-bg">
                                            <Heart size={20} fill="currentColor" />
                                        </div>
                                        <span>{t('wellness.vitals.heart_rate')}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{t('wellness.vitals.live')}</div>
                                </div>
                                <div className="heart-rate-display">
                                    <span className="bpm-value">{heartRate}</span>
                                    <span className="bpm-unit">bpm</span>
                                </div>
                                {/* Mock Chart for Heart Rate */}
                                <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} style={{
                                            width: '100%',
                                            height: `${30 + Math.random() * 40}%`,
                                            background: 'rgba(255, 45, 85, 0.2)',
                                            borderRadius: '2px'
                                        }}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="water-section">
                                <div className="water-header">
                                    <div className="water-title">
                                        <div className="water-icon-bg">
                                            <Droplets size={16} fill="currentColor" />
                                        </div>
                                        <span>{t('wellness.vitals.hydration')}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#0a84ff', fontWeight: 'bold' }}>
                                        {waterCount * 250}ml
                                    </div>
                                </div>
                                <div className="water-glasses">
                                    {[...Array(8)].map((_, i) => (
                                        <button
                                            key={i}
                                            className={`glass-btn ${i < waterCount ? 'filled' : ''}`}
                                            onClick={() => handleWaterClick(i)}
                                            title={`${(i + 1) * 250}ml`}
                                        >
                                            <Droplets size={24} style={{ fill: i < waterCount ? 'currentColor' : 'none' }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="achievements-section" style={{ marginTop: 0 }}>
                        <h2 className="section-title">
                            <Award size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            {t('wellness.achievements.title')}
                        </h2>
                        <div className="achievements-grid">
                            {achievements.map(badge => (
                                <div key={badge.id} className={`badge ${badge.unlocked ? 'unlocked' : 'locked'}`}>
                                    <span className="badge-icon">{badge.icon}</span>
                                    <div className="badge-title">{badge.title}</div>
                                    <div className="badge-desc">{badge.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* === RIGHT COLUMN: SIDEBAR === */}
                <div className="wellness-sidebar">

                    {/* Monthly Tracker Widget */}
                    <div className="wellness-card stats-showcase">
                        <div className="showcase-header">
                            <div className="showcase-tabs">
                                <div className="tab active">{t('wellness.sidebar.monthly_tracker')}</div>
                                {/* <div className="tab">Leaderboard</div> */}
                                <div className="tab">{t('wellness.sidebar.badges')}</div>
                            </div>
                            <div className="showcase-date-selector">
                                <span>Feb 2026 ◀ ▶</span>
                                <select className="frequency-selector">
                                    <option>Daily</option>
                                </select>
                            </div>
                        </div>

                        <div className="calendar-grid">
                            {Array.from({ length: 28 }, (_, i) => {
                                const status = i < 5 ? 'missed' : i < 20 ? 'achieved' : i === 20 ? 'holiday' : i === 21 ? 'paused' : i < 24 ? 'freeze' : 'empty';
                                return <div key={i} className={`calendar-day ${status}`}></div>;
                            })}
                        </div>

                        <div className="legend">
                            <div className="legend-item"><span className="dot missed"></span> {t('wellness.sidebar.legend.missed')}</div>
                            <div className="legend-item"><span className="dot achieved"></span> {t('wellness.sidebar.legend.achieved')}</div>
                            <div className="legend-item"><span className="dot holiday"></span> {t('wellness.sidebar.legend.holiday')}</div>
                            <div className="legend-item"><span className="dot paused"></span> {t('wellness.sidebar.legend.paused')}</div>
                            <div className="legend-item"><span className="dot freeze"></span> 🔥 {t('wellness.sidebar.legend.freeze')}</div>
                        </div>

                        <div className="stats-badges">
                            <div className="stat-badge">
                                <span className="badge-emoji">☀️</span>
                                <span className="badge-value">36125</span>
                            </div>
                            <div className="stat-badge">
                                <span className="badge-emoji">🔥</span>
                                <span className="badge-value">0</span>
                            </div>
                            <div className="stat-badge">
                                <span className="badge-emoji">🏆</span>
                                <span className="badge-value">Nil</span>
                            </div>
                        </div>
                    </div>

                    {/* Daily Tip Widget Removed */}
                    {/* <div className="wellness-card tip-card">
                        <div className="tip-icon-large floating">
                            <Info size={32} color="white" />
                        </div>
                        <div className="tip-content">
                            <h3>💡 Daily Health Tip</h3>
                            <p>{tip}</p>
                        </div>
                    </div> */}

                </div>

            </div>
        </div>
    );
};


export default Wellness;
