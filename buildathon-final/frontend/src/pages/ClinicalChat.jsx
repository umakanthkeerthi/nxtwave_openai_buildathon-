import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, Send, ArrowLeft, FileText, AlertTriangle, Square, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import AudioConfirmationModal from '../components/AudioConfirmationModal'; // Import the new modal

import './FirstAidChat.css';

const ClinicalChat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, selectedProfile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('Auto-detect');
    const messagesEndRef = useRef(null);

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [showAudioModal, setShowAudioModal] = useState(false);
    const [audioText, setAudioText] = useState("");
    const [audioOriginalText, setAudioOriginalText] = useState("");
    const [audioDetectedLang, setAudioDetectedLang] = useState("");
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const [sessionId, setSessionId] = useState(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState("Analyzing symptoms...");

    // Cycling Text Effect
    useEffect(() => {
        let interval;
        if (isTyping) {
            const texts = ["Analyzing symptoms...", "Checking medical guidelines...", "Formulating response...", "Reviewing history..."];
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % texts.length;
                setTypingText(texts[i]);
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]); // Scroll when typing starts too

    // Initialize Session (Get Case ID from Backend)
    useEffect(() => {
        const initSession = async () => {
            try {
                // Check if we already have a case_id passed via navigation
                if (location.state?.case_id) {
                    setSessionId(location.state.case_id);
                    setIsLoadingSession(false);
                    return;
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL}/init_session`);
                const data = await res.json();
                if (data.case_id) {
                    console.log("Initialized Session:", data.case_id);
                    setSessionId(data.case_id);
                }
            } catch (err) {
                console.error("Failed to init session:", err);
                // Fallback (though ideally we should show error)
                // [STANDARDIZED] Match backend format: CASE-{12_HEX_UPPER}
                const randomHex = Math.random().toString(16).slice(2, 14).toUpperCase().padEnd(12, '0');
                setSessionId(`CASE-${randomHex}`);
            } finally {
                setIsLoadingSession(false);
            }
        };
        initSession();
    }, []);

    // Load initial state from navigation if available
    useEffect(() => {
        if (!isLoadingSession && sessionId) {
            if (location.state?.initialInput) {
                const timer = setTimeout(() => {
                    handleSend(location.state.initialInput);
                }, 500);
                return () => clearTimeout(timer);
            } else if (messages.length === 0) {
                setMessages([{ type: 'bot', text: 'Namaste! I am the AI Clinical Agent. Speak in your language. I will analyze your symptoms and provide NHSRC medical guidelines.' }]);
            }
        }
    }, [location.state, isLoadingSession, sessionId]);

    // Audio Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                // Create URL for playback
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                await processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const processAudio = async (audioBlob) => {
        setIsProcessingAudio(true);
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.wav");

            // Map Language to ISO Code
            const langMap = {
                'Hindi': 'hi', 'Tamil': 'ta', 'Telugu': 'te',
                'Kannada': 'kn', 'Malayalam': 'ml', 'Marathi': 'mr',
                'Bengali': 'bn', 'Punjabi': 'pa'
            };
            const hint = langMap[language] || 'en';
            formData.append("language_hint", hint);

            // Pass the Chat's Current Language as the Target Language
            // This ensures the backend knows we specifically want to hear "Telugu" if Telugu is selected.
            formData.append("target_language", language === 'Auto-detect' ? 'Auto' : language);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/process_audio`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.repaired_text || data.english_text) {
                setAudioText(data.english_text); // Fallback english
                setAudioOriginalText(data.repaired_text); // Native text
                setAudioDetectedLang(data.detected_language);
                setShowAudioModal(true);
            } else {
                alert("Could not transcribe audio. Please try again.");
            }
        } catch (error) {
            console.error("Audio processing error:", error);
            alert("Failed to process audio. Please check your connection.");
        }
        setIsProcessingAudio(false);
    };

    const handleConfirmAudio = (confirmedText) => {
        setShowAudioModal(false);
        // Clean up URL to avoid memory leaks
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);

        // Send the CONFIRMED text (which might be the native edit)
        handleSend(confirmedText);
    };

    const handleSend = async (overrideInput = null) => {
        const text = overrideInput || input;
        if (!text.trim()) return;

        // User Message
        const userMsg = { type: 'user', text: text };
        setMessages(prev => [...prev, userMsg]);
        if (!overrideInput) setInput('');

        setIsTyping(true); // START ANIMATION

        try {
            // Call Backend /chat
            const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId,
                    case_id: sessionId, // [V1.0] Explicit Case ID
                    profile_id: selectedProfile?.id || currentUser?.uid, // [V1.0] Explicit Profile ID
                    target_language: language === 'Auto-detect' ? 'English' : language
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error ${response.status}: ${errorText}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                throw new Error("Invalid format received from server");
            }

            setIsTyping(false); // STOP ANIMATION

            // Sticky Language Logic:
            // If we were in Auto-detect mode, and the backend detected a language, LOCK IT IN.
            if (language === 'Auto-detect' && data.detected_language && data.detected_language !== 'English') {
                console.log("Sticky Language Set To:", data.detected_language);
                setLanguage(data.detected_language);
                // Optional: You could add a toast here saying "Language set to {data.detected_language}"
            }

            // Bot Message
            const botMsg = { type: 'bot', text: data.response };
            setMessages(prev => [...prev, botMsg]);

            // Check for Emergency
            if (data.response.includes("EMERGENCY DETECTED") || data.decision === "EMERGENCY") {

                // [MODIFIED] Do NOT auto-save here. Pass payload to EmergencyPage.
                setTimeout(() => {
                    navigate('/patient/emergency', {
                        state: {
                            summary_payload: data.summary_payload,
                            case_id: sessionId
                        }
                    });
                }, 2000); // 2s delay
            }
            // Check for Completion
            else if (data.decision === "COMPLETE") {
                const fullHistory = [...messages, userMsg, botMsg];
                setTimeout(() => {
                    handleEndAndSummarize(fullHistory);
                }, 3000); // 3s delay
            }

        } catch (error) {
            console.error("Chat Error Details:", error);
            setIsTyping(false); // STOP ANIMATION ON ERROR
            alert(`Chat Error: ${error.message}`);
            setMessages(prev => [...prev, { type: 'bot', text: `Sorry, I am having trouble connecting to the server. (${error.message})` }]);
        }
    };

    const handleEndAndSummarize = async (completeHistory = null) => {
        try {
            const msgsToProcess = completeHistory || messages;
            const history = msgsToProcess.map(m => ({ sender: m.type, text: m.text }));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/generate_summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: history,
                    target_language: language === 'Auto-detect' ? 'English' : language
                })
            });

            const data = await response.json();
            const redFlags = data.pre_doctor_consultation_summary?.red_flags || data.red_flags || [];

            const summaryData = {
                caseId: sessionId, // [FIXED] Use the standardized session ID
                color: data.patient_summary?.triage_level || "Green",
                triage: (data.patient_summary?.triage_level === "Red") ? "Emergency" : "Non-Emergency",
                chiefComplaints: [data.pre_doctor_consultation_summary?.trigger_reason || "Reported Symptoms"], // Use trigger reason as specific complaint
                reportedSymptoms: data.patient_summary?.symptoms_reported || [],
                deniedSymptoms: data.patient_summary?.symptoms_denied || [],
                redFlags: data.patient_summary?.red_flags || [],
                guidelines: data.patient_summary?.clinical_guidelines || "No guidelines generated.",
                followUp: data.pre_doctor_consultation_summary?.plan?.referral_needed ? "Consult Doctor immediately" : "Monitor for 24 hours",
                raw_patient_summary: JSON.stringify(data.patient_summary), // Store full object stringified for consistency
                raw_doctor_summary: data.pre_doctor_consultation_summary
            };

            navigate('/patient/patient-summary', { state: { summary: summaryData } });
        } catch (error) {
            console.error("Summary Error:", error);
            alert("Failed to generate summary. Please try again.");
        }
    };

    return (
        <div className="chat-page-container">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                        <ArrowLeft color="#555" />
                    </motion.button>
                    <div className="chat-header-info">
                        <h2>AI Clinical Agent</h2>
                        <span>NHSRC Guidelines Assistant</span>
                    </div>
                </div>

                <div className="chat-header-actions">
                    <select
                        className="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option>✨ Auto-detect</option>
                        <option>Hindi</option>
                        <option>Tamil</option>
                        <option>Telugu</option>
                        <option>Kannada</option>
                        <option>Malayalam</option>
                    </select>
                    <motion.button
                        className="end-chat-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEndAndSummarize()}
                    >
                        <FileText size={16} />
                        <span>End & Summarize</span>
                    </motion.button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`message-bubble ${msg.type === 'user' ? 'message-user' : 'message-bot'}`}
                    >
                        {msg.text}
                    </motion.div>
                ))}

                {/* VISUAL TYPING INDICATOR */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="typing-indicator"
                    >
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <span style={{ marginLeft: '8px' }}>{typingText}</span>
                    </motion.div>
                )}

                {/* Visual Indicator for Recording */}
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="message-bubble message-user recording-pulse"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626' }}
                    >
                        <div className="recording-dot"></div>
                        Listening...
                    </motion.div>
                )}

                {/* Visual Indicator for Processing */}
                {isProcessingAudio && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="message-bubble message-user"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontStyle: 'italic' }}
                    >
                        <Loader className="spin" size={16} /> Processing Audio...
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                <motion.button
                    className={`icon-btn mic ${isRecording ? 'active-recording' : ''}`}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleRecording}
                    style={{
                        backgroundColor: isRecording ? '#ef4444' : '#f1f5f9',
                        color: isRecording ? 'white' : '#555'
                    }}
                >
                    {isRecording ? <Square size={20} fill="white" /> : <Mic size={20} />}
                </motion.button>

                <div className="input-wrapper">
                    <input
                        className="chat-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isRecording ? "Listening..." : "Type symptoms..."}
                        disabled={isRecording || isProcessingAudio || isTyping}
                    />
                </div>

                <motion.button
                    className="icon-btn send"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                >
                    <Send size={20} />
                </motion.button>
            </div>

            {/* Audio Confirmation Modal */}
            <AudioConfirmationModal
                isOpen={showAudioModal}
                text={audioText}
                originalText={audioOriginalText}
                detectedLanguage={audioDetectedLang}
                audioUrl={audioUrl}
                onConfirm={handleConfirmAudio}
                onCancel={() => setShowAudioModal(false)}
            />
        </div>
    );
};

export default ClinicalChat;
