import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Maximize2 } from 'lucide-react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// Shared credentials (must match Doctor side)
const APP_ID = 1481566233;
const SERVER_SECRET = "fbda77fa6dd5cc2b978c9df7738a861a";

const PatientVideoCall = ({ onClose, caseId }) => {
    // Popup dimensions and position state
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 });
    const [isMinimized, setIsMinimized] = useState(false);
    const zpRef = useRef(null);

    // Initial log
    useEffect(() => {
        console.log("PatientVideoCall MOUNTED for Case:", caseId);
        return () => console.log("PatientVideoCall UNMOUNTED");
    }, [caseId]);

    // Generate Kit Token & Join Room
    const myMeeting = async (element) => {
        if (!caseId) {
            console.error("No Case ID provided for Room ID");
            return;
        }

        const roomID = caseId; // Use caseId as Room ID
        const userName = "Patient"; // Fixed for Patient side
        const userID = "patient_" + Math.floor(Math.random() * 10000);

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            APP_ID,
            SERVER_SECRET,
            roomID,
            userID,
            userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
            container: element,
            sharedLinks: [
                {
                    name: 'Copy Link',
                    url: `${window.location.origin}/room/${roomID}`,
                },
            ],
            scenario: {
                mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showScreenSharingButton: false, // Patient usually doesn't need to screen share
            onLeaveRoom: () => {
                onClose();
            },
        });
    };

    // Drag Logic
    const handleDragStart = (e) => {
        if (isMinimized) return;

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

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // Minimized View
    if (isMinimized) {
        return createPortal(
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '300px',
                    height: '200px',
                    background: '#000',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 999999,
                    overflow: 'hidden',
                    border: '2px solid #0f766e',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <div ref={myMeeting} style={{ width: '100%', height: '100%' }} />
                </div>
                <button
                    onClick={toggleMinimize}
                    style={{
                        position: 'absolute', top: 5, right: 5,
                        background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer'
                    }}
                >
                    <Maximize2 size={16} />
                </button>
            </div>,
            document.getElementById('root') || document.body
        );
    }

    // Expanded View
    return createPortal(
        <div
            style={{
                width: size.width,
                height: size.height,
                position: 'fixed',
                top: position.y,
                left: position.x,
                zIndex: 999999,
                background: '#1e293b',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #334155'
            }}
        >
            {/* Header */}
            <div
                onMouseDown={handleDragStart}
                style={{
                    padding: '8px 12px',
                    background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'grab', borderBottom: '1px solid #334155'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'white', fontWeight: '600' }}>Video Consultation</span>
                    <span style={{ background: '#22c55e', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={toggleMinimize} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Minus size={18} /></button>
                    <button onClick={() => { if (zpRef.current) zpRef.current.destroy(); onClose(); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                </div>
            </div>

            {/* Zego Container */}
            <div
                ref={myMeeting}
                style={{ width: '100%', height: '100%', background: '#000' }}
            />
        </div>,
        document.getElementById('root') || document.body
    );
};

export default PatientVideoCall;
