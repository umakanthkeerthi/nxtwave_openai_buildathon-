import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './DoctorDashboard.css'; // Reuse existing styles
import { AnimatePresence, motion } from 'framer-motion';

const DoctorSlotManager = () => {
    const { currentUser } = useAuth();

    // Helper for local date string (YYYY-MM-DD)
    const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [allSlots, setAllSlots] = useState([]); // Store all slots to show on calendar
    const [slots, setSlots] = useState([]); // Slots for selected date
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal State

    // Single Slot Form State
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    // Batch Form State
    const [showBatch, setShowBatch] = useState(false);
    const [batchStartDate, setBatchStartDate] = useState(getLocalDateString(new Date()));
    const [batchEndDate, setBatchEndDate] = useState(getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    const [workStart, setWorkStart] = useState('09:00');
    const [workEnd, setWorkEnd] = useState('17:00');
    const [breakStart, setBreakStart] = useState('13:00');
    const [breakEnd, setBreakEnd] = useState('14:00');
    const [slotDuration, setSlotDuration] = useState(30);
    const [timeGap, setTimeGap] = useState(0); // NEW
    const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    // Fetch slots when date changes or user loads
    useEffect(() => {
        if (currentUser?.doctor_id) {
            fetchSlots();
        }
    }, [selectedDate, currentUser]);

    const fetchSlots = async () => {
        if (!currentUser?.doctor_id) return;

        setLoading(true);
        try {
            // Fetch ALL slots for doctor
            const response = await fetch(`/get_slots?doctor_id=${currentUser.doctor_id}`);
            if (response.ok) {
                const data = await response.json();
                setAllSlots(data.slots || []); // Save all slots

                // Filter client-side for selected date
                const dateKey = getLocalDateString(selectedDate);
                const daySlots = (data.slots || []).filter(s => s.date === dateKey);

                // Sort by time
                daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

                setSlots(daySlots);
            }
        } catch (e) {
            console.error("Fetch slots failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchCreate = async () => {
        if (!currentUser?.doctor_id) return;
        setLoading(true);
        try {
            const payload = {
                doctor_id: currentUser.doctor_id,
                start_date: batchStartDate,
                end_date: batchEndDate,
                selected_days: selectedDays,
                start_time: workStart,
                end_time: workEnd,
                break_start: breakStart,
                break_end: breakEnd,
                slot_duration_minutes: parseInt(slotDuration),
                time_gap_minutes: parseInt(timeGap) // NEW
            };

            const response = await fetch('/create_slots_batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const res = await response.json();
                alert(`Success! Created ${res.slots_created} slots.`);
                fetchSlots();
                setShowBatch(false);
            } else {
                alert("Failed to create batch slots.");
            }
        } catch (e) {
            console.error("Batch create failed", e);
            alert("Error creating slots");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async () => {
        if (!currentUser?.doctor_id) {
            alert("Doctor ID not found. Please relogin.");
            return;
        }

        const dateKey = getLocalDateString(selectedDate);

        const newSlot = {
            doctor_id: currentUser.doctor_id,
            date: dateKey,
            start_time: startTime,
            end_time: endTime,
            status: "AVAILABLE"
        };

        try {
            const response = await fetch('/create_slot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSlot)
            });

            if (response.ok) {
                alert("Slot Created!");
                fetchSlots(); // Refresh
            } else {
                alert("Failed to create slot");
            }
        } catch (e) {
            console.error(e);
            alert("Error creating slot");
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Are you sure you want to delete this slot?")) return;

        try {
            const response = await fetch(`/delete_slot?slot_id=${slotId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local state immediately for UI responsiveness
                setAllSlots(prev => prev.filter(s => s.id !== slotId));
                setSlots(prev => prev.filter(s => s.id !== slotId));
            } else {
                alert("Failed to delete slot");
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("Error deleting slot");
        }
    };

    const handleDeleteAllSlots = async () => {
        if (!slots.length) return;
        if (!window.confirm(`Are you sure you want to delete ALL ${slots.length} slots for this day?`)) return;

        const dateKey = getLocalDateString(selectedDate);
        try {
            const response = await fetch(`/delete_slots_for_day?doctor_id=${currentUser.doctor_id}&date=${dateKey}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Update local state: remove all slots for this date
                setAllSlots(prev => prev.filter(s => s.date !== dateKey));
                setSlots([]); // Clear current view
            } else {
                alert("Failed to delete slots");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting slots");
        }
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);

        // Update slots for this date
        const dateKey = getLocalDateString(date);
        const daySlots = allSlots.filter(s => s.date === dateKey);
        daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
        setSlots(daySlots);

        setIsModalOpen(true); // OPEN MODAL
    };

    // Calendar Helper Functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateKey = getLocalDateString(date);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            // Find slots for this day
            const daySlots = allSlots.filter(s => s.date === dateKey);
            // Sort by time
            daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(date)}
                    style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        background: isSelected ? '#0f766e' : (isToday ? '#e6fffa' : 'white'),
                        color: isSelected ? 'white' : '#1e293b',
                        fontWeight: '600',
                        textAlign: 'left',
                        border: isSelected ? 'none' : '1px solid #e2e8f0',
                        position: 'relative',
                        minHeight: '100px', // Increased height for content
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch', // Full width items
                        gap: '4px'
                    }}
                >
                    <div style={{ marginBottom: '4px', textAlign: 'center' }}>{day}</div>

                    {/* Render Slots directly in calendar */}
                    {daySlots.slice(0, 3).map(slot => (
                        <div key={slot.id} style={{
                            fontSize: '0.7rem',
                            padding: '2px 4px',
                            background: isSelected ? 'rgba(255,255,255,0.2)' : '#e0f2fe',
                            color: isSelected ? 'white' : '#0369a1',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {slot.start_time}
                        </div>
                    ))}

                    {daySlots.length > 3 && (
                        <div style={{
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            color: isSelected ? 'white' : '#64748b',
                            fontWeight: 'normal'
                        }}>
                            +{daySlots.length - 3} more
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + offset));
        setCurrentMonth(new Date(newDate));
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Manage Slots</h1>
                <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Set your availability for patient consultations</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>

                {/* CALENDAR SECTION */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>

                    {/* Month Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft /></button>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                            {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight /></button>
                    </div>

                    {/* Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '10px' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                        {renderCalendar()}
                    </div>
                </div>

                {/* SLOT MANAGEMENT SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Toggle Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setShowBatch(false)} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: !showBatch ? '#0f766e' : '#e2e8f0', color: !showBatch ? 'white' : '#64748b'
                        }}>Single Slot</button>
                        <button onClick={() => setShowBatch(true)} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: showBatch ? '#0f766e' : '#e2e8f0', color: showBatch ? 'white' : '#64748b'
                        }}>Batch Generate</button>
                    </div>

                    {!showBatch ? (
                        /* SINGLE SLOT ADD */
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                                {selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h3>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddSlot}
                                style={{
                                    width: '100%', padding: '10px', background: '#0f766e', color: 'white',
                                    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <Plus size={18} /> Add Slot
                            </button>
                        </div>
                    ) : (
                        /* BATCH GENERATE */
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Weekly Schedule</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Date Range</label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input type="date" value={batchStartDate} onChange={e => setBatchStartDate(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }} />
                                    <span style={{ alignSelf: 'center' }}>to</span>
                                    <input type="date" value={batchEndDate} onChange={e => setBatchEndDate(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Work Start</label>
                                    <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Work End</label>
                                    <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Break Start</label>
                                    <input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Break End</label>
                                    <input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Slot Duration (mins)</label>
                                <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="45">45 Minutes</option>
                                    <option value="60">1 Hour</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Gap Between Slots (mins)</label>
                                <select value={timeGap} onChange={e => setTimeGap(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                                    <option value="0">No Gap</option>
                                    <option value="5">5 Minutes</option>
                                    <option value="10">10 Minutes</option>
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>Working Days</label>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    {weekDays.map(day => (
                                        <button key={day} onClick={() => toggleDay(day)} style={{
                                            padding: '5px 10px', borderRadius: '15px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.8rem',
                                            background: selectedDays.includes(day) ? '#0f766e' : 'white', color: selectedDays.includes(day) ? 'white' : '#64748b'
                                        }}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleBatchCreate}
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '10px', background: '#0f766e', color: 'white',
                                    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <Save size={18} /> {loading ? "Generating..." : "Generate Slots"}
                            </button>
                        </div>
                    )}

                    {/* Slots List */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} /> Available Slots
                        </h3>

                        {loading ? (
                            <div style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</div>
                        ) : slots.length === 0 ? (
                            <div style={{ color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>No slots for this date.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {slots.map(slot => (
                                    <div key={slot.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#334155' }}>
                                            {slot.start_time} - {slot.end_time}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* DAY DETAILS MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }} onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '500px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                                    {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#475569', margin: 0 }}>
                                        Available Slots ({slots.length})
                                    </h3>
                                    {slots.length > 0 && (
                                        <button
                                            onClick={handleDeleteAllSlots}
                                            style={{
                                                background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                                                padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            <Trash2 size={12} /> Clear All
                                        </button>
                                    )}
                                </div>

                                {slots.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No slots available for this day.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {slots.map(slot => (
                                            <div key={slot.id} style={{
                                                background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '8px',
                                                padding: '8px 12px', color: '#0f766e', fontWeight: '600', fontSize: '0.9rem',
                                                display: 'flex', alignItems: 'center', gap: '8px'
                                            }}>
                                                {slot.start_time} - {slot.end_time}
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'flex' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>Add New Slot</h3>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Start</label>
                                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>End</label>
                                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <button onClick={handleAddSlot} style={{ alignSelf: 'flex-end', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

};

export default DoctorSlotManager;
