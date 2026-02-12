import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Maximize2 } from 'lucide-react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// Shared credentials
// Shared credentials
const APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID);
const SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET;

const VideoPopup = ({ onClose, caseId }) => {
    // Popup dimensions and position state
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 });
    const [isMinimized, setIsMinimized] = useState(false);
    const [showDebug, setShowDebug] = useState(true); // [DEBUG]
    const zpRef = useRef(null); // [FIX] Restore zpRef


    // Initial log
    useEffect(() => {
        // [FIX] Safety check for container and caseId
        if (!containerRef.current || !caseId) {
            console.warn("VideoPopup: Missing container ref or caseId", { container: !!containerRef.current, caseId });
            return;
        }

        console.log("Doctor VideoPopup MOUNTED for Case:", caseId);
        return () => console.log("Doctor VideoPopup UNMOUNTED");
    }, [caseId]);

    // Container ref
    const containerRef = useRef(null);

    // Initialize Zego
    useEffect(() => {
        if (!caseId || !containerRef.current) return;

        const roomID = caseId;
        const userName = "Doctor";
        const userID = "doctor_" + Math.floor(Math.random() * 10000);

        console.log("Initializing Zego for Room:", roomID);

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
            container: containerRef.current,
            sharedLinks: [
                {
                    name: 'Copy Link',
                    url: `${window.location.origin}/room/${roomID}`,
                },
            ],
            scenario: {
                mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showScreenSharingButton: true,
            onLeaveRoom: () => {
                onClose();
            },
        });

        // Cleanup
        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        };
    }, [caseId]);

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
                    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
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
            {/* [DEBUG] Overlay */}
            {showDebug && (
                <div style={{ position: 'absolute', top: 50, left: 10, background: 'red', color: 'white', zIndex: 1000000, padding: 10 }}>
                    DEBUG:
                    <br />CaseID: {caseId || "UNDEFINED"}
                    <br />Size: {size.width}x{size.height}
                    <button onClick={() => setShowDebug(false)}>Hide</button>
                </div>
            )}

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
                ref={containerRef}
                style={{ width: '100%', height: '100%', background: '#000' }}
            />
        </div>,
        document.getElementById('root') || document.body
    );
};

export default VideoPopup;
