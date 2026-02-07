import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Video, Mic, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';

const VideoPopup = ({ onClose, patientName = "Patient" }) => {
    // Popup dimensions and position state
    // Default size increased to 600x450
    const [size, setSize] = useState({ width: 600, height: 450 });
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 225 });
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Initial log
    useEffect(() => {
        console.log("VideoPopup MOUNTED");
        return () => console.log("VideoPopup UNMOUNTED");
    }, []);

    // Drag Logic
    const handleDragStart = (e) => {
        if (isMinimized) return; // Disable drag when minimized (optional, can enable if needed)

        e.preventDefault();
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;

        const onMouseMove = (moveEvent) => {
            setPosition({
                x: moveEvent.clientX - startX,
                y: moveEvent.clientY - startY
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Resize logic
    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const onMouseMove = (moveEvent) => {
            const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(225, startHeight + (moveEvent.clientY - startY));
            setSize({ width: newWidth, height: newHeight });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // Minimized View (YouTube-style PiP)
    // Minimized Position State
    const [minPosition, setMinPosition] = useState({ x: window.innerWidth - 310, y: window.innerHeight - 200 });

    // Drag Logic for Minimized View
    const handleMinDragStart = (e) => {
        e.preventDefault();
        const startX = e.clientX - minPosition.x;
        const startY = e.clientY - minPosition.y;

        const onMouseMove = (moveEvent) => {
            setMinPosition({
                x: moveEvent.clientX - startX,
                y: moveEvent.clientY - startY
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Minimized View (YouTube-style PiP)
    if (isMinimized) {
        return createPortal(
            <div
                className="video-popup-minimized"
                onMouseDown={handleMinDragStart}
                style={{
                    position: 'fixed',
                    top: minPosition.y,
                    left: minPosition.x,
                    width: '280px',
                    height: '160px',
                    background: '#020617',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 999999,
                    overflow: 'hidden',
                    border: '1px solid #334155',
                    transition: 'width 0.3s, height 0.3s', // Animate size changes only
                    cursor: 'grab'
                }}
            >
                {/* Mini Player Content */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                    <div style={{ textAlign: 'center', color: '#64748b', transform: 'scale(0.8)' }}>
                        <Video size={40} style={{ opacity: 0.5, marginBottom: '4px' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{patientName}</div>
                    </div>

                    {/* Overlay Controls */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                        <button
                            onClick={toggleMinimize}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px', height: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', cursor: 'pointer',
                                backdropFilter: 'blur(4px)'
                            }}
                            title="Expand"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </div>
            </div>,
            document.getElementById('root') || document.body
        );
    }

    // Expanded View (Standard Video Popup)
    return createPortal(
        <div
            className="video-popup-container"
            style={{
                width: size.width,
                height: size.height,
                position: 'fixed',
                top: position.y,
                left: position.x,
                // transform: 'translate(-50%, -50%)', // Removed for manual positioning
                zIndex: 999999,
                background: '#0f172a',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #334155'
            }}
        >
            {/* Header - DRAGGABLE TRIGGER */}
            <div
                className="popup-header"
                onMouseDown={handleDragStart}
                style={{
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'grab',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                    <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>{patientName}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={toggleMinimize} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                        <Minus size={14} />
                    </button>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Video Content */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
                <div style={{ textAlign: 'center', color: '#475569' }}>
                    <Video size={48} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.8rem' }}>Connecting...</div>
                </div>

                {/* Floating Controls */}
                <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(4px)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                        <Mic size={18} />
                    </button>
                    <button style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={onClose}>
                        <PhoneOff size={14} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                        <Video size={18} />
                    </button>
                </div>
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleResizeStart}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '20px',
                    height: '20px',
                    cursor: 'nwse-resize',
                    zIndex: 10,
                    background: 'transparent'
                }}
            >
                <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '0',
                    height: '0',
                    borderStyle: 'solid',
                    borderWidth: '0 0 8px 8px',
                    borderColor: 'transparent transparent #64748b transparent'
                }}></div>
            </div>
        </div>,
        document.getElementById('root') || document.body
    );
};

export default VideoPopup;
