import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';

interface Sound {
    id: string;
    name: string;
    emoji: string;
    file: string;
    color: string;
}

const SOUNDS: Sound[] = [
    { id: 'lluvia', name: 'Lluvia', emoji: '🌧️', file: '/assets/audios_asmr/lluvia_noche.mp3', color: 'from-blue-400 to-indigo-500' },
    { id: 'bosque', name: 'Bosque', emoji: '🌲', file: '/assets/audios_asmr/bosque_aves.mp3', color: 'from-green-400 to-emerald-500' },
    { id: 'aves', name: 'Aves', emoji: '🐦', file: '/assets/audios_asmr/aves.mp3', color: 'from-amber-400 to-orange-500' },
    { id: 'viento', name: 'Viento', emoji: '💨', file: '/assets/audios_asmr/viento.mp3', color: 'from-slate-400 to-slate-500' },
    { id: 'tormenta', name: 'Tormenta', emoji: '⛈️', file: '/assets/audios_asmr/tormenta.mp3', color: 'from-purple-400 to-violet-500' },
    { id: 'caminata', name: 'Naturaleza', emoji: '🚶', file: '/assets/audios_asmr/caminata_en_naturaleza.mp3', color: 'from-teal-400 to-cyan-500' },
];

interface ActiveSound {
    id: string;
    audio: HTMLAudioElement;
    volume: number;
}

interface AmbientSoundPlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({ isOpen, onClose }) => {
    const [activeSounds, setActiveSounds] = useState<Map<string, ActiveSound>>(new Map());
    const [masterVolume, setMasterVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            activeSounds.forEach(s => {
                s.audio.pause();
                s.audio.src = '';
            });
        };
    }, []);

    // Update all volumes when master changes
    useEffect(() => {
        activeSounds.forEach(s => {
            s.audio.volume = isMuted ? 0 : s.volume * masterVolume;
        });
    }, [masterVolume, isMuted]);

    const toggleSound = (sound: Sound) => {
        const existing = activeSounds.get(sound.id);

        if (existing) {
            // Stop the sound
            existing.audio.pause();
            existing.audio.src = '';
            const newMap = new Map(activeSounds);
            newMap.delete(sound.id);
            setActiveSounds(newMap);
        } else {
            // Start the sound
            const audio = new Audio(sound.file);
            audio.loop = true;
            audio.volume = isMuted ? 0 : 0.5 * masterVolume;
            audio.play().catch(console.error);

            const newMap = new Map(activeSounds);
            newMap.set(sound.id, { id: sound.id, audio, volume: 0.5 });
            setActiveSounds(newMap);
        }
    };

    const updateSoundVolume = (id: string, volume: number) => {
        const sound = activeSounds.get(id);
        if (sound) {
            sound.audio.volume = isMuted ? 0 : volume * masterVolume;
            sound.volume = volume;
            setActiveSounds(new Map(activeSounds));
        }
    };

    const stopAll = () => {
        activeSounds.forEach(s => {
            s.audio.pause();
            s.audio.src = '';
        });
        setActiveSounds(new Map());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-t-[2rem] p-6 pb-8 shadow-2xl animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800">Sonidos Ambientales</h2>
                        <p className="text-sm text-slate-500">Mezcla sonidos para relajarte</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Sound Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {SOUNDS.map(sound => {
                        const isActive = activeSounds.has(sound.id);
                        return (
                            <button
                                key={sound.id}
                                onClick={() => toggleSound(sound)}
                                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${isActive
                                        ? `bg-gradient-to-br ${sound.color} text-white shadow-lg scale-105`
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <span className="text-2xl">{sound.emoji}</span>
                                <span className="text-xs font-bold">{sound.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Sounds Volume Controls */}
                {activeSounds.size > 0 && (
                    <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-bold text-slate-500 uppercase">Volumen individual</p>
                        {Array.from(activeSounds.entries()).map(([id, sound]) => {
                            const config = SOUNDS.find(s => s.id === id)!;
                            return (
                                <div key={id} className="flex items-center gap-3">
                                    <span className="text-lg">{config.emoji}</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={sound.volume}
                                        onChange={(e) => updateSoundVolume(id, parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Master Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-xl ${isMuted ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={masterVolume}
                        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                    />

                    {activeSounds.size > 0 && (
                        <button
                            onClick={stopAll}
                            className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl font-bold text-sm"
                        >
                            Parar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AmbientSoundPlayer;
