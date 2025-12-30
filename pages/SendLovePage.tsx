import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Send, Camera, Mic, Loader2, Check, X, Square, Play, Pause } from 'lucide-react';
import { addLoveMessage } from '../services/firebaseService';
import { uploadAudioToGCS, uploadImageToGCS } from '../services/gcsService';

const RELATIONS = [
    { value: 'pareja', label: '💕 Pareja', emoji: '💕' },
    { value: 'madre', label: '👩 Madre', emoji: '👩' },
    { value: 'padre', label: '👨 Padre', emoji: '👨' },
    { value: 'hermano', label: '👦 Hermano/a', emoji: '👦' },
    { value: 'hijo', label: '👶 Hijo/a', emoji: '👶' },
    { value: 'abuelo', label: '👴 Abuelo/a', emoji: '👴' },
    { value: 'amigo', label: '🤝 Amigo/a', emoji: '🤝' },
    { value: 'familiar', label: '👨‍👩‍👧 Familiar', emoji: '👨‍👩‍👧' },
    { value: 'colega', label: '💼 Colega', emoji: '💼' },
    { value: 'terapeuta', label: '🩺 Terapeuta', emoji: '🩺' },
    { value: 'otro', label: '💚 Otro', emoji: '💚' },
];

const SendLovePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [senderName, setSenderName] = useState('');
    const [relation, setRelation] = useState('');
    const [messageType, setMessageType] = useState<'text' | 'photo' | 'audio'>('text');
    const [textContent, setTextContent] = useState('');
    const [caption, setCaption] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) { stopRecording(); return prev; }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            setError('No se pudo acceder al micrófono.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const deleteRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    const togglePlayback = () => {
        if (!audioPlayerRef.current) {
            audioPlayerRef.current = new Audio(audioUrl!);
            audioPlayerRef.current.onended = () => setIsPlaying(false);
        }
        if (isPlaying) audioPlayerRef.current.pause();
        else audioPlayerRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        if (!senderName.trim()) { setError('Por favor ingresa tu nombre'); return; }
        if (!relation) { setError('Por favor selecciona tu relación'); return; }
        if (messageType === 'text' && !textContent.trim()) { setError('Por favor escribe un mensaje'); return; }
        if (messageType === 'photo' && !photoFile) { setError('Por favor selecciona una foto'); return; }
        if (messageType === 'audio' && !audioBlob) { setError('Por favor graba un mensaje'); return; }

        setError('');
        setIsSending(true);

        try {
            let content = textContent;

            // Upload photo to GCS
            if (messageType === 'photo' && photoFile) {
                setUploadProgress('Subiendo foto...');
                content = await uploadImageToGCS(photoFile, userId);
            }

            // Upload audio to GCS
            if (messageType === 'audio' && audioBlob) {
                setUploadProgress('Subiendo audio...');
                content = await uploadAudioToGCS(audioBlob, userId);
            }

            setUploadProgress('Guardando mensaje...');
            await addLoveMessage(userId, {
                senderName: senderName.trim(),
                relation,
                type: messageType,
                content,
                caption: messageType !== 'text' ? caption : undefined,
            });

            setIsSent(true);
        } catch (err) {
            console.error('Error:', err);
            setError('Hubo un error. Intenta de nuevo.');
        } finally {
            setIsSending(false);
            setUploadProgress('');
        }
    };

    // Success screen
    if (isSent) {
        const relationLabel = RELATIONS.find(r => r.value === relation)?.emoji || '💚';
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 mb-3">¡Enviado!</h1>
                    <p className="text-slate-600 mb-6">
                        Tu mensaje de amor llegará cuando más lo necesite. {relationLabel}
                    </p>
                    <span className="px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-bold">
                        Gracias, {senderName} 💚
                    </span>
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm">
                    <X size={40} className="text-rose-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Link inválido</h1>
                    <p className="text-slate-500">Pídele a tu ser querido el link correcto.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex flex-col p-4">
            {/* Header */}
            <div className="text-center mb-4 pt-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Heart size={28} className="text-rose-500" fill="currentColor" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-800">Mensaje de Amor</h1>
                <p className="text-slate-500 text-sm">Aparecerá cuando más lo necesite 💚</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col max-w-md mx-auto w-full">
                <div className="bg-white p-4 rounded-2xl shadow-xl space-y-4 flex-1">

                    {error && (
                        <div className="bg-rose-50 text-rose-600 px-3 py-2 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Name + Relation Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Tu nombre</label>
                            <input
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="Nombre"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Relación</label>
                            <select
                                value={relation}
                                onChange={(e) => setRelation(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none appearance-none"
                            >
                                <option value="">Seleccionar...</option>
                                {RELATIONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Message Type */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { type: 'text' as const, icon: Send, label: 'Texto' },
                            { type: 'audio' as const, icon: Mic, label: 'Audio' },
                            { type: 'photo' as const, icon: Camera, label: 'Foto' },
                        ].map(({ type, icon: Icon, label }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setMessageType(type)}
                                className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${messageType === type
                                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="text-xs font-bold">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* TEXT */}
                    {messageType === 'text' && (
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value.slice(0, 500))}
                            placeholder="Escribe tu mensaje de amor... 💚"
                            rows={4}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none resize-none animate-fade-in"
                        />
                    )}

                    {/* AUDIO */}
                    {messageType === 'audio' && (
                        <div className="animate-fade-in space-y-3">
                            {!audioUrl ? (
                                <div className="text-center py-4">
                                    {isRecording ? (
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
                                                <Mic size={28} className="text-rose-500" />
                                            </div>
                                            <p className="text-xl font-bold text-rose-500">{formatTime(recordingTime)}</p>
                                            <p className="text-xs text-slate-400">Máximo 60 segundos</p>
                                            <button type="button" onClick={stopRecording} className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 mx-auto">
                                                <Square size={14} /> Parar
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={startRecording} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center text-slate-400 hover:border-rose-300 hover:text-rose-400">
                                            <Mic size={28} className="mb-2" />
                                            <span className="font-bold text-sm">Grabar mensaje</span>
                                            <span className="text-xs mt-1">Hasta 60 segundos</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={togglePlayback} className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                        </button>
                                        <span className="text-sm font-medium text-slate-600">{formatTime(recordingTime)}</span>
                                    </div>
                                    <button type="button" onClick={deleteRecording} className="p-2 text-slate-400 hover:text-rose-500">
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Añade un mensaje (opcional)"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                            />
                        </div>
                    )}

                    {/* PHOTO */}
                    {messageType === 'photo' && (
                        <div className="animate-fade-in space-y-3">
                            {photoPreview ? (
                                <div className="relative rounded-xl overflow-hidden">
                                    <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover" />
                                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-rose-300 hover:text-rose-400">
                                    <Camera size={28} className="mb-2" />
                                    <span className="font-bold text-sm">Seleccionar foto</span>
                                </button>
                            )}
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Añade un mensaje (opcional)"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                            />
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSending}
                    className={`mt-4 w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg ${isSending ? 'bg-slate-400' : 'bg-gradient-to-r from-rose-500 to-pink-500 active:scale-[0.98]'
                        }`}
                >
                    {isSending ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            {uploadProgress || 'Enviando...'}
                        </>
                    ) : (
                        <>
                            <Heart size={18} fill="currentColor" />
                            Enviar con Amor
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default SendLovePage;
