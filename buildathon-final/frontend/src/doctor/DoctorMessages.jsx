import React, { useState } from 'react';
import {
    Search, MoreVertical, Send, Paperclip, Phone, Video,
    Check, CheckCircle, Clock, User, Mic
} from 'lucide-react';

const MOCK_CHATS = [
    {
        id: 1,
        name: "Rahul Verma",
        role: "Patient",
        lastMessage: "Thank you doctor, the pain has subsided.",
        time: "10:30 AM",
        unread: 0,
        online: true,
        avatar: "RV"
    },
    {
        id: 2,
        name: "Dr. Sarah Jenkins",
        role: "Neurologist",
        lastMessage: "I've reviewed the MRI scans.",
        time: "Yesterday",
        unread: 2,
        online: false,
        avatar: "SJ"
    },
    {
        id: 3,
        name: "Amit Patel",
        role: "Patient",
        lastMessage: "Can we reschedule my appointment?",
        time: "Yesterday",
        unread: 0,
        online: true,
        avatar: "AP"
    },
    {
        id: 4,
        name: "Pharmacy: Central",
        role: "Staff",
        lastMessage: "Stock update request approved.",
        time: "Mon",
        unread: 1,
        online: true,
        avatar: "PH"
    }
];

const MOCK_MESSAGES = [
    { id: 1, sender: 'them', text: "Good morning Doctor.", time: "10:00 AM" },
    { id: 2, sender: 'them', text: "I tried the new medication you prescribed.", time: "10:01 AM" },
    { id: 3, sender: 'me', text: "Good morning. How are you feeling now? Any side effects?", time: "10:02 AM", status: 'read' },
    { id: 4, sender: 'them', text: "Much better, no headaches. Just slight nausea.", time: "10:05 AM" },
    { id: 5, sender: 'them', text: "Should I continue taking it?", time: "10:05 AM" }
];

const DoctorMessages = () => {
    const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [filter, setFilter] = useState("All");

    const handleSend = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, {
            id: messages.length + 1,
            sender: 'me',
            text: inputText,
            time: "Now",
            status: 'sent'
        }]);
        setInputText("");
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', height: 'calc(100vh - 140px)', gap: '1.5rem' }}>

            {/* Left: Chat List */}
            <div style={{
                background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                {/* Search & Filter */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#1e293b' }}>Messages</h2>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search patients or staff..."
                            style={{
                                width: '100%', padding: '10px 10px 10px 36px',
                                borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['All', 'Patient', 'Staff'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 12px', borderRadius: '20px', border: 'none', fontSize: '0.85rem',
                                    background: filter === f ? '#0f766e' : '#f1f5f9',
                                    color: filter === f ? 'white' : '#64748b',
                                    cursor: 'pointer'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {MOCK_CHATS.filter(c => filter === 'All' || c.role === filter).map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            style={{
                                padding: '1rem', cursor: 'pointer',
                                background: selectedChat.id === chat.id ? '#f0fdfa' : 'transparent',
                                borderLeft: selectedChat.id === chat.id ? '4px solid #0f766e' : '4px solid transparent',
                                borderBottom: '1px solid #f8fafc',
                                display: 'flex', gap: '12px', alignItems: 'center'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '600', color: '#475569'
                                }}>
                                    {chat.avatar}
                                </div>
                                {chat.online && <div style={{
                                    width: '12px', height: '12px', background: '#22c55e', border: '2px solid white',
                                    borderRadius: '50%', position: 'absolute', bottom: 0, right: 0
                                }}></div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 style={{ margin: 0, color: '#1e293b' }}>{chat.name}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{chat.time}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <span style={{
                                            background: '#0f766e', color: 'white', fontSize: '0.7rem',
                                            padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center'
                                        }}>
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Chat Window */}
            <div style={{
                background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedChat.avatar}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{selectedChat.name}</h3>
                            <span style={{ fontSize: '0.85rem', color: '#22c55e' }}>Online</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Phone size={20} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Video size={20} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                                maxWidth: '70%'
                            }}
                        >
                            <div style={{
                                background: msg.sender === 'me' ? '#0f766e' : 'white',
                                color: msg.sender === 'me' ? 'white' : '#1e293b',
                                padding: '12px 16px', borderRadius: '16px',
                                borderTopRightRadius: msg.sender === 'me' ? '4px' : '16px',
                                borderTopLeftRadius: msg.sender === 'me' ? '16px' : '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                border: msg.sender === 'me' ? 'none' : '1px solid #e2e8f0'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                                gap: '4px', marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8'
                            }}>
                                {msg.time} {msg.sender === 'me' && <CheckCircle size={12} color="#0f766e" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                    {/* Quick Replies */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', overflowX: 'auto' }}>
                        {["Take rest", "Come for checkup", "Continue meds", "Looks good"].map(reply => (
                            <button
                                key={reply}
                                onClick={() => setInputText(reply)}
                                style={{
                                    padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0',
                                    background: 'white', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {reply}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Paperclip size={20} /></button>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                outline: 'none', background: '#f8fafc'
                            }}
                        />
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Mic size={20} /></button>
                        <button
                            onClick={handleSend}
                            style={{
                                background: '#0f766e', color: 'white', border: 'none',
                                padding: '10px 14px', borderRadius: '10px', cursor: 'pointer'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorMessages;
