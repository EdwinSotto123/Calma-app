import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, X, Activity, Volume2, Loader2, StopCircle, Settings2, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { getStreakData } from '../services/firebaseService';
import { getDailyAffirmation } from '../services/affirmationsService';

// Daily Challenges Pool (same as ChallengesPage)
const CHALLENGES = [
  { id: 'walk', title: 'Salir a caminar' },
  { id: 'water', title: 'Hidratarte' },
  { id: 'breathe', title: 'Respirar consciente' },
  { id: 'journal', title: 'Escribir en el diario' },
  { id: 'connect', title: 'Contactar a alguien' },
  { id: 'sunlight', title: 'Tomar sol 5 min' },
  { id: 'stretch', title: 'Estirar el cuerpo' },
  { id: 'gratitude', title: 'Agradecer algo' },
];

const getBaseSystemInstruction = (context: { pendingChallenges?: string[]; streak?: number; affirmation?: string }) => {
  const { pendingChallenges = [], streak = 0, affirmation = '' } = context;

  let challengeContext = '';
  if (pendingChallenges.length > 0) {
    challengeContext = `\n\nCONTEXTO DEL USUARIO:\n- Tiene ${pendingChallenges.length} retos pendientes hoy: ${pendingChallenges.join(', ')}.\n- Si es apropiado en la conversación, puedes animarle gentilmente a completar alguno ("¿Has pensado en salir a caminar un poco?").\n- NO presiones. Solo menciona los retos si encaja naturalmente.`;
  }

  let streakContext = '';
  if (streak > 0) {
    streakContext = `\n- El usuario tiene una racha de ${streak} días cuidándose. Puedes felicitarle si surge naturalmente.`;
  }

  let affirmationContext = '';
  if (affirmation) {
    affirmationContext = `\n- Afirmación del día para el usuario: "${affirmation}". Puedes mencionarla para darle ánimo.`;
  }

  return `Eres "Calma", un compañero de apoyo emocional.
TU ROL: Escuchar activamente y guiar al usuario a la reflexión mediante preguntas abiertas.
IMPORTANTE:
- NO asumas cómo se siente el usuario. En lugar de decir "Te sientes triste", pregunta "¿Cómo te hace sentir eso?" o "¿Qué emociones surgen al contarme esto?".
- Usa la curiosidad empática.
- Haz preguntas cortas (una a la vez).
- Parafrasea lo que escuchas para confirmar entendimiento ("Si entiendo bien, te preocupa que...").
- TU VOZ: Cálida, lenta y suave.
- Si detectas riesgo inminente, sugiere ayuda profesional con gentileza pero firmeza.${challengeContext}${streakContext}${affirmationContext}`;
};

const VOICES = [
  { id: 'Kore', name: 'Kore (Calma Profunda)', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Suave)', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir (Profundo)', gender: 'Male' },
  { id: 'Aoede', name: 'Aoede (Cálida)', gender: 'Female' },
  { id: 'Charon', name: 'Charon (Grave)', gender: 'Male' },
];

const LivePage: React.FC = () => {
  const { firebaseUser, userState } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [showSettings, setShowSettings] = useState(false);
  const [affirmation, setAffirmation] = useState('');
  const [pendingChallenges, setPendingChallenges] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  // Audio Processing Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Visualizer Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Gemini API
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  // Load affirmation and challenge context
  useEffect(() => {
    const loadContext = async () => {
      if (firebaseUser?.uid) {
        // Get streak data
        const streakData = await getStreakData(firebaseUser.uid);
        setCurrentStreak(streakData.currentStreak);

        // Get pending challenges (4 daily challenges - completed ones)
        const today = new Date().toISOString().split('T')[0];
        const completedToday = streakData.completedChallenges
          .filter(c => c.date === today)
          .map(c => c.challengeId);

        const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
        const todayChallenges = [...CHALLENGES]
          .sort((a, b) => ((seed * a.id.charCodeAt(0)) % 100) - ((seed * b.id.charCodeAt(0)) % 100))
          .slice(0, 4)
          .filter(c => !completedToday.includes(c.id))
          .map(c => c.title);

        setPendingChallenges(todayChallenges);
      }

      // Get daily affirmation
      const mood = userState?.dailyLogs?.[userState.dailyLogs.length - 1]?.mood;
      const aff = getDailyAffirmation({ currentStreak, currentMood: mood });
      setAffirmation(aff);
    };

    loadContext();
  }, [firebaseUser, userState]);

  useEffect(() => {
    aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return () => {
      disconnect();
    };
  }, []);

  // --- Utility: PCM16 Conversion ---
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // --- Utility: Audio Decoding ---
  const pcmToAudioBuffer = (base64Audio: string, ctx: AudioContext) => {
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
    return buffer;
  };

  // --- Visualizer Logic ---
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const radius = 30 + (avg / 3);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(165, 180, 252, ${0.1 + (avg / 300)})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + (avg / 200)})`;
      ctx.fill();

      const bars = 16;
      const angleStep = (Math.PI * 2) / bars;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      for (let i = 0; i < bars; i++) {
        const value = dataArray[i * 2] || 0;
        const angle = i * angleStep;

        const x = centerX + Math.cos(angle) * (radius + 10);
        const y = centerY + Math.sin(angle) * (radius + 10);

        ctx.beginPath();
        ctx.arc(x, y, 2 + (value / 50), 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    draw();
  };

  const stopAudioPlayback = () => {
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    scheduledSourcesRef.current = [];

    if (outputAudioContextRef.current) {
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
    }
  };

  const connect = async () => {
    setError(null);
    setIsConnecting(true);
    setShowSettings(false);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      if (!aiRef.current) throw new Error("AI Service not initialized");

      sessionPromiseRef.current = aiRef.current.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: getBaseSystemInstruction({ pendingChallenges, streak: currentStreak, affirmation }),
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Connected");
            setIsConnected(true);
            setIsConnecting(false);

            if (!inputAudioContextRef.current) return;
            const ctx = inputAudioContextRef.current;

            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            source.connect(analyser);
            source.connect(processor);
            processor.connect(ctx.destination);

            sourceRef.current = source;
            processorRef.current = processor;

            drawVisualizer();

            processor.onaudioprocess = (e) => {
              if (isMuted) return;

              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = floatTo16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcm16.buffer);

              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;

            if (serverContent?.interrupted) {
              console.log("Interrupted!");
              stopAudioPlayback();
              return;
            }

            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              const buffer = pcmToAudioBuffer(base64Audio, ctx);

              const now = ctx.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current) + (scheduledSourcesRef.current.length === 0 ? 0.05 : 0);

              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);

              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;

              scheduledSourcesRef.current.push(source);

              source.onended = () => {
                scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
              };
            }
          },
          onclose: () => {
            console.log("Session Closed");
            disconnect();
          },
          onerror: (e) => {
            console.error("Session Error", e);
            setError("Error de conexión.");
            disconnect();
          }
        }
      });

    } catch (err) {
      console.error(err);
      setError("Error de micrófono o red.");
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    stopAudioPlayback();
    cancelAnimationFrame(animationFrameRef.current);

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());

    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    analyserRef.current?.disconnect();

    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    
    sessionPromiseRef.current?.then(session => {
      try { session.close(); } catch {}
    });
    sessionPromiseRef.current = null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden transition-colors duration-1000 ease-in-out">

      <div className={`absolute inset-0 bg-gradient-to-b ${isConnected ? 'from-indigo-900 via-slate-900' : 'from-slate-800 via-slate-900'} to-slate-950 transition-all duration-1000 z-0`}></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>

      {/* Header */}
      <div className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          )}
          <span className={`font-bold tracking-wide text-sm transition-colors ${isConnected ? 'text-teal-400' : 'text-slate-400'}`}>
            {isConnected ? "EN VIVO" : "OFFLINE"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            disabled={isConnected || isConnecting}
          >
            <Settings2 size={20} />
          </button>
          <Link to="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </Link>
        </div>
      </div>

      {/* Voice Settings Modal/Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-md flex flex-col justify-center p-8 animate-fade-in">
          <h3 className="text-xl font-bold mb-6 text-center">Selecciona una Voz</h3>
          <div className="space-y-3">
            {VOICES.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${selectedVoice === v.id
                  ? 'bg-indigo-600 border border-indigo-400'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className="text-left">
                  <span className="font-bold block">{v.name}</span>
                  <span className="text-xs opacity-60">{v.gender === 'Female' ? 'Femenina' : 'Masculina'}</span>
                </div>
                {selectedVoice === v.id && <Check size={20} />}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="mt-8 py-3 bg-white text-slate-900 font-bold rounded-xl"
          >
            Listo
          </button>
        </div>
      )}

      {/* Main Visualizer Area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center">

        <div className="relative h-64 w-full flex items-center justify-center">
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in z-20">
              <Loader2 className="animate-spin text-indigo-400 mb-4" size={48} />
              <p className="text-indigo-200 text-sm font-light">Sintonizando...</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className={`transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}
          />

          {!isConnected && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                <Activity size={64} className="text-slate-600" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center max-w-xs min-h-[4rem]">
          <p className="text-slate-200 font-light text-xl leading-relaxed animate-fade-in">
            {isConnecting ? "Respirando contigo..." :
              isConnected ? "Estoy escuchando." :
                "Toca el micrófono para hablar."}
          </p>
          {isConnected && (
            <p className="text-indigo-300 text-xs mt-2 animate-pulse">
              IA reflexiva • Voz: {selectedVoice}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-rose-500/10 text-rose-200 px-6 py-3 rounded-2xl text-sm border border-rose-500/20 backdrop-blur-sm animate-fade-in flex items-center gap-2">
            <Volume2 size={16} /> {error}
          </div>
        )}
      </div>

      <div className="relative z-10 p-8 pb-32 flex justify-center items-center gap-8">
        {!isConnected && !isConnecting ? (
          <button
            onClick={connect}
            className="group relative w-24 h-24 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full opacity-100 shadow-[0_0_40px_rgba(79,70,229,0.4)]"></div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-full transition-opacity"></div>
            <Mic size={36} className="relative z-10 text-white" />
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-6 rounded-full transition-all duration-300 border ${isMuted
                ? 'bg-slate-800 border-slate-600 text-rose-400'
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                }`}
            >
              {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            <button
              onClick={disconnect}
              className="w-20 h-20 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
            >
              <StopCircle size={32} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LivePage;