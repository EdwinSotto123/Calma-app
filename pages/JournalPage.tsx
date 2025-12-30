import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { ArrowLeft, Sparkles, Heart, Moon, Sun, CloudRain, Zap, Coffee, Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DailyLog, Mood } from '../types';

const PROMPTS = [
    "¿Qué fue lo mejor de hoy?",
    "¿Qué te hizo sonreír?",
    "¿Qué aprendiste hoy?",
    "¿Qué te costó hoy?",
    "¿Qué necesitas soltar?",
    "¿Cómo te cuidaste hoy?",
];

const FEELINGS = [
    { id: 'grateful', emoji: '🙏', label: 'Agradecido/a', color: 'bg-amber-100 border-amber-300 text-amber-700' },
    { id: 'calm', emoji: '😌', label: 'En calma', color: 'bg-teal-100 border-teal-300 text-teal-700' },
    { id: 'happy', emoji: '😊', label: 'Feliz', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
    { id: 'tired', emoji: '😴', label: 'Cansado/a', color: 'bg-indigo-100 border-indigo-300 text-indigo-700' },
    { id: 'anxious', emoji: '😰', label: 'Ansioso/a', color: 'bg-purple-100 border-purple-300 text-purple-700' },
    { id: 'sad', emoji: '😢', label: 'Triste', color: 'bg-blue-100 border-blue-300 text-blue-700' },
    { id: 'angry', emoji: '😤', label: 'Frustrado/a', color: 'bg-rose-100 border-rose-300 text-rose-700' },
    { id: 'hopeful', emoji: '🌟', label: 'Esperanzado/a', color: 'bg-pink-100 border-pink-300 text-pink-700' },
];

const JournalPage: React.FC = () => {
    const { userState, logDailyEntry } = useApp();

    const getTodayString = () => new Date().toISOString().split('T')[0];
    const [step, setStep] = useState(0);
    const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
    const [reflection, setReflection] = useState('');
    const [gratitude, setGratitude] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const todayPrompt = PROMPTS[new Date().getDay() % PROMPTS.length];

    // Get time of day
    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Buenos días', icon: Coffee, color: 'text-amber-500' };
        if (hour < 18) return { text: 'Buenas tardes', icon: Sun, color: 'text-orange-500' };
        return { text: 'Buenas noches', icon: Moon, color: 'text-indigo-500' };
    };

    const timeGreeting = getTimeGreeting();

    const toggleFeeling = (id: string) => {
        setSelectedFeelings(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        const mood: Mood = selectedFeelings.includes('happy') || selectedFeelings.includes('grateful') || selectedFeelings.includes('calm')
            ? Mood.Great
            : selectedFeelings.includes('sad') || selectedFeelings.includes('anxious')
                ? Mood.Sad
                : Mood.Okay;

        const entry: DailyLog = {
            date: getTodayString(),
            mood,
            medicationTaken: false,
            notes: `Sentimientos: ${selectedFeelings.join(', ')}\n\nReflexión: ${reflection}`,
            gratitudeText: gratitude,
        };

        logDailyEntry(entry);
        setIsSaved(true);
    };

    // Success screen
    if (isSaved) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="bg-gradient-to-br from-teal-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-teal-200">
                    <Check size={40} className="text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Entrada guardada 💚</h1>
                <p className="text-slate-500 mb-6">Gracias por tomarte este momento para ti.</p>
                <Link to="/wellness" className="bg-slate-100 px-6 py-3 rounded-xl font-bold text-slate-600">
                    Volver a Bienestar
                </Link>
            </div>
        );
    }

    return (
        <div className="p-5 pb-24 min-h-full">
            {/* Header */}
            <header className="flex items-center gap-3 mb-6">
                <Link to="/wellness" className="p-2 bg-slate-100 rounded-xl text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-800">Mi Diario</h1>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                        {React.createElement(timeGreeting.icon, { size: 14, className: timeGreeting.color })}
                        <span>{new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                </div>
            </header>

            {/* Step 1: How are you feeling? */}
            {step === 0 && (
                <div className="animate-fade-in space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">¿Cómo te sientes ahora?</h2>
                        <p className="text-slate-500 text-sm">Puedes elegir varios</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {FEELINGS.map(feeling => (
                            <button
                                key={feeling.id}
                                onClick={() => toggleFeeling(feeling.id)}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${selectedFeelings.includes(feeling.id)
                                    ? `${feeling.color} border-2 scale-[1.02]`
                                    : 'bg-white border-slate-100 text-slate-600'
                                    }`}
                            >
                                <span className="text-2xl">{feeling.emoji}</span>
                                <span className="font-bold text-sm">{feeling.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep(1)}
                        disabled={selectedFeelings.length === 0}
                        className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 ${selectedFeelings.length === 0 ? 'bg-slate-300' : 'bg-teal-500 shadow-lg shadow-teal-200'
                            }`}
                    >
                        Continuar <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Step 2: Reflection */}
            {step === 1 && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-5 rounded-2xl text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={20} className="text-yellow-200" />
                            <span className="text-indigo-200 text-xs font-bold uppercase">Reflexión del día</span>
                        </div>
                        <p className="text-xl font-bold">{todayPrompt}</p>
                    </div>

                    <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="Escribe lo que sientes... No hay respuestas correctas o incorrectas."
                        className="w-full h-40 p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-sm"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep(0)}
                            className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-4 rounded-2xl font-bold text-white bg-teal-500 shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
                        >
                            Continuar <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Gratitude */}
            {step === 2 && (
                <div className="animate-fade-in space-y-6">
                    <div className="text-center">
                        <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart size={28} className="text-amber-500" fill="currentColor" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Un momento de gratitud</h2>
                        <p className="text-slate-500 text-sm">¿Por qué pequeña cosa estás agradecido/a hoy?</p>
                    </div>

                    <textarea
                        value={gratitude}
                        onChange={(e) => setGratitude(e.target.value)}
                        placeholder="Hoy agradezco por..."
                        className="w-full h-32 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-slate-700 placeholder:text-amber-400 focus:ring-2 focus:ring-amber-200 outline-none resize-none text-sm"
                    />

                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-slate-500 text-xs mb-2">Tu resumen:</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedFeelings.map(id => {
                                const feeling = FEELINGS.find(f => f.id === id);
                                return feeling ? (
                                    <span key={id} className="bg-white px-3 py-1 rounded-full text-sm border border-slate-200">
                                        {feeling.emoji} {feeling.label}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-200"
                        >
                            Guardar 💚
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalPage;