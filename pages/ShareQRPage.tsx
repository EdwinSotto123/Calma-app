import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Share2, Heart, Info, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLoveMessages } from '../services/firebaseService';

const ShareQRPage: React.FC = () => {
    const { firebaseUser, userState } = useApp();
    const [copied, setCopied] = useState(false);
    const [messageCount, setMessageCount] = useState(0);

    // Use Firebase UID for the share URL
    const userId = firebaseUser?.uid || 'demo';
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/#/love/${userId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&color=475569`;

    useEffect(() => {
        if (firebaseUser?.uid) {
            getLoveMessages(firebaseUser.uid).then(msgs => setMessageCount(msgs.length));
        }
    }, [firebaseUser]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Muro de Amor - Calma',
                    text: `${userState.name || 'Alguien'} usa Calma para su bienestar emocional. Puedes enviarle un mensaje de amor aquí:`,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or share failed
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="p-6 pb-24 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Círculo de Amor</h1>
                <p className="text-slate-500 mt-1">Conecta con quienes te aman.</p>
            </header>

            <div className="flex-1 flex flex-col items-center space-y-6">

                {/* Love Messages Count */}
                {messageCount > 0 && (
                    <Link
                        to="/love-wall"
                        className="w-full bg-gradient-to-r from-rose-100 to-pink-100 p-4 rounded-2xl flex items-center justify-between border border-rose-200 animate-fade-in"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-200/50 p-2 rounded-full">
                                <Heart size={20} className="text-rose-500" fill="currentColor" />
                            </div>
                            <div>
                                <p className="font-bold text-rose-700">{messageCount} mensaje{messageCount !== 1 ? 's' : ''} de amor</p>
                                <p className="text-xs text-rose-500">Ver tu Muro de Amor</p>
                            </div>
                        </div>
                        <Sparkles className="text-rose-400" size={20} />
                    </Link>
                )}

                {/* Card Main */}
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-sm text-center">
                    <div className="bg-gradient-to-br from-rose-100 to-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="text-rose-500" fill="currentColor" size={32} />
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-2">Tu Enlace de Amor</h2>
                    <p className="text-sm text-slate-500 mb-6 px-4">
                        Comparte este código con tus personas de confianza. Ellos podrán enviarte <span className="font-bold text-rose-500">mensajes de amor</span> que aparecerán cuando más los necesites.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-2xl inline-block mb-4 border border-slate-200">
                        <img src={qrUrl} alt="QR Code" className="w-48 h-48 opacity-90 mix-blend-multiply" />
                    </div>

                    {/* Link Display */}
                    <div className="flex items-center gap-2 mb-4">
                        <p className="flex-1 text-xs text-slate-400 font-mono truncate bg-slate-100 py-2 px-3 rounded-lg">
                            {shareUrl}
                        </p>
                        <button
                            onClick={handleCopy}
                            className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={handleShare}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-rose-600 hover:to-pink-600 transition-colors shadow-lg shadow-rose-200"
                    >
                        <Share2 size={18} /> Compartir Enlace
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-indigo-50 p-4 rounded-2xl flex gap-3 items-start w-full border border-indigo-100">
                    <Info className="text-indigo-500 shrink-0 mt-1" size={20} />
                    <div className="text-sm text-indigo-800">
                        <p className="font-bold mb-1">¿Cómo funciona?</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Comparte el link o QR con tus seres queridos</li>
                            <li>Ellos escriben un mensaje de amor para ti</li>
                            <li>El mensaje aparece en tu <b>Muro de Amor</b></li>
                            <li>Lo verás cuando más lo necesites 💚</li>
                        </ol>
                    </div>
                </div>

                {/* Test Link */}
                <Link
                    to={`/love/${userId}`}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
                >
                    <ExternalLink size={16} />
                    Ver cómo lo ven los demás
                </Link>

            </div>
        </div>
    );
};

export default ShareQRPage;