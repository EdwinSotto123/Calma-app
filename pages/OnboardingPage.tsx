import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CatMascot, { CatMood } from '../components/CatMascot';
import { ArrowRight, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';
import { Mood, Contact, Medication } from '../types';
import MoodSelector from '../components/MoodSelector';
import PhoneInputWithCountry from '../components/PhoneInputWithCountry';

interface OnboardingData {
    name: string;
    takesMedication: boolean;
    medications: Medication[];
    emergencyContact: Contact | null;
    baselineMood: Mood | null;
}

interface OnboardingPageProps {
    onComplete: (data: OnboardingData) => void;
}

const STEPS = [
    { id: 'welcome', title: 'Bienvenida', catMood: 'wave' as CatMood },
    { id: 'name', title: 'Tu Nombre', catMood: 'curious' as CatMood },
    { id: 'medication', title: 'Medicación', catMood: 'doctor' as CatMood },
    { id: 'contact', title: 'Red de Apoyo', catMood: 'phone' as CatMood },
    { id: 'mood', title: 'Tu Ánimo', catMood: 'mirror' as CatMood },
    { id: 'complete', title: '¡Listo!', catMood: 'celebrate' as CatMood },
];

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    // Form Data
    const [name, setName] = useState('');
    const [takesMedication, setTakesMedication] = useState(false);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [newMedName, setNewMedName] = useState('');
    const [newMedFreq, setNewMedFreq] = useState<'daily' | 'twice' | 'thrice' | 'asNeeded'>('daily');
    const [newMedTime, setNewMedTime] = useState('08:00');

    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactRelation, setContactRelation] = useState('');

    const [baselineMood, setBaselineMood] = useState<Mood | null>(null);

    const step = STEPS[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === STEPS.length - 1;

    const canProceed = () => {
        switch (step.id) {
            case 'name': return name.trim().length >= 2;
            case 'medication': return !takesMedication || medications.length > 0;
            case 'contact': return true; // Optional
            case 'mood': return baselineMood !== null;
            default: return true;
        }
    };

    const nextStep = () => {
        if (isLastStep) {
            // Complete onboarding
            onComplete({
                name,
                takesMedication,
                medications,
                emergencyContact: contactName ? {
                    id: Date.now().toString(),
                    name: contactName,
                    phone: contactPhone,
                    relation: contactRelation,
                } : null,
                baselineMood,
            });
            navigate('/');
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const addMedication = () => {
        if (newMedName.trim()) {
            setMedications(prev => [...prev, {
                id: Date.now().toString(),
                name: newMedName,
                frequency: newMedFreq,
                time: newMedTime,
                enabled: true,
            }]);
            setNewMedName('');
        }
    };

    const removeMedication = (id: string) => {
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return '1x día';
            case 'twice': return '2x día';
            case 'thrice': return '3x día';
            case 'asNeeded': return 'Si necesito';
            default: return freq;
        }
    };

    const getCatMessage = () => {
        switch (step.id) {
            case 'welcome': return '¡Hola! Soy Michi y seré tu compañero. 🐾';
            case 'name': return '¿Cómo te gustaría que te llame?';
            case 'medication': return '¿Tomas alguna pastillita? No te preocupes, es confidencial.';
            case 'contact': return '¿A quién llamo si necesitas un abrazo? 💙';
            case 'mood': return '¿Cómo te sientes normalmente?';
            case 'complete': return `¡${name || 'Amigo'}! Ya estamos listos para este viaje juntos. 🎉`;
            default: return '';
        }
    };

    const renderStepContent = () => {
        switch (step.id) {
            case 'welcome':
                return (
                    <div className="text-center space-y-4 animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-800">Bienvenido/a a Calma</h2>
                        <p className="text-slate-600">
                            Esta app es tu espacio seguro. Vamos a configurarla juntos en solo unos minutos.
                        </p>
                        <div className="flex gap-2 justify-center mt-6">
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">Sin juicios</span>
                            <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">Privado</span>
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Tu ritmo</span>
                        </div>
                    </div>
                );

            case 'name':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="text-sm font-bold text-slate-600 block mb-2">Mi nombre es...</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Escribe tu nombre"
                                autoFocus
                                className="w-full px-5 py-4 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-700 text-lg placeholder:text-slate-400 focus:ring-2 focus:ring-teal-200 focus:border-teal-300 outline-none transition-all text-center"
                            />
                        </div>
                        {name && (
                            <p className="text-center text-slate-500 animate-fade-in">
                                ¡Encantado de conocerte, <span className="text-teal-600 font-bold">{name}</span>!
                            </p>
                        )}
                    </div>
                );

            case 'medication':
                return (
                    <div className="space-y-6 animate-fade-in">
                        {/* Toggle */}
                        <div
                            onClick={() => setTakesMedication(!takesMedication)}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${takesMedication
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-700">¿Tomas medicación para tu salud mental?</h3>
                                    <p className="text-xs text-slate-500 mt-1">Te ayudaré con recordatorios</p>
                                </div>
                                <div className={`w-14 h-8 rounded-full p-1 transition-colors ${takesMedication ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${takesMedication ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Medication List */}
                        {takesMedication && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Add New */}
                                <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                                    <input
                                        type="text"
                                        value={newMedName}
                                        onChange={(e) => setNewMedName(e.target.value)}
                                        placeholder="Nombre del medicamento"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <select
                                            value={newMedFreq}
                                            onChange={(e) => setNewMedFreq(e.target.value as any)}
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        >
                                            <option value="daily">1 vez al día</option>
                                            <option value="twice">2 veces al día</option>
                                            <option value="thrice">3 veces al día</option>
                                            <option value="asNeeded">Según necesite</option>
                                        </select>
                                        <input
                                            type="time"
                                            value={newMedTime}
                                            onChange={(e) => setNewMedTime(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={addMedication}
                                        disabled={!newMedName.trim()}
                                        className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
                                    >
                                        <Plus size={18} /> Agregar
                                    </button>
                                </div>

                                {/* List */}
                                {medications.map(med => (
                                    <div key={med.id} className="bg-white/80 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-700">{med.name}</p>
                                            <p className="text-xs text-slate-500">{getFrequencyLabel(med.frequency)} • {med.time}</p>
                                        </div>
                                        <button onClick={() => removeMedication(med.id)} className="p-2 text-slate-400 hover:text-rose-500">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'contact':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <p className="text-sm text-slate-500 text-center mb-4">
                            (Opcional) Alguien de confianza para emergencias
                        </p>
                        <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Nombre completo"
                            className="w-full px-4 py-4 bg-white/80 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 outline-none"
                        />

                        {/* Phone with Country Code */}
                        <PhoneInputWithCountry
                            value={contactPhone}
                            onChange={(fullPhone) => setContactPhone(fullPhone)}
                            placeholder="Número celular"
                        />

                        <select
                            value={contactRelation}
                            onChange={(e) => setContactRelation(e.target.value)}
                            className="w-full px-4 py-4 bg-white/80 border border-slate-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-violet-200 outline-none"
                        >
                            <option value="">Relación contigo</option>
                            <option value="Familiar">Familiar</option>
                            <option value="Amigo/a">Amigo/a</option>
                            <option value="Pareja">Pareja</option>
                            <option value="Terapeuta">Terapeuta</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                );

            case 'mood':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <p className="text-sm text-slate-500 text-center">
                            ¿Cómo te sientes la mayoría de los días?
                        </p>
                        <div className="bg-white/80 p-5 rounded-[2rem] border border-slate-200">
                            <MoodSelector selectedMood={baselineMood} onSelect={setBaselineMood} />
                        </div>
                        {baselineMood && (
                            <p className="text-center text-sm text-slate-500 animate-fade-in">
                                Entiendo. Estoy aquí para acompañarte. 💚
                            </p>
                        )}
                    </div>
                );

            case 'complete':
                return (
                    <div className="text-center space-y-6 animate-fade-in">
                        {/* Confetti Effect */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full animate-bounce"
                                        style={{
                                            backgroundColor: ['#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'][i % 5],
                                            left: `${10 + (i * 4)}%`,
                                            top: `${Math.random() * 100}%`,
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: `${0.5 + Math.random()}s`,
                                        }}
                                    />
                                ))}
                            </div>
                            <Sparkles className="mx-auto text-amber-400 animate-pulse" size={48} />
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-800">
                            ¡Todo listo, {name}!
                        </h2>
                        <p className="text-slate-600">
                            Tu espacio de calma está configurado. Recuerda: cada paso cuenta, y no estás solo/a.
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-left mt-6">
                            {takesMedication && medications.length > 0 && (
                                <div className="bg-indigo-50 p-3 rounded-xl">
                                    <p className="text-xs text-indigo-500 font-bold">Medicamentos</p>
                                    <p className="text-sm text-indigo-700">{medications.length} registrados</p>
                                </div>
                            )}
                            {contactName && (
                                <div className="bg-violet-50 p-3 rounded-xl">
                                    <p className="text-xs text-violet-500 font-bold">Contacto</p>
                                    <p className="text-sm text-violet-700">{contactName}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-indigo-50 to-violet-50 flex flex-col p-6">
            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mb-6">
                <div className="flex gap-2">
                    {STEPS.map((s, i) => (
                        <div
                            key={s.id}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-teal-500' : 'bg-slate-200'
                                }`}
                        />
                    ))}
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                    Paso {currentStep + 1} de {STEPS.length}
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
                {/* Cat Mascot */}
                <div className="mb-8">
                    <CatMascot
                        mood={step.catMood}
                        size={step.id === 'complete' ? 180 : 150}
                        message={getCatMessage()}
                    />
                </div>

                {/* Step Content */}
                <div className="w-full glass-panel p-6 rounded-[2rem] shadow-xl min-h-[200px]">
                    {renderStepContent()}
                </div>
            </div>

            {/* Navigation */}
            <div className="w-full max-w-md mx-auto mt-6 flex gap-4">
                {!isFirstStep && (
                    <button
                        onClick={prevStep}
                        className="flex-1 py-4 bg-white/80 border border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Atrás
                    </button>
                )}

                <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className={`flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${canProceed()
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-200 active:scale-[0.98]'
                        : 'bg-slate-300 cursor-not-allowed'
                        }`}
                >
                    {isLastStep ? '¡Comenzar!' : 'Siguiente'}
                    {!isLastStep && <ArrowRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default OnboardingPage;
