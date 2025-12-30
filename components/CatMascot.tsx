import React from 'react';

export type CatMood = 'wave' | 'curious' | 'doctor' | 'phone' | 'mirror' | 'celebrate' | 'sleeping' | 'happy';

interface CatMascotProps {
    mood: CatMood;
    size?: number;
    message?: string;
    animate?: boolean;
    showVideo?: boolean;
}

const CatMascot: React.FC<CatMascotProps> = ({ mood, size = 200, message, animate = true, showVideo = false }) => {

    const getMoodEmoji = () => {
        switch (mood) {
            case 'wave': return '👋';
            case 'curious': return '🧐';
            case 'doctor': return '💊';
            case 'phone': return '📱';
            case 'mirror': return '🪞';
            case 'celebrate': return '🎉';
            case 'sleeping': return '😴';
            case 'happy': return '😊';
            default: return '😺';
        }
    };

    const getMoodGradient = () => {
        switch (mood) {
            case 'celebrate': return 'from-amber-300 via-rose-300 to-pink-300';
            case 'sleeping': return 'from-indigo-200 via-purple-200 to-blue-200';
            case 'doctor': return 'from-teal-200 via-cyan-200 to-blue-200';
            case 'phone': return 'from-violet-200 via-purple-200 to-indigo-200';
            default: return 'from-teal-200 via-emerald-200 to-cyan-200';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Cat Avatar */}
            <div
                className={`relative rounded-full bg-gradient-to-br ${getMoodGradient()} p-2 shadow-xl ${animate ? 'animate-float' : ''}`}
                style={{ width: size, height: size }}
            >
                {/* Video or Static Cat */}
                {showVideo ? (
                    <video
                        src="/assets/gatos_gift/gato_saludo.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-white/60 flex items-center justify-center overflow-hidden">
                        {/* Animated Cat Face SVG */}
                        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
                            {/* Cat Ears */}
                            <path d="M20 40 L35 15 L40 40" fill="#FCD9B4" stroke="#E5C4A1" strokeWidth="2" />
                            <path d="M80 40 L65 15 L60 40" fill="#FCD9B4" stroke="#E5C4A1" strokeWidth="2" />
                            <path d="M25 35 L35 20 L38 35" fill="#FFB6C1" />
                            <path d="M75 35 L65 20 L62 35" fill="#FFB6C1" />

                            {/* Cat Face */}
                            <ellipse cx="50" cy="55" rx="30" ry="28" fill="#FCD9B4" stroke="#E5C4A1" strokeWidth="2" />

                            {/* Eyes */}
                            {mood === 'sleeping' ? (
                                <>
                                    <path d="M35 50 Q40 55 45 50" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                                    <path d="M55 50 Q60 55 65 50" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                                </>
                            ) : (
                                <>
                                    <ellipse cx="40" cy="50" rx="5" ry="6" fill="#333" />
                                    <ellipse cx="60" cy="50" rx="5" ry="6" fill="#333" />
                                    <circle cx="42" cy="48" r="2" fill="white" />
                                    <circle cx="62" cy="48" r="2" fill="white" />
                                </>
                            )}

                            {/* Nose */}
                            <ellipse cx="50" cy="60" rx="3" ry="2" fill="#FFB6C1" />

                            {/* Mouth */}
                            {mood === 'happy' || mood === 'celebrate' ? (
                                <path d="M45 65 Q50 72 55 65" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                            ) : (
                                <>
                                    <path d="M50 62 L50 66" stroke="#333" strokeWidth="1.5" />
                                    <path d="M45 68 Q50 72 55 68" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </>
                            )}

                            {/* Whiskers */}
                            <line x1="25" y1="55" x2="35" y2="58" stroke="#E5C4A1" strokeWidth="1" />
                            <line x1="25" y1="60" x2="35" y2="60" stroke="#E5C4A1" strokeWidth="1" />
                            <line x1="25" y1="65" x2="35" y2="62" stroke="#E5C4A1" strokeWidth="1" />
                            <line x1="75" y1="55" x2="65" y2="58" stroke="#E5C4A1" strokeWidth="1" />
                            <line x1="75" y1="60" x2="65" y2="60" stroke="#E5C4A1" strokeWidth="1" />
                            <line x1="75" y1="65" x2="65" y2="62" stroke="#E5C4A1" strokeWidth="1" />

                            {/* Blush */}
                            <ellipse cx="30" cy="58" rx="5" ry="3" fill="#FFB6C1" opacity="0.5" />
                            <ellipse cx="70" cy="58" rx="5" ry="3" fill="#FFB6C1" opacity="0.5" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Speech Bubble */}
            {message && (
                <div className="relative bg-white px-5 py-3 rounded-2xl shadow-lg max-w-xs text-center animate-fade-in">
                    {/* Arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-sm"></div>
                    <p className="text-slate-700 font-medium text-sm leading-relaxed relative z-10">{message}</p>
                </div>
            )}
        </div>
    );
};

export default CatMascot;
