import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Camera, Check, Trophy, Star, Zap, X, Award, Target, Sparkles } from 'lucide-react';
import { Challenge, CompletedChallenge, StreakData } from '../types';
import { useApp } from '../App';
import { getStreakData, addCompletedChallenge, validateStreak } from '../services/firebaseService';

// Daily challenges pool
const CHALLENGES: Challenge[] = [
    { id: 'walk', title: 'Salir a caminar', description: 'Camina al menos 10 minutos', emoji: '🚶', points: 50, verificationType: 'photo', category: 'movement' },
    { id: 'water', title: 'Hidratarte', description: 'Toma un vaso de agua', emoji: '💧', points: 10, verificationType: 'check', category: 'selfcare' },
    { id: 'breathe', title: 'Respirar consciente', description: '2 minutos de respiración', emoji: '🧘', points: 20, verificationType: 'check', category: 'mindfulness' },
    { id: 'journal', title: 'Escribir en el diario', description: 'Registra cómo te sientes', emoji: '📓', points: 30, verificationType: 'check', category: 'mindfulness' },
    { id: 'connect', title: 'Contactar a alguien', description: 'Envía un mensaje a alguien querido', emoji: '💬', points: 40, verificationType: 'photo', category: 'social' },
    { id: 'sunlight', title: 'Tomar sol 5 min', description: 'Exponte a luz natural', emoji: '☀️', points: 30, verificationType: 'photo', category: 'selfcare' },
    { id: 'stretch', title: 'Estirar el cuerpo', description: 'Estira por 3 minutos', emoji: '🤸', points: 20, verificationType: 'check', category: 'movement' },
    { id: 'gratitude', title: 'Agradecer algo', description: 'Piensa en 3 cosas buenas', emoji: '🙏', points: 25, verificationType: 'check', category: 'mindfulness' },
];

// Milestones/Badges
const BADGES = [
    { days: 3, emoji: '🌱', title: 'Brote', description: 'Primera racha de 3 días' },
    { days: 7, emoji: '🌿', title: 'Crecimiento', description: 'Una semana completa' },
    { days: 14, emoji: '🌳', title: 'Raíces', description: 'Dos semanas seguidas' },
    { days: 30, emoji: '🏆', title: 'Campeón', description: 'Un mes de constancia' },
    { days: 60, emoji: '💎', title: 'Diamante', description: 'Dos meses de dedicación' },
    { days: 90, emoji: '👑', title: 'Leyenda', description: 'Tres meses invencible' },
];

const getTodayString = () => new Date().toISOString().split('T')[0];

// Get 4 random challenges for today (seeded by date)
const getTodayChallenges = (): Challenge[] => {
    const today = getTodayString();
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const shuffled = [...CHALLENGES].sort((a, b) => {
        const hashA = (seed * a.id.charCodeAt(0)) % 100;
        const hashB = (seed * b.id.charCodeAt(0)) % 100;
        return hashA - hashB;
    });
    return shuffled.slice(0, 4);
};

const ChallengesPage: React.FC = () => {
    const { firebaseUser } = useApp();
    const [streakData, setStreakData] = useState<StreakData>({
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: '',
        totalPoints: 0,
        completedChallenges: [],
    });
    const [todayChallenges] = useState<Challenge[]>(getTodayChallenges());
    const [showCamera, setShowCamera] = useState(false);
    const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationPoints, setCelebrationPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load streak data from Firestore
    useEffect(() => {
        if (firebaseUser?.uid) {
            validateStreak(firebaseUser.uid).then(data => {
                setStreakData(data);
                setLoading(false);
            });
        }
    }, [firebaseUser]);

    // Check if challenge is completed today
    const isChallengeCompletedToday = (challengeId: string) => {
        return streakData.completedChallenges.some(
            c => c.challengeId === challengeId && c.date === getTodayString()
        );
    };

    // Complete a challenge
    const completeChallenge = async (challengeId: string, photoUrl?: string) => {
        if (isChallengeCompletedToday(challengeId) || !firebaseUser?.uid) return;

        const challenge = CHALLENGES.find(c => c.id === challengeId);
        if (!challenge) return;

        const completed: CompletedChallenge = {
            challengeId,
            completedAt: Date.now(),
            date: getTodayString(),
            photoUrl,
        };

        try {
            const newData = await addCompletedChallenge(firebaseUser.uid, completed, challenge.points);
            setStreakData(newData);

            // Show celebration
            setCelebrationPoints(challenge.points);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
        } catch (error) {
            console.error('Error completing challenge:', error);
        }

        setShowCamera(false);
        setCapturedPhoto(null);
        setCurrentChallengeId(null);
    };

    // Camera functions
    const startCamera = async (challengeId: string) => {
        setCurrentChallengeId(challengeId);
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera error:', err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);

        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const closeCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
        }
        setShowCamera(false);
        setCapturedPhoto(null);
        setCurrentChallengeId(null);
    };

    const todayCompleted = streakData.completedChallenges.filter(c => c.date === getTodayString()).length;
    const earnedBadges = BADGES.filter(b => streakData.longestStreak >= b.days);
    const nextBadge = BADGES.find(b => streakData.currentStreak < b.days);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Flame size={40} className="text-orange-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500">Cargando retos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 pb-24 min-h-full bg-gradient-to-b from-orange-50 to-white">
            {/* Celebration Animation */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center animate-bounce">
                        <Sparkles size={48} className="text-amber-500 mx-auto mb-4" />
                        <p className="text-3xl font-black text-slate-800">+{celebrationPoints}</p>
                        <p className="text-slate-500 font-bold">¡PUNTOS!</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center gap-3 mb-6">
                <Link to="/wellness" className="p-2 bg-white rounded-xl text-slate-500 shadow-sm">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-extrabold text-slate-800">Retos del Día</h1>
                    <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </header>

            {/* Streak Display */}
            <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-5 rounded-2xl text-white mb-4 shadow-lg shadow-orange-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Flame size={32} className={streakData.currentStreak > 0 ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <p className="text-orange-100 text-xs font-bold uppercase">Racha Actual</p>
                            <p className="text-4xl font-black">{streakData.currentStreak} <span className="text-lg font-normal">días</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-orange-200 text-sm">
                            <Trophy size={14} /> Record: {streakData.longestStreak}
                        </div>
                        <div className="flex items-center gap-1 text-orange-200 text-sm mt-1">
                            <Star size={14} /> {streakData.totalPoints} pts
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-orange-200 mb-1">
                        <span>Hoy: {todayCompleted}/{todayChallenges.length}</span>
                        <span>{Math.round((todayCompleted / todayChallenges.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${(todayCompleted / todayChallenges.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Next badge hint */}
                {nextBadge && (
                    <div className="mt-4 bg-white/10 p-3 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">{nextBadge.emoji}</span>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{nextBadge.title}</p>
                            <p className="text-xs text-orange-200">{nextBadge.days - streakData.currentStreak} días para desbloquear</p>
                        </div>
                        <Target size={18} className="text-orange-200" />
                    </div>
                )}
            </div>

            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award size={16} className="text-amber-500" />
                        <span className="text-xs font-bold text-slate-600">Insignias Ganadas</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {earnedBadges.map((badge, i) => (
                            <div key={i} className="bg-gradient-to-br from-amber-100 to-yellow-100 px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 border border-amber-200">
                                <span className="text-xl">{badge.emoji}</span>
                                <div>
                                    <p className="text-sm font-bold text-amber-800">{badge.title}</p>
                                    <p className="text-[10px] text-amber-600">{badge.days} días</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Challenges List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <Target size={16} className="text-teal-500" /> Retos de Hoy
                </h3>
                {todayChallenges.map(challenge => {
                    const isCompleted = isChallengeCompletedToday(challenge.id);

                    return (
                        <div
                            key={challenge.id}
                            className={`bg-white p-4 rounded-2xl border-2 transition-all ${isCompleted
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-slate-100 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`text-3xl ${isCompleted ? 'grayscale' : ''}`}>
                                    {challenge.emoji}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${isCompleted ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                                        {challenge.title}
                                    </h3>
                                    <p className="text-xs text-slate-500">{challenge.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-orange-500">+{challenge.points} pts</span>
                                        {challenge.verificationType === 'photo' && (
                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">📷 Foto</span>
                                        )}
                                    </div>
                                </div>

                                {isCompleted ? (
                                    <div className="bg-green-500 p-2 rounded-full text-white">
                                        <Check size={20} />
                                    </div>
                                ) : challenge.verificationType === 'photo' ? (
                                    <button
                                        onClick={() => startCamera(challenge.id)}
                                        className="bg-blue-500 p-3 rounded-xl text-white flex items-center gap-2 text-sm font-bold active:scale-95 transition-transform"
                                    >
                                        <Camera size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => completeChallenge(challenge.id)}
                                        className="bg-teal-500 p-3 rounded-xl text-white flex items-center gap-2 text-sm font-bold active:scale-95 transition-transform"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Day Completed */}
            {todayCompleted === todayChallenges.length && (
                <div className="mt-6 bg-gradient-to-r from-teal-500 to-emerald-500 p-5 rounded-2xl text-white text-center animate-fade-in">
                    <Zap size={32} className="mx-auto mb-2" />
                    <h3 className="font-bold text-lg">¡Día completado! 🎉</h3>
                    <p className="text-teal-100 text-sm">Increíble trabajo. Vuelve mañana para más retos.</p>
                </div>
            )}

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    <div className="flex items-center justify-between p-4 text-white">
                        <button onClick={closeCamera} className="p-2">
                            <X size={24} />
                        </button>
                        <span className="font-bold">
                            {CHALLENGES.find(c => c.id === currentChallengeId)?.title}
                        </span>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 relative">
                        {!capturedPhoto ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                                    <button
                                        onClick={capturePhoto}
                                        className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 shadow-lg active:scale-95 transition-transform"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                                    <button
                                        onClick={() => setCapturedPhoto(null)}
                                        className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold"
                                    >
                                        Repetir
                                    </button>
                                    <button
                                        onClick={() => completeChallenge(currentChallengeId!, capturedPhoto)}
                                        className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                                    >
                                        <Check size={20} /> Verificar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}
        </div>
    );
};

export default ChallengesPage;
