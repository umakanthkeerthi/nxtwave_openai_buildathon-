import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Stethoscope, User, Square, Check, X, AlertCircle, Loader2 } from 'lucide-react';

const DocAIInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Namaste! Speak in your language. I will repair the text and provide NHSRC medical guidelines." }
  ]);

  const [inputText, setInputText] = useState(''); // State for text input
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [pendingData, setPendingData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedLang, setSelectedLang] = useState('Auto'); // New state for language selection
  const [isEmergencyLocked, setIsEmergencyLocked] = useState(false); // Lockout state for emergencies
  const [patientProfile, setPatientProfile] = useState({}); // Stores medical facts (The Memory)

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);

  // --- SESSION MANAGEMENT ---
  // Generate a unique ID for this patient when the page loads
  const sessionIdRef = useRef(crypto.randomUUID());

  const summaryGeneratedRef = useRef(false); // Lock to prevent double summary

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Auto-trigger summary if the last message is final
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'bot' && lastMsg.isFinal && !summaryGeneratedRef.current) {
        summaryGeneratedRef.current = true; // Lock immediately
        handleSummary();
      }
    }
  }, [messages, pendingData, isProcessing]);

  // --- STEP 1: AUDIO RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = handleAudioStop;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      alert("Microphone access denied. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // --- STEP 2: PROCESS AUDIO ---
  const handleAudioStop = async () => {
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("language_hint", selectedLang); // Send selected language to backend

    try {
      const response = await fetch("http://localhost:8002/process_audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Backend failed to process audio");
      const data = await response.json();

      setPendingData({
        repaired: data.repaired_text,
        english: data.english_text,
        language: data.detected_language
      });

    } catch (error) {
      console.error("Transcription Error:", error);
      alert("Backend error: Make sure your server is running on port 8002.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- STEP 3: CONFIRM & QUERY GUIDELINES ---
  const handleConfirm = async () => {
    if (!pendingData) return;

    // Use original text for display (User sees their language)
    const userMessage = pendingData.repaired;
    // Use English for Agent Logic
    const translationForSearch = pendingData.english;
    // Priority: Selected > Detected
    const targetLang = (selectedLang !== 'Auto') ? selectedLang : (pendingData.language || 'English');

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMessage }]);
    setPendingData(null);
    setAudioUrl(null);
    setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: translationForSearch,
          session_id: sessionIdRef.current,
          target_language: targetLang
        }),
      });

      if (!response.ok) throw new Error("Agent search failed");
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response,
        decision: data.decision,
        isFinal: data.decision === 'COMPLETE' || data.decision === 'EMERGENCY'
      }]);

      if (data.decision === 'EMERGENCY') {
        console.log("🚨 EMERGENCY DETECTED");
        setIsEmergencyLocked(true);
      }
    } catch (error) {
      console.error("Guideline Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "Error reaching NHSRC database." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- STEP 4: MANUAL TEXT SEND ---
  const handleManualSend = async () => {
    if (!inputText.trim()) return;

    const query = inputText;
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: query }]);
    setIsProcessing(true);

    try {
      // 1. First, translate/detect language
      const transResponse = await fetch("http://localhost:8002/translate_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          session_id: sessionIdRef.current
        }),
      });

      if (!transResponse.ok) throw new Error("Translation failed");
      const transData = await transResponse.json();

      // 2. Then search with English text. Priority: Selected > Detected
      const targetLang = (selectedLang !== 'Auto') ? selectedLang : (transData.detected_language || 'English');

      const response = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: transData.english_text,
          session_id: sessionIdRef.current,
          target_language: targetLang
        }),
      });

      if (!response.ok) throw new Error("Agent search failed");
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response,
        decision: data.decision,
        isFinal: data.decision === 'COMPLETE'
      }]);

      if (data.decision === 'EMERGENCY') {
        console.log("🚨 EMERGENCY DETECTED");
        setIsEmergencyLocked(true);
      }
    } catch (error) {
      console.error(error);
      alert(`Backend connection error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- STEP 5: GENERATE SUMMARY ---
  const handleSummary = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("http://localhost:8002/generate_summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          target_language: selectedLang || "English",
          history: messages // Pass history for summary generation
        }),
      });

      if (!response.ok) throw new Error("Summary generation failed");
      const data = await response.json();

      // Log structured data for verification (Appointment System Integration)
      console.log("Pre Doctor Consultation Summary:", data.pre_doctor_consultation_summary);

      // Append summary as a special bot message using the display text
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: data.patient_summary || "Error: No summary text generated.",
        isSummary: true
      }]);
    } catch (error) {
      alert("Could not generate summary. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-lg text-white"><Stethoscope size={24} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">DocAI First Aid</h1>
            <p className="text-xs text-teal-600 font-medium">NHSRC Guidelines Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 outline-none"
          >
            <option value="Auto">🌐 Auto Detect</option>
            <option value="Hindi">🇮🇳 Hindi</option>
            <option value="Telugu">🇮🇳 Telugu</option>
            <option value="Tamil">🇮🇳 Tamil</option>
            <option value="Kannada">🇮🇳 Kannada</option>
            <option value="Malayalam">🇮🇳 Malayalam</option>
            <option value="Marathi">🇮🇳 Marathi</option>
            <option value="Bengali">🇮🇳 Bengali</option>
            <option value="Punjabi">🇮🇳 Punjabi</option>
            <option value="English">🇺🇸 English</option>
          </select>

          {
            !isEmergencyLocked && messages.length > 0 && (
              <button
                onClick={handleSummary}
                className={`bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2 ${messages[messages.length - 1].isFinal ? 'animate-pulse' : ''}`}
              >
                <span>📄 End & Summarize</span>
              </button>
            )
          }
          {
            isEmergencyLocked && (
              <button
                onClick={handleSummary}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold border border-red-700 hover:bg-red-700 transition-colors flex items-center gap-2 animate-pulse"
              >
                <span>📄 Emergency Report</span>
              </button>
            )
          }
          {
            isEmergencyLocked && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Emergency Escalated</span>
              </div>
            )
          }
        </div>
      </header >

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' :
              msg.isSummary ? 'bg-indigo-50 border-2 border-indigo-200 text-slate-900 rounded-xl' :
                'bg-white border border-gray-200 text-slate-800 rounded-tl-none'
              }`}>
              {msg.isSummary && <div className="text-xs font-bold text-indigo-600 uppercase mb-2 tracking-wide">Patient Case Summary</div>}
              <p className="whitespace-pre-wrap text-md leading-relaxed">{msg.text}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-400 w-full mb-1">Sources Used:</span>
                  {msg.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className={`text-xs px-2 py-1 rounded border flex items-center gap-1 cursor-help transition-colors ${src.type === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                        src.type === 'diagnostic' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          'bg-teal-50 border-teal-200 text-teal-700'
                        }`}
                      title={`${src.topic || 'Source'}: ${src.content.substring(0, 100)}...`}
                    >
                      <span>📄 Page {src.page}</span>
                      {src.type === 'critical' && <span className="font-bold">(!)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && !pendingData && (
          <div className="flex items-center gap-2 text-gray-400 ml-2 italic text-sm">
            <Loader2 size={16} className="animate-spin" />
            AI is checking NHSRC guidelines...
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          {pendingData !== null && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-md animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-1" size={20} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-yellow-800 mb-2">Verify Your Message (AI Repaired)</h4>
                  <div className="text-xs text-yellow-700 mb-2 font-semibold">
                    Target Language: {selectedLang !== 'Auto' ? `${selectedLang} (Selected)` : `${pendingData.language || 'Auto'} (Detected)`}
                  </div>
                  {audioUrl && <div className="mb-3"><audio src={audioUrl} controls className="w-full h-8" /></div>}
                  <textarea
                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none h-24 text-lg font-medium text-slate-800 bg-white"
                    value={pendingData.repaired}
                    onChange={(e) => setPendingData({ ...pendingData, repaired: e.target.value })}
                  />
                  <div className="flex justify-end gap-3 mt-3">
                    <button onClick={() => setPendingData(null)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                    <button onClick={handleConfirm} className="px-6 py-2 text-sm font-bold bg-teal-600 text-white rounded-lg flex items-center gap-2">
                      <Check size={18} /> Confirm & Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={isListening ? stopRecording : startRecording}
              className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-gray-100 text-slate-600'}`}
            >
              {isListening ? <Square size={20} fill="currentColor" /> : <Mic size={24} />}
            </button>

            <input
              type="text"
              className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              placeholder={isListening ? "Recording..." : "Type symptoms or answer bot..."}
              value={inputText}
              disabled={isListening}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
            />

            <button
              onClick={handleManualSend}
              disabled={!inputText.trim() || isListening}
              className="p-3 bg-teal-600 text-white rounded-xl disabled:bg-gray-300"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};

export default DocAIInterface;