
import React, { useState, useEffect } from 'react';
import { Utensils, ArrowRight, Activity, Target, Heart, ChefHat } from 'lucide-react';
import './NutritionAnalyzer.css';

const NutritionAnalyzer = () => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({
        age: '',
        gender: '',
        height: '',
        currentWeight: '',

        goal: '',
        activityLevel: '',
        dietType: '',
        allergies: [],
        cuisine: [],
        mealsPerDay: '',
        medicalConditions: []
    });

    const GOALS = ["Fat Loss", "Lean Muscle Gain", "Bulking", "Maintenance"];

    const ACTIVITY_LEVELS = [
        { label: "Sedentary", sub: "Desk job, little movement" },
        { label: "Light", sub: "Walking, yoga 1-2x/week" },
        { label: "Moderate", sub: "Gym/Sports 3-4x/week" },
        { label: "High", sub: "Intense sports, manual labor" },
        { label: "Athlete", sub: "Professional training" }
    ];

    const DIET_TYPES = ["Veg", "Non-Veg", "Eggitarian", "Vegan"];
    const ALLERGIES = ["None", "Nuts", "Lactose", "Gluten", "Soy", "Shellfish"];
    const CUISINES = ["South Indian", "North Indian", "Continental", "Asian", "Mediterranean"];
    const MEALS_PER_DAY = ["3", "4", "Flexible"];
    const CONDITIONS = ["None", "Diabetes", "Thyroid", "High BP", "PCOS", "Cholesterol"];

    const handleInput = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSelect = (field, value) => {
        setProfile({ ...profile, [field]: value });
    };

    const toggleSelection = (field, value) => {
        if (value === "None") {
            setProfile({ ...profile, [field]: ["None"] });
            return;
        }
        let current = profile[field].filter(item => item !== "None");
        if (current.includes(value)) {
            current = current.filter(item => item !== value);
        } else {
            current.push(value);
        }
        setProfile({ ...profile, [field]: current });
    };

    const handleNext = () => {
        if (step === 1) {
            if (!profile.age || !profile.gender || !profile.height || !profile.currentWeight) return alert("Please fill in all required fields.");
        }
        if (step === 3) {
            setIsGenerating(true);
            setTimeout(() => {
                setIsGenerating(false);
                setStep(step + 1);
            }, 2500);
            return;
        }
        setStep(step + 1);
    };

    // --- DASHBOARD STATE & LOGIC ---
    const [dailyLog, setDailyLog] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    const [dailyMeals, setDailyMeals] = useState([]);
    const [addingMealType, setAddingMealType] = useState(null); // 'Breakfast', 'Lunch', 'Dinner', 'Snack'
    const [mealInput, setMealInput] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [smartSuggestion, setSmartSuggestion] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Macro Calculations (Derived State)
    const w = parseFloat(profile.currentWeight) || 70;
    const h = parseFloat(profile.height) || 170;
    const a = parseFloat(profile.age) || 30;
    const isMale = profile.gender === 'Male';

    // BMR (Mifflin-St Jeor)
    let bmr = (10 * w) + (6.25 * h) - (5 * a) + (isMale ? 5 : -161);

    // TDEE Multiplier
    let multiplier = 1.2;
    if (profile.activityLevel === 'Light') multiplier = 1.375;
    if (profile.activityLevel === 'Moderate') multiplier = 1.55;
    if (profile.activityLevel === 'High') multiplier = 1.725;
    if (profile.activityLevel === 'Athlete') multiplier = 1.9;

    let tdee = bmr * multiplier;

    // Goal Adjustment
    if (profile.goal === 'Fat Loss') tdee -= 500;
    if (profile.goal === 'Bulking') tdee += 500;
    if (profile.goal === 'Lean Muscle Gain') tdee += 250;

    const targetCalories = Math.round(tdee);
    const targetProtein = Math.round(w * 2); // 2g per kg
    const targetFats = Math.round(w * 0.8); // 0.8g per kg
    const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFats * 9)) / 4);

    const handleAddMeal = async () => {
        if (!mealInput.trim()) return;
        setAnalyzing(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/analyze_meal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: mealInput })
            });
            const data = await res.json();

            // Update Log with AI Data
            const newCalories = dailyLog.calories + (data.total_calories || 0);
            const newProtein = dailyLog.protein + (data.protein_g || 0);
            const newCarbs = dailyLog.carbs + (data.carbs_g || 0);
            const newFats = dailyLog.fats + (data.fats_g || 0);

            setDailyLog({ calories: newCalories, protein: newProtein, carbs: newCarbs, fats: newFats });
            setDailyMeals([...dailyMeals, { name: mealInput, type: addingMealType, ...data }]);
            setMealInput("");
            setAddingMealType(null);

            // Fetch Smart Suggestion after updating log
            fetchSuggestion({ ...dailyLog, calories: newCalories, protein: newProtein, carbs: newCarbs, fats: newFats });

        } catch (e) {
            console.error("Meal Analysis Error", e);
            alert("AI Analysis failed. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const fetchSuggestion = async (currentLogParams) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/get_nutrition_suggestion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile, current_log: currentLogParams })
            });
            const data = await res.json();
            setSmartSuggestion(data);
        } catch (e) {
            console.error("Suggestion Error", e);
        }
    };

    useEffect(() => {
        if (step === 4 && !smartSuggestion) fetchSuggestion(dailyLog);
    }, [step]);

    const renderMealSection = (type, targetCals, placeholder, emoji) => {
        const meals = dailyMeals.filter(m => m.type === type);
        const currentCals = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);

        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1f2937' }}>{type}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{currentCals} of {targetCals} Cal</span>
                        <div
                            style={{ background: '#ecfccb', color: '#365314', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #84cc16' }}
                            onClick={() => setAddingMealType(type)}
                        >+</div>
                    </div>
                </div>

                {meals.length === 0 && addingMealType !== type ? (
                    <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', border: '1px dashed #cbd5e1' }}>
                        {placeholder} {emoji}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {meals.map((m, i) => (
                            <div key={i} className="na-meal-card">
                                <div style={{ fontWeight: 600, color: '#3f6212', fontSize: '0.95rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#65a30d', marginTop: '4px' }}>
                                    {m.total_calories} kcal • P: {m.protein_g}g • C: {m.carbs_g}g • F: {m.fats_g}g
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {addingMealType === type && (
                    <div className="na-card" style={{ padding: '1.5rem', marginTop: '1rem', animation: 'fadeIn 0.3s' }}>
                        <input
                            type="text"
                            className="na-input"
                            placeholder={`e.g. 2 eggs for ${type}...`}
                            value={mealInput}
                            onChange={(e) => setMealInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
                            disabled={analyzing}
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className="na-btn-primary"
                                onClick={handleAddMeal}
                                disabled={analyzing}
                                style={{ marginTop: 0, padding: '0.75rem 1.5rem', flex: 1 }}
                            >
                                {analyzing ? "Analyzing..." : "Add Meal"}
                            </button>
                            <button
                                className="na-btn-primary"
                                style={{ marginTop: 0, background: 'transparent', color: '#64748b', boxShadow: 'none', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', width: 'auto' }}
                                onClick={() => { setAddingMealType(null); setMealInput(''); }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (isGenerating) {
        return (
            <div className="na-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                    <div style={{
                        display: 'inline-block', padding: '2rem', borderRadius: '50%',
                        background: 'white', boxShadow: '0 20px 40px rgba(132, 204, 22, 0.2)', marginBottom: '2rem'
                    }}>
                        <ChefHat size={64} color="#65a30d" style={{ animation: 'bounce 2s infinite' }} />
                    </div>
                    <h2 style={{ color: '#1e293b', fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem' }}>AI is crafting your plan...</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Analyzing your profile and preferences.</p>
                </div>
                <style>{`
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-15px); }
                    }
                 `}</style>
            </div>
        );
    }

    return (
        <div className="na-container">
            <div className="na-wrapper">
                <div className="na-header">
                    <h1 className="na-title">Nutrition Goal Setup</h1>
                    <p className="na-subtitle">Let's build your personalized AI nutrition plan. Tell us a bit about yourself.</p>
                </div>

                {/* PROGRESS BAR */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', gap: '0.75rem' }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{
                            width: '3.5rem', height: '0.5rem', borderRadius: '1rem',
                            backgroundColor: s <= step ? '#65a30d' : '#e2e8f0',
                            transition: 'background-color 0.3s ease'
                        }}></div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="na-card">
                        <div className="section-title"><Activity size={24} color="#65a30d" /> Basic Profile</div>

                        <div className="na-form-grid">
                            <div className="na-form-group">
                                <label className="na-label">Age</label>
                                <input type="number" name="age" className="na-input" value={profile.age} onChange={handleInput} placeholder="e.g. 25" />
                            </div>
                            <div className="na-form-group">
                                <label className="na-label">Gender</label>
                                <select name="gender" className="na-input" value={profile.gender} onChange={handleInput}>
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="na-form-group">
                                <label className="na-label">Height (cm)</label>
                                <input type="number" name="height" className="na-input" value={profile.height} onChange={handleInput} placeholder="e.g. 175" />
                            </div>
                            <div className="na-form-group">
                                <label className="na-label">Current Weight (kg)</label>
                                <input type="number" name="currentWeight" className="na-input" value={profile.currentWeight} onChange={handleInput} placeholder="e.g. 70" />
                            </div>

                        </div>

                        <button className="na-btn-primary" onClick={handleNext}>
                            Next Step <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="na-card">
                        <div className="section-title"><Target size={24} color="#65a30d" /> Goals & Lifestyle</div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="na-label" style={{ marginBottom: '1rem', display: 'block' }}>What is your primary goal?</label>
                            <div className="na-select-grid">
                                {GOALS.map(g => (
                                    <div
                                        key={g}
                                        className={`na-chip ${profile.goal === g ? 'selected' : ''}`}
                                        onClick={() => handleSelect('goal', g)}
                                    >
                                        {g}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="na-label" style={{ marginBottom: '1rem', display: 'block' }}>Activity Level</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {ACTIVITY_LEVELS.map(a => (
                                    <div
                                        key={a.label}
                                        className={`na-chip ${profile.activityLevel === a.label ? 'selected' : ''}`}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '1rem 1.5rem' }}
                                        onClick={() => handleSelect('activityLevel', a.label)}
                                    >
                                        <span style={{ fontWeight: 600, color: profile.activityLevel === a.label ? '#365314' : '#1e293b' }}>{a.label}</span>
                                        <span style={{ fontSize: '0.85rem', color: profile.activityLevel === a.label ? '#4d7c0f' : '#64748b' }}>{a.sub}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="na-btn-primary" style={{ background: 'white', color: '#65a30d', border: '1px solid #d9f99d', boxShadow: 'none' }} onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button className="na-btn-primary" onClick={handleNext}>
                                Next Step <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="na-card">
                        <div className="section-title"><Utensils size={24} color="#65a30d" /> Food & Health Preferences</div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="na-label" style={{ marginBottom: '1rem', display: 'block' }}>Diet Type</label>
                            <div className="na-select-grid">
                                {DIET_TYPES.map(d => (
                                    <div
                                        key={d}
                                        className={`na-chip ${profile.dietType === d ? 'selected' : ''}`}
                                        onClick={() => handleSelect('dietType', d)}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="na-form-grid">
                            <div>
                                <label className="na-label" style={{ marginBottom: '1rem', display: 'block' }}>Cuisines (Select multiple)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {CUISINES.map(c => (
                                        <div
                                            key={c}
                                            className={`na-chip ${profile.cuisine.includes(c) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('cuisine', c)}
                                            style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                                        >
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="na-label" style={{ marginBottom: '1rem', display: 'block' }}>Meals Per Day</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {MEALS_PER_DAY.map(m => (
                                        <div
                                            key={m}
                                            className={`na-chip ${profile.mealsPerDay === m ? 'selected' : ''}`}
                                            onClick={() => handleSelect('mealsPerDay', m)}
                                            style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="na-label" style={{ marginBottom: '1rem', display: 'block' }}>Allergies (Optional)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {ALLERGIES.map(a => (
                                    <div
                                        key={a}
                                        className={`na-chip ${profile.allergies.includes(a) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection('allergies', a)}
                                        style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        {a}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="na-label" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Heart size={16} /> Medical Conditions (Optional)
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {CONDITIONS.map(c => (
                                    <div
                                        key={c}
                                        className={`na-chip ${profile.medicalConditions.includes(c) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection('medicalConditions', c)}
                                        style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        {c}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="na-btn-primary" style={{ background: 'white', color: '#65a30d', border: '1px solid #d9f99d', boxShadow: 'none' }} onClick={() => setStep(2)}>
                                Back
                            </button>
                            <button className="na-btn-primary" onClick={handleNext}>
                                Complete Setup <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="na-dashboard">
                        {/* Time-Aware Nudge */}
                        <div className="na-nudge-alert">
                            <Activity size={20} />
                            <span><strong>It's 2:00 PM</strong> - You haven't logged lunch yet. Keeping it light?</span>
                        </div>

                        <div className="na-dashboard-grid">
                            {/* LEFT COLUMN: MEAL LOGGING */}
                            <div className="na-col-main">
                                <div className="section-title"><Utensils size={24} color="#65a30d" /> Today's Meals</div>

                                {renderMealSection('Breakfast', Math.round(targetCalories * (profile.mealsPerDay === '3' ? 0.30 : 0.25)), "All you need is some breakfast", "🥞")}
                                {renderMealSection('Lunch', Math.round(targetCalories * (profile.mealsPerDay === '3' ? 0.40 : 0.35)), "Mid-day meals keep your focus strong", "🥗")}
                                {renderMealSection('Dinner', Math.round(targetCalories * (profile.mealsPerDay === '3' ? 0.30 : 0.30)), "End your day with a light meal", "🌙")}
                                {profile.mealsPerDay !== '3' && renderMealSection('Snack', Math.round(targetCalories * 0.10), "Refuel your body between meals", "🥜")}

                                <div className="na-smart-suggestion" style={{ marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '50%' }}>
                                            <ChefHat size={24} color="#65a30d" />
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#14532d' }}>Smart Suggestion</span>
                                    </div>
                                    <p style={{ position: 'relative', zIndex: 1, fontSize: '1.05rem' }}>{smartSuggestion?.suggestion || `Your goal is ${targetCalories} kcal. Start logging to get AI advice!`}</p>
                                </div>


                            </div>

                            {/* RIGHT COLUMN: SCORES & STATS */}
                            <div className="na-col-sidebar">
                                <div className="na-score-card">
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                        <div className="na-score-circle" style={{ '--percentage': `${(smartSuggestion?.meal_quality_score || 0) * 10}%` }}>
                                            <span className="sc-val">
                                                {smartSuggestion?.meal_quality_score || 0}
                                            </span>
                                            <span className="sc-label">Meal Quality</span>
                                        </div>
                                    </div>
                                    <div className="na-score-breakdown">
                                        <div className="sb-item"><span>Protein</span> <div className="sb-bar"><div style={{ width: `${smartSuggestion?.score_breakdown?.protein_score || 0}%`, background: '#f87171' }}></div></div></div>
                                        <div className="sb-item"><span>Fiber</span> <div className="sb-bar"><div style={{ width: `${smartSuggestion?.score_breakdown?.fiber_score || 0}%`, background: '#84cc16' }}></div></div></div>
                                        <div className="sb-item"><span>Balance</span> <div className="sb-bar"><div style={{ width: `${smartSuggestion?.score_breakdown?.balance_score || 0}%`, background: '#facc15' }}></div></div></div>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '1.5rem', fontStyle: 'italic' }}>
                                        Updates as you log meals
                                    </div>
                                </div>

                                <div className="na-card" style={{ padding: '2rem', marginTop: '2rem' }}>
                                    <div className="section-title" style={{ fontSize: '1.2rem' }}><Target size={20} color="#65a30d" /> Daily Targets</div>

                                    <div className="na-target-row">
                                        <span>Calories</span>
                                        <span>{dailyLog.calories} / {targetCalories}</span>
                                    </div>
                                    <div className="na-progress" style={{ marginBottom: '1.5rem' }}><div style={{ width: `${Math.min((dailyLog.calories / targetCalories) * 100, 100)}%` }}></div></div>

                                    <div className="na-target-row">
                                        <span>Protein</span>
                                        <span>{dailyLog.protein} / {targetProtein}g</span>
                                    </div>
                                    <div className="na-progress" style={{ marginBottom: '1.5rem' }}><div style={{ width: `${Math.min((dailyLog.protein / targetProtein) * 100, 100)}%`, background: '#f87171' }}></div></div>

                                    <div className="na-target-row">
                                        <span>Carbs</span>
                                        <span>{dailyLog.carbs} / {targetCarbs}g</span>
                                    </div>
                                    <div className="na-progress" style={{ marginBottom: '1.5rem' }}><div style={{ width: `${Math.min((dailyLog.carbs / targetCarbs) * 100, 100)}%`, background: '#facc15' }}></div></div>

                                    <div className="na-target-row">
                                        <span>Fats</span>
                                        <span>{dailyLog.fats} / {targetFats}g</span>
                                    </div>
                                    <div className="na-progress"><div style={{ width: `${Math.min((dailyLog.fats / targetFats) * 100, 100)}%`, background: '#60a5fa' }}></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default NutritionAnalyzer;
