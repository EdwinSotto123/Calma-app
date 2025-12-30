import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { ArrowLeft, Heart, Share2, Play, Pause, Loader2, Image as ImageIcon, List } from 'lucide-react';
import { getLoveMessages } from '../services/firebaseService';
import { LoveMessage } from '../types';
import ImageGallery from '../components/Gallery/ImageGallery';
import ImageGrid from '../components/Gallery/ImageGrid';

const RELATION_EMOJIS: Record<string, string> = {
    pareja: '💕',
    madre: '👩',
    padre: '👨',
    hermano: '👦',
    hijo: '👶',
    abuelo: '👴',
    amigo: '🤝',
    familiar: '👨‍👩‍👧',
    colega: '💼',
    terapeuta: '🩺',
    otro: '💚',
};

const LoveWallPage: React.FC = () => {
    const { firebaseUser, userState } = useApp();
    const [messages, setMessages] = useState<LoveMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (firebaseUser?.uid) {
            setIsLoading(true);
            getLoveMessages(firebaseUser.uid)
                .then(setMessages)
                .finally(() => setIsLoading(false));
        }
    }, [firebaseUser]);

    const photoMessages = messages.filter(m => m.type === 'photo');
    const galleryItems = photoMessages.map(msg => ({
        id: msg.id,
        url: msg.content,
        caption: msg.caption,
        senderName: msg.senderName,
        type: 'image' as const,
    }));

    const playAudio = (message: LoveMessage) => {
        if (playingAudioId === message.id) {
            audioRef.current?.pause();
            setPlayingAudioId(null);
        } else {
            if (audioRef.current) audioRef.current.pause();
            audioRef.current = new Audio(message.content);
            audioRef.current.play();
            audioRef.current.onended = () => setPlayingAudioId(null);
            setPlayingAudioId(message.id);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' });
    };

    const shareLink = () => {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/#/love/${firebaseUser?.uid}`;
        if (navigator.share) {
            navigator.share({
                title: 'Envíame un mensaje de amor 💚',
                text: `${userState.name} usa Calma. Envíale un mensaje de apoyo:`,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('¡Link copiado!');
        }
    };

    return (
        <div className="p-4 pb-24 min-h-full bg-gradient-to-b from-rose-50 to-white">
            {/* Header with View Toggle */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-2 bg-white/80 rounded-full hover:bg-white text-slate-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800">Muro de Amor</h1>
                        <p className="text-slate-500 text-xs">{messages.length} mensajes de amor</p>
                    </div>
                </div>
                
                {/* View Mode Toggle - Only show if there are photos */}
                {photoMessages.length > 0 && (
                    <div className="flex bg-white/80 rounded-full p-1 border border-slate-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Vista en lista"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('gallery')}
                            className={`p-2 rounded-full transition-all ${viewMode === 'gallery' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Vista en galería"
                        >
                            <ImageIcon size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Share Button */}
            <button
                onClick={shareLink}
                className="w-full mb-4 bg-gradient-to-r from-rose-400 to-pink-400 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
            >
                <Share2 size={18} />
                Invitar a enviar amor
            </button>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center py-16">
                    <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-3" />
                    <p className="text-slate-500 text-sm">Cargando...</p>
                </div>
            )}

            {/* Debug Info */}
            <div className="bg-slate-100 p-2 rounded-lg mb-4 text-xs text-slate-600">
                <p>Debug: {messages.length} mensajes totales</p>
                <p>Debug: {photoMessages.length} fotos</p>
                <p>Debug: viewMode = {viewMode}</p>
                <p>Debug: isLoading = {isLoading.toString()}</p>
            </div>

            {/* Empty State */}
            {!isLoading && messages.length === 0 && (
                <div className="text-center py-12 px-4">
                    <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart size={32} className="text-rose-400" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">Tu muro está vacío</h2>
                    <p className="text-slate-500 text-sm mb-4">¡Comparte el link para recibir mensajes!</p>
                    <button onClick={shareLink} className="bg-rose-500 text-white px-5 py-2 rounded-lg font-bold text-sm">
                        Compartir
                    </button>
                </div>
            )}

            {/* Gallery View */}
            {!isLoading && messages.length > 0 && viewMode === 'gallery' && (
                <div className="space-y-4">
                    {photoMessages.length > 0 ? (
                        <>
                            <ImageGrid
                                items={galleryItems}
                                onImageClick={(index) => {
                                    setSelectedImageIndex(index);
                                    setGalleryOpen(true);
                                }}
                                columns={3}
                            />
                            <ImageGallery
                                images={galleryItems}
                                isOpen={galleryOpen}
                                onClose={() => setGalleryOpen(false)}
                                initialIndex={selectedImageIndex}
                            />
                        </>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay fotos en tu muro aún</p>
                        </div>
                    )}
                </div>
            )}

            {/* List View */}
            {!isLoading && messages.length > 0 && viewMode === 'list' && (
                <div className="space-y-3">
                    {messages.map((msg, i) => (
                        <div
                            key={msg.id}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-fade-in"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {RELATION_EMOJIS[msg.relation] || msg.senderName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{msg.senderName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 capitalize">{msg.relation}</span>
                                            <span className="text-xs text-slate-300">•</span>
                                            <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                <Heart size={14} className="text-rose-400" fill="currentColor" />
                            </div>

                            {/* Content */}
                            {msg.type === 'text' && (
                                <div className="bg-rose-50 p-3 rounded-xl">
                                    <p className="text-slate-700 text-sm leading-relaxed italic">"{msg.content}"</p>
                                </div>
                            )}

                            {msg.type === 'photo' && (
                                <div className="space-y-2">
                                    <div className="rounded-xl overflow-hidden">
                                        <img src={msg.content} alt={`De ${msg.senderName}`} className="w-full h-40 object-cover" />
                                    </div>
                                    {msg.caption && (
                                        <p className="text-slate-600 text-sm italic px-1">"{msg.caption}"</p>
                                    )}
                                </div>
                            )}

                            {msg.type === 'audio' && (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => playAudio(msg)}
                                        className="w-full bg-indigo-50 p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-100"
                                    >
                                        {playingAudioId === msg.id ? <Pause size={20} className="text-indigo-600" /> : <Play size={20} className="text-indigo-600" />}
                                        <span className="font-medium text-indigo-700 text-sm">
                                            {playingAudioId === msg.id ? 'Pausar' : 'Escuchar'}
                                        </span>
                                    </button>
                                    {msg.caption && (
                                        <p className="text-slate-600 text-sm italic px-1">"{msg.caption}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LoveWallPage;
