import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { Wind, Anchor, Image as ImageIcon, MessageSquareHeart, Plus, Trash2, Music, Upload, Play, Pause, CloudRain, Trees, Waves, Moon, X, Eye, Ear, Hand, Smile, Sparkles, Heart, Leaf, User, Star, CheckCircle, Settings2, Clock, Headphones, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVoiceGuidance } from '../services/geminiService';

// --- Types & Constants ---

type CyclePhase = 'intro' | 'breathe' | 'release' | 'senses' | 'bodyscan' | 'memory' | 'affirmation' | 'microgoal' | 'closing';

interface PhaseDef {
    id: CyclePhase;
    label: string;
    duration: number; // in ms
    required?: boolean;
}

const PHASE_DEFINITIONS: PhaseDef[] = [
    { id: 'intro', label: 'Bienvenida', duration: 8000, required: true },
    { id: 'breathe', label: 'Respiración', duration: 34000 },
    { id: 'release', label: 'Soltar', duration: 13000 },
    { id: 'senses', label: 'Sentidos', duration: 20000 },
    { id: 'bodyscan', label: 'Escaneo Corporal', duration: 20000 },
    { id: 'memory', label: 'Gratitud', duration: 15000 },
    { id: 'affirmation', label: 'Afirmación', duration: 15000 },
    { id: 'microgoal', label: 'Mini Meta', duration: 13000 },
    { id: 'closing', label: 'Cierre', duration: 12000, required: true },
];

// --- Cinematic Cycle Component ---
interface CinematicCycleProps {
  onClose: () => void;
  memories: { id: string; url: string; type: 'image' }[];
  activePhases: CyclePhase[];
}

const CinematicCycle: React.FC<CinematicCycleProps> = ({ onClose, memories, activePhases }) => {
  const [phase, setPhase] = useState<CyclePhase>('intro');
  const [subText, setSubText] = useState('');
  const [breathingState, setBreathingState] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Audio Refs
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentVoiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isMountedRef = useRef(true);

  // Helper to play Gemini TTS (Raw PCM)
  const playVoice = async (text: string) => {
    if (!isMountedRef.current) return;

    if (currentVoiceSourceRef.current) {
        try { currentVoiceSourceRef.current.stop(); } catch(e) {}
        currentVoiceSourceRef.current = null;
    }

    setIsSpeaking(true);
    
    try {
        const base64Audio = await getVoiceGuidance(text);
        
        if (!isMountedRef.current || !base64Audio) {
            setIsSpeaking(false);
            return;
        }

        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
        const ctx = audioContextRef.current;

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        
        for (let i = 0; i < int16Data.length; i++) {
             float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        
        currentVoiceSourceRef.current = source;
        
        source.onended = () => {
             if (isMountedRef.current) setIsSpeaking(false);
        };

    } catch (e) {
        console.error("Audio Playback Error:", e);
        if (isMountedRef.current) setIsSpeaking(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Start Background Music
    const audio = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_104e769643.mp3'); // Night/Ambient
    audio.loop = true;
    audio.volume = 0; // Fade in
    audio.play().catch(e => console.log("Background music autoplay blocked", e));
    bgMusicRef.current = audio;

    // Fade in volume
    const fadeInterval = setInterval(() => {
        if (audio.volume < 0.3) audio.volume += 0.05;
        else clearInterval(fadeInterval);
    }, 500);

    // Dynamic Sequence Logic
    let timeouts: NodeJS.Timeout[] = [];
    let currentOffset = 0;

    // Calculate total duration for progress bar
    const totalDuration = activePhases.reduce((acc, phaseId) => {
        const def = PHASE_DEFINITIONS.find(p => p.id === phaseId);
        return acc + (def ? def.duration : 0);
    }, 0);

    // Progress Bar Updater
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min((elapsed / totalDuration) * 100, 100);
        setProgress(p);
    }, 100);


    // --- Phase Schedulers ---
    const schedule = (fn: () => void, delay: number) => {
        timeouts.push(setTimeout(fn, currentOffset + delay));
    };

    // Iterate through user selected phases and schedule them
    activePhases.forEach(phaseId => {
        const phaseStart = currentOffset; // Snapshot time for this phase
        
        // --- PHASE LOGIC ---
        if (phaseId === 'intro') {
            schedule(() => {
                setPhase('intro');
                setSubText("Buscando tu calma...");
                playVoice("Hola. Vamos a bajar el ritmo juntos. Solo sigue mi voz.");
            }, 0);
        }
        else if (phaseId === 'breathe') {
            schedule(() => {
                setPhase('breathe');
                setSubText("Respira suavemente");
                playVoice("Inhala profundo por la nariz...");
                setBreathingState('inhale');
            }, 0);

            // Internal Breathe Cycles relative to phase start
            schedule(() => { setBreathingState('hold'); playVoice("Mantén el aire."); }, 4000);
            schedule(() => { setBreathingState('exhale'); playVoice("Suelta despacio por la boca."); }, 7000); // 4+3

            schedule(() => { setBreathingState('inhale'); playVoice("Inhala de nuevo, llenando tu pecho."); }, 13000);
            schedule(() => { setBreathingState('hold'); }, 18000);
            schedule(() => { setBreathingState('exhale'); playVoice("Deja ir toda la tensión."); }, 21000);

            schedule(() => { setBreathingState('inhale'); playVoice("Una última vez. Inhala paz."); }, 27000);
            schedule(() => { setBreathingState('hold'); }, 31000);
            schedule(() => { setBreathingState('exhale'); playVoice("Exhala todo lo que no necesitas."); }, 33000);
        }
        else if (phaseId === 'release') {
            schedule(() => {
                setPhase('release');
                setBreathingState('idle');
                setSubText("Deja ir");
                playVoice("Imagina que tus preocupaciones son hojas en un río. Obsérvalas alejarse lentamente.");
            }, 0);
        }
        else if (phaseId === 'senses') {
            schedule(() => {
                setPhase('senses');
                setSubText("Conecta con el ahora");
                playVoice("Ahora, enfócate en tus sentidos. Mira algo frente a ti. Observa su color.");
            }, 0);
            schedule(() => { playVoice("Escucha el silencio... ¿qué puedes oír a lo lejos?"); }, 10000);
        }
        else if (phaseId === 'bodyscan') {
            schedule(() => {
                setPhase('bodyscan');
                setSubText("Escanea tu cuerpo");
                playVoice("Nota tus hombros... ¿están tensos? Déjalos caer. Relaja tu mandíbula. Siente tus pies firmes en el suelo.");
            }, 0);
        }
        else if (phaseId === 'memory') {
            schedule(() => {
                setPhase('memory');
                setSubText("Tu lugar seguro");
                playVoice("Piensa en algo simple por lo que estés agradecido hoy. Un lugar, una persona, o este momento.");
            }, 0);
        }
        else if (phaseId === 'affirmation') {
            schedule(() => {
                setPhase('affirmation');
                setSubText("Repite conmigo");
                playVoice("Repite en silencio: Estoy haciendo lo mejor que puedo. Merezco paz. Un día a la vez.");
            }, 0);
        }
        else if (phaseId === 'microgoal') {
            schedule(() => {
                setPhase('microgoal');
                setSubText("Un pequeño paso");
                playVoice("Piensa en algo muy pequeño que harás al terminar. Tomar agua, estirarte, o abrir una ventana.");
            }, 0);
        }
        else if (phaseId === 'closing') {
            schedule(() => {
                setPhase('closing');
                setSubText("Lo hiciste muy bien");
                playVoice("Gracias por darte este tiempo. Lo hiciste muy bien. Lleva esta calma contigo.");
            }, 0);
        }

        // Increment offset for next phase
        const def = PHASE_DEFINITIONS.find(p => p.id === phaseId);
        currentOffset += (def ? def.duration : 0);
    });

    // Cleanup & Close at end
    schedule(() => {
         if (bgMusicRef.current) {
            const fadeOut = setInterval(() => {
                if (bgMusicRef.current!.volume > 0.05) bgMusicRef.current!.volume -= 0.05;
                else {
                    clearInterval(fadeOut);
                    onClose();
                }
            }, 200);
        } else {
            onClose();
        }
    }, 2000); // 2s buffer after last phase

    return () => {
        isMountedRef.current = false;
        clearInterval(progressInterval);
        timeouts.forEach(clearTimeout);
        
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current = null;
        }
        
        if (currentVoiceSourceRef.current) {
            try { currentVoiceSourceRef.current.stop(); } catch(e) {}
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  // Visual Renderer based on phase
  const renderVisuals = () => {
      switch(phase) {
          case 'intro':
              return (
                  <div className="animate-fade-in flex flex-col items-center text-center">
                      <div className="w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse absolute"></div>
                      <h2 className="text-4xl font-serif text-white font-medium mb-6 relative z-10 tracking-wide drop-shadow-lg">Hola.</h2>
                      <p className="text-teal-50 text-xl font-light relative z-10 opacity-90">{subText}</p>
                      {isSpeaking && <div className="mt-8 flex gap-1 justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div></div>}
                  </div>
              );
          case 'breathe':
              return (
                  <div className="flex flex-col items-center justify-center relative">
                       {/* Cinematic Breathing Circle */}
                       <div className={`relative flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${breathingState === 'inhale' ? 'scale-150' : breathingState === 'hold' ? 'scale-125' : 'scale-90'}`}>
                           <div className={`absolute inset-0 bg-teal-300 rounded-full blur-3xl opacity-30 transition-all duration-1000`}></div>
                           <div className="w-48 h-48 rounded-full border border-white/40 bg-gradient-to-br from-teal-400/20 to-emerald-400/10 backdrop-blur-md shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center">
                               <Wind className={`text-white w-12 h-12 transition-opacity duration-1000 ${breathingState === 'hold' ? 'opacity-100' : 'opacity-60'}`} />
                           </div>
                       </div>
                       <p className="mt-20 text-xl font-light text-white tracking-[0.2em] uppercase animate-pulse opacity-80">{breathingState === 'idle' ? '...' : breathingState}</p>
                  </div>
              );
          case 'release':
              return (
                  <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
                      {/* River Leaves Animation */}
                      <style>
                        {`
                          @keyframes floatRiver {
                            0% { left: -50px; transform: translateY(0px) rotate(0deg); opacity: 0; }
                            10% { opacity: 0.8; }
                            50% { transform: translateY(20px) rotate(90deg); }
                            90% { opacity: 0.8; }
                            100% { left: 100%; transform: translateY(0px) rotate(180deg); opacity: 0; }
                          }
                        `}
                      </style>
                      
                      <div className="absolute inset-0 w-full h-full pointer-events-none">
                          <Leaf size={48} className="text-emerald-300 absolute top-[30%] opacity-0" style={{ animation: 'floatRiver 10s linear infinite', animationDelay: '0s' }} />
                          <Leaf size={32} className="text-teal-200 absolute top-[50%] opacity-0" style={{ animation: 'floatRiver 12s linear infinite', animationDelay: '1.5s' }} />
                          <Leaf size={40} className="text-emerald-100 absolute top-[65%] opacity-0" style={{ animation: 'floatRiver 9s linear infinite', animationDelay: '3s' }} />
                          <Leaf size={28} className="text-teal-100 absolute top-[40%] opacity-0" style={{ animation: 'floatRiver 11s linear infinite', animationDelay: '5s' }} />
                      </div>

                      <div className="z-10 text-center">
                          <h2 className="text-4xl font-serif text-white mb-3 drop-shadow-lg">Suelta.</h2>
                          <p className="text-emerald-50 text-xl font-light drop-shadow-md">Imagina tus preocupaciones alejándose.</p>
                      </div>
                  </div>
              );
          case 'senses':
              return (
                  <div className="flex flex-col items-center gap-8 animate-fade-in text-center w-full max-w-md">
                      <div className={`flex items-center gap-6 w-full p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-1000`}>
                          <div className="bg-white/10 p-4 rounded-full"><Eye size={24} className="text-white"/></div>
                          <span className="text-white text-xl font-light tracking-wide">Mira</span>
                      </div>
                      <div className={`flex items-center gap-6 w-full p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-1000 delay-500`}>
                           <div className="bg-white/10 p-4 rounded-full"><Ear size={24} className="text-white"/></div>
                           <span className="text-white text-xl font-light tracking-wide">Escucha</span>
                      </div>
                  </div>
              );
          case 'bodyscan':
              return (
                  <div className="flex flex-col items-center justify-center animate-fade-in text-center">
                       <div className="w-64 h-64 relative mb-6">
                           <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                           <User size={120} className="text-indigo-100 mx-auto relative z-10 opacity-90" strokeWidth={0.5} />
                           {/* Highlight points */}
                           <div className="absolute top-10 left-1/2 w-4 h-4 bg-white rounded-full blur-sm animate-ping"></div>
                           <div className="absolute top-24 left-1/3 w-3 h-3 bg-white/70 rounded-full blur-sm animate-ping delay-300"></div>
                           <div className="absolute top-24 right-1/3 w-3 h-3 bg-white/70 rounded-full blur-sm animate-ping delay-300"></div>
                       </div>
                       <h2 className="text-2xl font-serif text-white mb-2">Relaja.</h2>
                       <p className="text-indigo-100 text-lg font-light">Hombros... Mandíbula... Manos...</p>
                  </div>
              );
          case 'memory':
              const memoryImage = memories.find(m => m.type === 'image')?.url || 'https://picsum.photos/400/600?grayscale';
              return (
                  <div className="animate-fade-in flex flex-col items-center max-w-sm mx-auto px-4 w-full">
                      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/30 rotate-1 transition-transform duration-[20s] hover:rotate-0 hover:scale-105 w-full aspect-[3/4]">
                          <img src={memoryImage} alt="Memory" className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 via-transparent to-transparent"></div>
                          <div className="absolute bottom-6 left-6 right-6 text-center">
                              <Heart className="text-amber-200 mb-2 opacity-80 mx-auto" size={32} fill="currentColor"/>
                              <p className="text-white/90 text-lg font-medium">Gratitud.</p>
                          </div>
                      </div>
                  </div>
              );
          case 'affirmation':
              return (
                  <div className="animate-fade-in flex flex-col items-center text-center px-6">
                      <Star size={48} className="text-yellow-200 mb-6 animate-spin-slow opacity-80" />
                      <div className="space-y-6">
                          <p className="text-2xl sm:text-3xl text-white font-serif leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                              "Estoy haciendo lo mejor que puedo."
                          </p>
                          <p className="text-2xl sm:text-3xl text-white font-serif leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '2.5s', animationFillMode: 'forwards' }}>
                              "Merezco paz."
                          </p>
                      </div>
                  </div>
              );
          case 'microgoal':
              return (
                   <div className="animate-fade-in flex flex-col items-center text-center px-8">
                       <CheckCircle size={64} className="text-teal-300 mb-6" />
                       <h2 className="text-3xl text-white font-bold mb-4">Un pequeño paso.</h2>
                       <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                           <div className="bg-white/10 p-3 rounded-xl text-white text-sm backdrop-blur-sm border border-white/10">🥤 Tomar un vaso de agua</div>
                           <div className="bg-white/10 p-3 rounded-xl text-white text-sm backdrop-blur-sm border border-white/10">🙆‍♀️ Estirar los brazos</div>
                           <div className="bg-white/10 p-3 rounded-xl text-white text-sm backdrop-blur-sm border border-white/10">🌤️ Mirar el cielo</div>
                       </div>
                   </div>
              );
          case 'closing':
              return (
                  <div className="animate-fade-in text-center">
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20">
                         <Smile size={48} className="text-white opacity-90" />
                      </div>
                      <h2 className="text-4xl font-serif text-white mb-4">Suficiente.</h2>
                      <p className="text-indigo-100 text-lg font-light">Lo hiciste muy bien.</p>
                  </div>
              );
      }
  };

  const getGradient = () => {
      switch(phase) {
          case 'release': return 'linear-gradient(180deg, #0f766e 0%, #022c22 100%)'; // River Teal/Dark
          case 'bodyscan': return 'radial-gradient(circle at center, #312e81 0%, #1e1b4b 100%)'; // Indigo
          case 'memory': return 'radial-gradient(circle at center, #78350f 0%, #451a03 100%)'; // Amber/Sepia
          case 'affirmation': return 'radial-gradient(circle at center, #4c1d95 0%, #2e1065 100%)'; // Violet
          default: return 'radial-gradient(circle at center, #0f766e 0%, #0c4a6e 100%)'; // Teal default
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-900 transition-colors duration-[3000ms]"
         style={{ background: getGradient() }}>
        
        {/* Cinematic Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

        {/* Ambient Moving Gradients */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent"></div>
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        </div>

        <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all z-50 backdrop-blur-sm border border-white/5"
        >
            <X size={24} />
        </button>

        <div className="relative z-10 w-full max-w-lg h-full flex flex-col items-center justify-center p-8">
            {renderVisuals()}
        </div>

        {/* Cinematic Progress Bar */}
        <div className="absolute bottom-12 left-8 right-8 h-0.5 bg-white/10 rounded-full overflow-hidden max-w-md mx-auto">
            <div 
                className="h-full bg-white/60 transition-all duration-300 ease-linear shadow-[0_0_10px_white]"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
  );
};


// --- Main KitPage ---
const KitPage: React.FC = () => {
  const { userState, saveNote, removeNote } = useApp();
  const [activeTab, setActiveTab] = useState<'breathe' | 'notes' | 'media'>('breathe');
  const [newNote, setNewNote] = useState('');
  const [showCinematic, setShowCinematic] = useState(false);
  
  // Phase selection state
  const [selectedPhases, setSelectedPhases] = useState<CyclePhase[]>(
      PHASE_DEFINITIONS.map(p => p.id) // Default all selected
  );
  
  // Mixer State with 3D Toggle
  const [isSpatial, setIsSpatial] = useState(false);
  const [mixerState, setMixerState] = useState<{ [key: string]: { playing: boolean; volume: number } }>({
    rain: { playing: false, volume: 0.5 },
    forest: { playing: false, volume: 0.5 },
    waves: { playing: false, volume: 0.5 },
    night: { playing: false, volume: 0.5 },
  });

  const [memories, setMemories] = useState<{ id: string; url: string; type: 'image' }[]>([
    { id: '1', url: 'https://picsum.photos/300/300?grayscale', type: 'image' },
    { id: '2', url: 'https://picsum.photos/301/301?blur=2', type: 'image' }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio Mixer Refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const mixerContextRef = useRef<AudioContext | null>(null);
  const mixerNodesRef = useRef<{ [key: string]: { source: MediaElementAudioSourceNode; panner: PannerNode } }>({});
  const animationFrameRef = useRef<number>(0);

  // Initialize Audio Elements
  useEffect(() => {
    const sounds = {
      rain: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
      forest: 'https://cdn.pixabay.com/audio/2021/09/06/audio_370213d286.mp3',
      waves: 'https://cdn.pixabay.com/audio/2022/02/07/audio_13813ff62b.mp3',
      night: 'https://cdn.pixabay.com/audio/2022/10/16/audio_104e769643.mp3'
    };

    Object.entries(sounds).forEach(([key, url]) => {
      if (!audioRefs.current[key]) {
        const audio = new Audio(url);
        audio.crossOrigin = "anonymous"; // Essential for Web Audio API
        audio.loop = true;
        audio.volume = 0.5;
        audioRefs.current[key] = audio;
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      if (mixerContextRef.current) mixerContextRef.current.close();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Spatial Audio Logic
  useEffect(() => {
      if (isSpatial) {
          // Initialize Context if needed
          if (!mixerContextRef.current) {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              mixerContextRef.current = new AudioContextClass();
          }
          const ctx = mixerContextRef.current;
          if (ctx.state === 'suspended') ctx.resume();

          // Connect all active sounds to Panners
          Object.keys(mixerState).forEach(key => {
              const audio = audioRefs.current[key];
              if (!mixerNodesRef.current[key] && audio) {
                  const source = ctx.createMediaElementSource(audio);
                  const panner = ctx.createPanner();
                  panner.panningModel = 'HRTF';
                  panner.distanceModel = 'linear';
                  
                  source.connect(panner);
                  panner.connect(ctx.destination);
                  
                  mixerNodesRef.current[key] = { source, panner };
              }
          });

          // Animation Loop
          const animate = () => {
              const t = Date.now() / 1000;
              
              if (mixerNodesRef.current['rain']) {
                  const p = mixerNodesRef.current['rain'].panner;
                  // Circle around head
                  p.positionX.value = Math.sin(t * 0.5) * 2;
                  p.positionZ.value = Math.cos(t * 0.5) * 2;
              }
              if (mixerNodesRef.current['forest']) {
                  const p = mixerNodesRef.current['forest'].panner;
                  // Gentle drift left/right
                  p.positionX.value = Math.sin(t * 0.2) * 3;
                  p.positionZ.value = 1;
              }
              if (mixerNodesRef.current['waves']) {
                  const p = mixerNodesRef.current['waves'].panner;
                  // Wide sweep front
                  p.positionX.value = Math.sin(t * 0.1) * 5;
                  p.positionZ.value = -2;
              }
              if (mixerNodesRef.current['night']) {
                  const p = mixerNodesRef.current['night'].panner;
                  // Static behind
                  p.positionZ.value = 2;
                  p.positionX.value = Math.sin(t * 0.05);
              }

              animationFrameRef.current = requestAnimationFrame(animate);
          };
          animate();

      } else {
          cancelAnimationFrame(animationFrameRef.current);
          // If switching off spatial, we keep the graph connected but reset positions to center (0,0,0)
          // or rely on the fact that standard HTMLAudioElement volume/playback works regardless.
          // Reset panners to neutral
          Object.values(mixerNodesRef.current).forEach(node => {
              node.panner.positionX.value = 0;
              node.panner.positionY.value = 0;
              node.panner.positionZ.value = 0;
          });
      }

      return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isSpatial]);

  const toggleSound = (key: string) => {
    // Ensure context is running if spatial is on
    if (isSpatial && mixerContextRef.current?.state === 'suspended') {
        mixerContextRef.current.resume();
    }

    setMixerState(prev => {
      const newState = { ...prev };
      const isPlaying = !prev[key].playing;
      newState[key] = { ...prev[key], playing: isPlaying };
      
      const audio = audioRefs.current[key];
      if (audio) {
        if (isPlaying) audio.play().catch(e => console.error("Audio play failed", e));
        else audio.pause();
      }
      return newState;
    });
  };

  const handleVolumeChange = (key: string, val: number) => {
    setMixerState(prev => {
      const newState = { ...prev };
      newState[key] = { ...prev[key], volume: val };
      
      const audio = audioRefs.current[key];
      if (audio) audio.volume = val;
      return newState;
    });
  };

  const handleAddNote = () => {
      if(newNote.trim()) {
          saveNote(newNote);
          setNewNote('');
      }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMemories(prev => [...prev, { id: Date.now().toString(), url, type: 'image' }]);
    }
  };

  const togglePhase = (id: CyclePhase) => {
      const def = PHASE_DEFINITIONS.find(p => p.id === id);
      if (def?.required) return; // Cannot toggle required phases

      setSelectedPhases(prev => {
          if (prev.includes(id)) {
              return prev.filter(p => p !== id);
          } else {
              // Maintain order based on PHASE_DEFINITIONS
              const newSelection = [...prev, id];
              return PHASE_DEFINITIONS
                  .filter(p => newSelection.includes(p.id))
                  .map(p => p.id);
          }
      });
  };

  const getTotalDurationString = () => {
      const ms = PHASE_DEFINITIONS
          .filter(p => selectedPhases.includes(p.id))
          .reduce((acc, curr) => acc + curr.duration, 0);
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Tu Refugio</h1>
      <p className="text-slate-500 mb-6 text-sm font-medium">Espacios para volver a la calma.</p>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl mb-6 backdrop-blur-sm relative shrink-0">
        <button 
            onClick={() => setActiveTab('breathe')}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${activeTab === 'breathe' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <Wind size={16} className="inline mr-1 mb-1" /> Ciclo
        </button>
        <button 
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${activeTab === 'notes' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <MessageSquareHeart size={16} className="inline mr-1 mb-1" /> Notas
        </button>
        <button 
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${activeTab === 'media' ? 'bg-white shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-700'}`}>
            <Music size={16} className="inline mr-1 mb-1" /> Sentidos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
          
          {/* Breathing / Cinematic Cycle Section */}
          {activeTab === 'breathe' && (
              <div className="flex flex-col items-center animate-fade-in pb-8">
                  
                  {/* Hero Start Button */}
                  <div className="relative group cursor-pointer mt-4 mb-8" onClick={() => setShowCinematic(true)}>
                      <div className="absolute inset-0 bg-teal-400 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
                      <button 
                        className="relative w-64 h-64 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex flex-col items-center justify-center shadow-2xl text-white border-4 border-white/30 transform transition-transform duration-500 group-hover:scale-105 active:scale-95 overflow-hidden"
                      >
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                           <Play size={48} className="mb-2 fill-white" />
                           <span className="font-bold text-lg tracking-wider">INICIAR</span>
                           <span className="text-xs text-teal-100 mt-1 font-mono">{getTotalDurationString()}</span>
                      </button>
                  </div>

                  {/* Configuration Panel */}
                  <div className="glass-panel p-5 rounded-[2rem] w-full max-w-md">
                      <div className="flex items-center gap-2 mb-4 text-slate-700 px-1">
                          <Settings2 size={20} className="text-teal-600" />
                          <h3 className="font-bold text-sm">Personalizar Experiencia</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                          {PHASE_DEFINITIONS.filter(p => !p.required).map((phase) => {
                              const isActive = selectedPhases.includes(phase.id);
                              return (
                                  <button
                                    key={phase.id}
                                    onClick={() => togglePhase(phase.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        isActive 
                                        ? 'bg-teal-100 border-teal-200 text-teal-700 shadow-sm' 
                                        : 'bg-white/50 border-slate-100 text-slate-400 grayscale hover:grayscale-0'
                                    }`}
                                  >
                                      {phase.label}
                                  </button>
                              );
                          })}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-400 px-1">
                          <span className="flex items-center gap-1"><Clock size={12}/> Duración est.</span>
                          <span className="font-mono font-bold text-slate-600">{getTotalDurationString()}</span>
                      </div>
                  </div>

              </div>
          )}

          {/* Notes Section */}
          {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in pb-4">
                   <Link to="/share" className="block bg-gradient-to-r from-violet-500 to-fuchsia-500 p-5 rounded-[2rem] shadow-lg shadow-violet-200 text-white mb-6 transform transition-all active:scale-95 group">
                       <div className="flex justify-between items-center">
                           <div>
                               <p className="font-bold text-lg flex items-center gap-2"><Heart size={20} fill="white" className="animate-pulse" /> Círculo de Apoyo</p>
                               <p className="text-violet-100 text-xs mt-1">Invita a tus seres queridos.</p>
                           </div>
                           <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                               <Plus size={20} />
                           </div>
                       </div>
                   </Link>
                   
                   <div className="flex gap-2 mb-6 bg-white/60 p-2 rounded-[2rem] shadow-sm backdrop-blur-md">
                       <input 
                            type="text" 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Escribe algo amable..."
                            className="flex-1 p-3 ml-2 bg-transparent border-none text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none text-sm w-full"
                        />
                        <button onClick={handleAddNote} className="bg-indigo-600 text-white p-3 rounded-full shadow-md hover:bg-indigo-700 transition-colors shrink-0">
                            <Plus size={24} />
                        </button>
                   </div>

                   <div className="grid gap-3">
                       {userState.savedNotes.map((note, idx) => (
                           <div key={idx} className="bg-white/70 p-5 rounded-[1.5rem] shadow-sm border border-white/50 flex justify-between items-start group hover:bg-white transition-colors">
                               <p className="text-slate-700 font-medium leading-relaxed font-serif italic text-sm">"{note}"</p>
                               <button onClick={() => removeNote(idx)} className="text-slate-300 hover:text-rose-400 ml-3 mt-1 transition-colors p-1 shrink-0">
                                   <Trash2 size={16} />
                               </button>
                           </div>
                       ))}
                       {userState.savedNotes.length === 0 && (
                           <div className="text-center text-slate-400 py-10 text-sm">
                               Aún no hay mensajes.
                           </div>
                       )}
                   </div>
              </div>
          )}

          {/* Media Section */}
          {activeTab === 'media' && (
              <div className="space-y-6 animate-fade-in pb-4">
                  {/* Sound Mixer */}
                  <div className="glass-panel p-5 sm:p-6 rounded-[2rem]">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                              <Music size={20} className="text-indigo-500"/> Paisaje Sonoro
                          </h3>
                          
                          {/* Spatial Audio Toggle */}
                          <button 
                            onClick={() => setIsSpatial(!isSpatial)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${
                                isSpatial 
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}
                          >
                              <Headphones size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-wide">Audio 3D</span>
                              {isSpatial ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                          </button>
                      </div>
                      
                      <div className="space-y-4">
                          {[
                              { id: 'rain', label: 'Lluvia', icon: <CloudRain size={20} /> },
                              { id: 'forest', label: 'Bosque', icon: <Trees size={20} /> },
                              { id: 'waves', label: 'Olas', icon: <Waves size={20} /> },
                              { id: 'night', label: 'Noche', icon: <Moon size={20} /> },
                          ].map((sound) => (
                              <div key={sound.id} className="flex items-center gap-3">
                                  <button 
                                    onClick={() => toggleSound(sound.id)}
                                    className={`p-3 rounded-2xl transition-all duration-300 shrink-0 ${mixerState[sound.id].playing ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                  >
                                      {mixerState[sound.id].playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                  </button>
                                  
                                  <div className="flex-1 bg-white/50 p-3 rounded-2xl flex items-center gap-3 border border-white/60 min-w-0">
                                      <div className={`text-slate-400 ${mixerState[sound.id].playing ? 'text-indigo-500' : ''} hidden sm:block`}>
                                        {sound.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-slate-700 mb-2 truncate">{sound.label}</p>
                                          <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.01"
                                            value={mixerState[sound.id].volume}
                                            onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 block"
                                            disabled={!mixerState[sound.id].playing}
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Visual Gallery */}
                  <div className="space-y-4">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg px-2"><ImageIcon size={20} className="text-rose-500"/> Recuerdos</h3>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

                      <div className="columns-2 gap-3 space-y-3">
                          {memories.map((mem) => (
                             <img key={mem.id} src={mem.url} alt="Memory" className="rounded-2xl shadow-sm w-full mb-3 border border-white/50" />
                          ))}
                          
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/50 rounded-2xl flex flex-col items-center justify-center h-32 w-full text-slate-400 border-2 border-dashed border-slate-300 hover:border-teal-400 hover:text-teal-600 transition-all break-inside-avoid"
                          >
                              <Upload size={24} className="mb-2"/>
                              <span className="text-xs font-bold">Subir Foto</span>
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Cinematic Overlay */}
      {showCinematic && (
          <CinematicCycle 
            onClose={() => setShowCinematic(false)} 
            memories={memories} 
            activePhases={selectedPhases}
          />
      )}
    </div>
  );
};

export default KitPage;