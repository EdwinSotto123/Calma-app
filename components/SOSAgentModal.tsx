import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { X, Volume2, Loader2, Heart, Mic, MicOff } from 'lucide-react';
import { LoveMessage } from '../types';
import { getRandomLoveMessage } from '../services/firebaseService';

const getSOSInstruction = (loveMessage?: LoveMessage | null) => `
Eres "Calma", una IA experta en primeros auxilios psicológicos.
TU MISIÓN: Estabilizar al usuario que está sufriendo un ataque de pánico o ansiedad severa AHORA MISMO.

PERFIL DE VOZ:
- Tono: Profundo, cálido, lento y seguro.
- Velocidad: Muy pausada. Deja silencios de 2-3 segundos entre frases para que el usuario procese.
- Actitud: Amor incondicional. Eres su ancla.

CONTEXTO DE AMOR (USAR ESTRATÉGICAMENTE):
${loveMessage ? `TIENES UN "SUPERPODER": El usuario tiene un vínculo fuerte con ${loveMessage.senderName} (${loveMessage.relation}).
MENSAJE DE ELLOS: "${loveMessage.type === 'text' ? loveMessage.content : loveMessage.caption || 'Te enviaron una foto/audio especial'}".
CUÁNDO USARLO:
1. Si el usuario dice que tiene miedo o se siente solo.
2. Para cerrar la sesión con un sentimiento de conexión ("${loveMessage.senderName} está orgulloso/a de ti").` : ''}

PROTOCOLO DE INTERVENCIÓN EXTENDIDO (Sigue el orden, pero adáptate al nivel de ansiedad):

1. **FASE 1: REGULACIÓN FISIOLÓGICA (El "Freno")**
   - *Objetivo:* Bajar el ritmo cardíaco inmediatamente.
   - Acción: "No necesitas hablar. Solo escúchame. Vamos a respirar juntos."
   - Técnica: "Inhala suave... 1, 2, 3... Retén el aire... y suelta muy despacio... como soplando una vela... 1, 2, 3, 4."
   - *Regla:* Si dice "no puedo respirar", responde: "Es normal sentir eso. No te fuerces. Solo nota cómo entra el aire, aunque sea un poquito. Estoy aquí."

2. **FASE 2: CONEXIÓN SENSORIAL (Grounding)**
   - *Objetivo:* Sacar a la mente del futuro catastrófico y traerla al presente físico.
   - Técnica A (Tacto): "Toca la tela de tu ropa o la silla. ¿Es suave o rugosa? Frotala con tu dedo."
   - Técnica B (Temperatura): "¿Sientes frío o calor en tus manos ahora mismo?"
   - Técnica C (Vista): "Busca 3 cosas de color azul a tu alrededor. Solo míralas."

3. **FASE 3: DISRUPCIÓN COGNITIVA (Romper el Bucle)**
   - *Objetivo:* Activar el córtex prefrontal con tareas lógicas simples que impiden el pánico.
   - Pregunta Inesperada 1: "¿Cuál fue la última comida que realmente disfrutaste? Trata de saborearla en tu mente."
   - Pregunta Inesperada 2: "Si pudieras estar en cualquier lugar del mundo ahora mismo, ¿dónde sería? Descríbeme el suelo de ese lugar."
   - Pregunta Inesperada 3: "Dime 3 animales que empiecen con la letra G."
   - Pregunta Inesperada 4: "Deletrea tu nombre al revés, despacito."

4. **FASE 4: VISUALIZACIÓN SEGURA (Refugio Mental)**
   - *Objetivo:* Inducir relajación profunda una vez que el pánico agudo ha bajado.
   - Técnica: "Imagina un lugar donde te sientas totalmente a salvo. Puede ser una playa, una cabaña o tu cama. ¿A qué huele ahí? ¿Qué escuchas? Quédate ahí un momento."

5. **FASE 5: MICRO-PASOS DE SALIDA (Puente a la Realidad)**
   - *Objetivo:* Recuperar la agencia y control sobre su cuerpo con acciones minúsculas.
   - Técnica A: "¿Tienes un vaso de agua cerca? Bebe un sorbo pequeño. Siente cómo baja fría."
   - Técnica B: "¿Puedes estirar los brazos hacia arriba como si quisieras tocar el techo? Hazlo suavemente."

6. **FASE 6: VALIDACIÓN Y CIERRE (Oxitocina)**
   - *Objetivo:* Que se sienta amado y capaz.
   - Frase: "Lo has hecho increíblemente bien. Es muy valiente parar y respirar."
   - *Uso del Contexto:* "Recuerda que ${loveMessage ? loveMessage.senderName : 'tu gente'} te quiere y te espera."

REGLAS DE ORO:
- **NUNCA** digas "cálmate". Di "estoy contigo", "estás a salvo", "esto pasará".
- **SI HAY SILENCIO:** No lo llenes con ruido. Espera unos segundos y di suavemente: "Sigo aquí. Respira."
- **SI MENCIONA AUTOLESIÓN:** "Siento mucho que te duela tanto. Eres importante para mí y para el mundo. Por favor, quédate conmigo respirando un poco más." (Y sugiere contacto profesional con amor).
`;

interface SOSAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

const SOSAgentModal: React.FC<SOSAgentModalProps> = ({ isOpen, onClose, userId }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [loveMessage, setLoveMessage] = useState<LoveMessage | null>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectedRef = useRef(false);
    const isManualDisconnectRef = useRef(false);

    useEffect(() => {
        const apiKey = process.env.API_KEY;
        const expectedPrefix = "AIzaSyBH";
        
        console.log('[SOSAgent] Init - API Key:', apiKey ? `${apiKey.slice(0, 8)}...` : 'MISSING');
        
        if (apiKey && !apiKey.startsWith(expectedPrefix)) {
            console.error(`[SOSAgent] CRITICAL WARNING: The API Key in use (${apiKey.slice(0, 8)}...) does NOT match the expected key in .env (${expectedPrefix}...). Please RESTART your Vite server.`);
            setConnectionError("Error de configuración: Reinicia la terminal (API Key desactualizada).");
        }

        if (apiKey) {
            aiRef.current = new GoogleGenAI({ apiKey });
        } else {
            console.error('[SOSAgent] No API key found!');
        }
        
        return () => {
            disconnect();
        };
    }, []);

    const lastAiResponseTimeRef = useRef<number>(Date.now());
    const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log('[SOSAgent] isOpen changed to:', isOpen);
        if (isOpen) {
            setConnectionError(null);
            isManualDisconnectRef.current = false;
            
            const init = async () => {
                let msg = null;
                if (userId) {
                    try {
                        msg = await getRandomLoveMessage(userId);
                        setLoveMessage(msg);
                    } catch (e) {
                        console.error("Error loading love message:", e);
                    }
                }
                connect(msg);
            };
            init();

            startBreathCycle();
            
            // Silence Loop: Check every 5s if AI hasn't spoken in 12s
            silenceCheckIntervalRef.current = setInterval(() => {
                if (!isConnectedRef.current) return;
                
                const timeSinceLastResponse = Date.now() - lastAiResponseTimeRef.current;
                const isAiSpeaking = scheduledSourcesRef.current.length > 0;

                if (timeSinceLastResponse > 12000 && !isAiSpeaking) {
                    console.log("[SOSAgent] Silence detected, prompting AI...");
                    sessionPromiseRef.current?.then(session => {
                        session.sendClientContent({ 
                            turns: [{ role: 'user', parts: [{ text: "(El usuario sigue en silencio escuchando. Continúa guiando la respiración o di algo reconfortante para llenar el silencio. No preguntes nada, solo acompaña.)" }] }],
                            turnComplete: true
                        });
                        lastAiResponseTimeRef.current = Date.now(); // Reset to avoid spam
                    });
                }
            }, 5000);

        } else {
            console.log('[SOSAgent] Closing - calling disconnect');
            disconnect();
            if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
            if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);
        }
    }, [isOpen]);

    const startBreathCycle = () => {
        let phase = 0;
        breathIntervalRef.current = setInterval(() => {
            if (phase === 0) setBreathPhase('inhale');
            else if (phase === 1) setBreathPhase('hold');
            else setBreathPhase('exhale');
            phase = (phase + 1) % 3;
        }, 3000);
    };

    const loadLoveMessage = async () => {
        if (userId) {
            const msg = await getRandomLoveMessage(userId);
            setLoveMessage(msg);
        }
    };

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
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const pcmToAudioBuffer = (base64Audio: string, ctx: AudioContext) => {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
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

    const playAudio = (base64Audio: string) => {
        console.log('[SOSAgent] Playing audio, length:', base64Audio.length);
        if (!outputAudioContextRef.current) {
            console.error('[SOSAgent] No output audio context!');
            return;
        }
        const ctx = outputAudioContextRef.current;
        
        // Resume audio context if suspended (required by browsers)
        if (ctx.state === 'suspended') {
            console.log('[SOSAgent] Resuming suspended audio context');
            ctx.resume();
        }
        
        const buffer = pcmToAudioBuffer(base64Audio, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
        scheduledSourcesRef.current.push(source);
        console.log('[SOSAgent] Audio scheduled at:', startTime);
    };

    const stopAudioPlayback = () => {
        scheduledSourcesRef.current.forEach(source => {
            try { source.stop(); } catch {}
        });
        scheduledSourcesRef.current = [];
        if (outputAudioContextRef.current) {
            nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
        }
    };

    const connect = async (initialLoveMessage?: LoveMessage | null) => {
        setConnectionError(null);
        setIsConnecting(true);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key not found");
            
            // Always create a fresh client for the session
            const client = new GoogleGenAI({ apiKey });
            aiRef.current = client;

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

            const config = {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
                systemInstruction: getSOSInstruction(initialLoveMessage),
            };

            console.log('[SOSAgent] Connecting with config:', config);

            sessionPromiseRef.current = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config,
                callbacks: {
                    onopen: () => {
                        console.log("[SOSAgent] Gemini Connected");
                        setIsConnected(true);
                        isConnectedRef.current = true;
                        setIsConnecting(false);

                        if (!inputAudioContextRef.current) return;
                        const ctx = inputAudioContextRef.current;
                        if (ctx.state === 'suspended') ctx.resume();

                        // Create audio pipeline INSIDE onopen (like LivePage)
                        const source = ctx.createMediaStreamSource(stream);
                        const processor = ctx.createScriptProcessor(4096, 1, 1);

                        source.connect(processor);
                        processor.connect(ctx.destination);

                        sourceRef.current = source;
                        processorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            if (!isConnectedRef.current) return;
                            
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

                        // TRIGGER INITIAL GREETING (Speak First)
                        setTimeout(() => {
                            sessionPromiseRef.current?.then(session => {
                                console.log("[SOSAgent] Sending initial trigger...");
                                session.sendClientContent({ 
                                    turns: [{ role: 'user', parts: [{ text: "ALERTA: El usuario ha activado el modo SOS. INICIA EL PROTOCOLO INMEDIATAMENTE. Háblale con voz calmada y empieza la respiración guiada." }] }],
                                    turnComplete: true
                                });
                            });
                        }, 1000);
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        const serverContent = msg.serverContent;

                        if (serverContent?.interrupted) {
                            console.log("[SOSAgent] Interrupted!");
                            stopAudioPlayback();
                            return;
                        }

                        const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            lastAiResponseTimeRef.current = Date.now(); // Update last response time
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
                    onclose: (event) => {
                        console.log("[SOSAgent] Session Closed", event);
                        console.log("[SOSAgent] Close Code:", event.code, "Reason:", event.reason);
                        if (!isManualDisconnectRef.current) {
                            setConnectionError(`Sesión cerrada: ${event.reason || 'Inesperadamente'}`);
                        }
                        disconnect();
                    },
                    onerror: (e) => {
                        console.error("[SOSAgent] Session Error", e);
                        setConnectionError("Error de conexión.");
                        disconnect();
                    }
                }
            });

        } catch (err) {
            console.error("[SOSAgent] Error:", err);
            setConnectionError("Error de micrófono o red.");
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        isManualDisconnectRef.current = true;
        setIsConnected(false);
        isConnectedRef.current = false;
        setIsConnecting(false);
        stopAudioPlayback();

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());

        sourceRef.current?.disconnect();
        processorRef.current?.disconnect();

        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        sessionPromiseRef.current?.then(session => {
            try { session.close(); } catch {}
        });

        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        sessionPromiseRef.current = null;
    };

    if (!isOpen) return null;

    const breathText = {
        inhale: 'Inhala...',
        hold: 'Mantén...',
        exhale: 'Exhala...'
    };

    const breathScale = {
        inhale: 'scale-110',
        hold: 'scale-110',
        exhale: 'scale-90'
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950 flex flex-col">
            {/* Soft ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[150px]"></div>
            </div>

            {/* Close button */}
            <button
                onClick={() => { disconnect(); onClose(); }}
                className="absolute top-6 right-6 z-20 p-3 bg-white/10 rounded-full text-white/60 hover:bg-white/20"
            >
                <X size={24} />
            </button>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">

                {/* Error State - Show breathing exercise anyway */}
                {connectionError && !isConnecting && !isConnected && (
                    <div className="text-center animate-fade-in">
                        {/* Breathing circle still works! */}
                        <div
                            className={`w-56 h-56 rounded-full bg-gradient-to-br from-teal-400/40 to-purple-400/40 flex items-center justify-center mx-auto mb-6 transition-transform duration-[3000ms] ease-in-out ${breathScale[breathPhase]} border-4 border-white/20`}
                        >
                            <div className="text-center">
                                <p className="text-white text-2xl font-light">{breathText[breathPhase]}</p>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">Respira conmigo</h1>
                        <p className="text-white/50 mb-4">Sigue el círculo, todo estará bien</p>
                        
                        {/* Error message */}
                        <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 mb-4 max-w-xs mx-auto">
                            <p className="text-amber-200 text-sm">{connectionError}</p>
                        </div>

                        <button
                            onClick={() => connect()}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
                        >
                            Reintentar conexión de voz
                        </button>
                    </div>
                )}

                {/* Initial State - Not connected, not connecting, no error */}
                {!isConnecting && !isConnected && !connectionError && (
                    <div className="text-center animate-fade-in">
                        <div
                            className={`w-56 h-56 rounded-full bg-gradient-to-br from-teal-400/40 to-purple-400/40 flex items-center justify-center mx-auto mb-6 transition-transform duration-[3000ms] ease-in-out ${breathScale[breathPhase]} border-4 border-white/20`}
                        >
                            <div className="text-center">
                                <p className="text-white text-2xl font-light">{breathText[breathPhase]}</p>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Respira conmigo</h1>
                        <p className="text-white/50 mb-6">Sigue el círculo mientras conectamos...</p>
                    </div>
                )}

                {/* Connecting */}
                {isConnecting && (
                    <div className="text-center animate-fade-in">
                        <div className="w-32 h-32 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-8">
                            <Loader2 className="w-16 h-16 text-teal-400 animate-spin" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">Estoy aquí</h1>
                        <p className="text-white/50 text-lg">Preparando un espacio seguro...</p>
                    </div>
                )}

                {/* Connected - Breathing Circle */}
                {isConnected && (
                    <div className="text-center animate-fade-in">
                        {/* Giant breathing circle */}
                        <div
                            className={`w-56 h-56 rounded-full bg-gradient-to-br from-teal-400/40 to-purple-400/40 flex items-center justify-center mx-auto mb-6 transition-transform duration-[3000ms] ease-in-out ${breathScale[breathPhase]} border-4 border-white/20`}
                        >
                            <div className="text-center">
                                <p className="text-white text-2xl font-light">{breathText[breathPhase]}</p>
                            </div>
                        </div>

                        {/* Message */}
                        <h1 className="text-3xl font-bold text-white mb-2">Respira conmigo</h1>
                        <p className="text-white/50 mb-6">Calma está escuchando</p>

                        {/* Mic indicator */}
                        <div className="flex items-center justify-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6">
                            <Mic size={18} className="text-green-400 animate-pulse" />
                            <span className="text-white/70 text-sm">Puedes hablar o solo escuchar</span>
                        </div>

                        {/* Quick Actions for Non-Verbal */}
                        <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                            <button 
                                onClick={() => {
                                    sessionPromiseRef.current?.then(s => s.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Me cuesta respirar, ayúdame más despacio." }] }], turnComplete: true }));
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white/80 text-sm px-4 py-2 rounded-full transition-colors"
                            >
                                🫁 Me cuesta respirar
                            </button>
                            <button 
                                onClick={() => {
                                    sessionPromiseRef.current?.then(s => s.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Tengo mucho miedo, dime que estoy a salvo." }] }], turnComplete: true }));
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white/80 text-sm px-4 py-2 rounded-full transition-colors"
                            >
                                🛡️ Tengo miedo
                            </button>
                            <button 
                                onClick={() => {
                                    sessionPromiseRef.current?.then(s => s.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Estoy un poco mejor, gracias." }] }], turnComplete: true }));
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white/80 text-sm px-4 py-2 rounded-full transition-colors"
                            >
                                💚 Estoy mejor
                            </button>
                        </div>
                    </div>
                )}

                {/* Love Message (if exists) - Only for text type */}
                {loveMessage && isConnected && loveMessage.type === 'text' && (
                    <div className="mt-10 bg-white/5 backdrop-blur-sm p-6 rounded-2xl max-w-xs text-center border border-white/10 animate-fade-in">
                        <Heart className="text-rose-400 mx-auto mb-3" size={24} fill="currentColor" />
                        <p className="text-white/90 text-lg italic mb-2">"{loveMessage.content}"</p>
                        <p className="text-white/40 text-sm">— {loveMessage.senderName}</p>
                    </div>
                )}

                {/* Love Message for photo */}
                {loveMessage && isConnected && loveMessage.type === 'photo' && (
                    <div className="mt-10 bg-white/5 backdrop-blur-sm p-4 rounded-2xl max-w-xs text-center border border-white/10 animate-fade-in">
                        <Heart className="text-rose-400 mx-auto mb-3" size={24} fill="currentColor" />
                        <img
                            src={loveMessage.content}
                            alt="De alguien que te quiere"
                            className="w-full h-32 object-cover rounded-xl mb-2"
                        />
                        {loveMessage.caption && (
                            <p className="text-white/70 text-sm italic">"{loveMessage.caption}"</p>
                        )}
                        <p className="text-white/40 text-sm mt-2">— {loveMessage.senderName}</p>
                    </div>
                )}

                {/* Love Message for audio */}
                {loveMessage && isConnected && loveMessage.type === 'audio' && (
                    <div className="mt-10 bg-white/5 backdrop-blur-sm p-5 rounded-2xl max-w-xs text-center border border-white/10 animate-fade-in">
                        <Heart className="text-rose-400 mx-auto mb-3" size={24} fill="currentColor" />
                        <p className="text-white/70 text-sm mb-3">Mensaje de voz de {loveMessage.senderName}</p>
                        <audio
                            controls
                            className="w-full"
                            src={loveMessage.content}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="relative z-10 p-6 text-center">
                <p className="text-white/30 text-sm">
                    Cierra cuando te sientas mejor 💚
                </p>
            </div>
        </div>
    );
};

export default SOSAgentModal;
