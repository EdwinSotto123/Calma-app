import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Phone, MessageCircle, ArrowLeft, Heart, HeartHandshake, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { HELPLINES } from '../constants';
import { Link } from 'react-router-dom';
import SOSAgentModal from '../components/SOSAgentModal';
import { getLoveMessages } from '../services/firebaseService';
import { LoveMessage } from '../types';

const SOSPage: React.FC = () => {
    const { userState, firebaseUser } = useApp();
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [loveMessages, setLoveMessages] = useState<LoveMessage[]>([]);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showingLoveIndex, setShowingLoveIndex] = useState(0);

    useEffect(() => {
        if (firebaseUser?.uid) {
            getLoveMessages(firebaseUser.uid).then(setLoveMessages);
        }
    }, [firebaseUser]);

    useEffect(() => {
        if (loveMessages.length <= 1) return;
        const interval = setInterval(() => {
            setShowingLoveIndex(prev => (prev + 1) % loveMessages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [loveMessages]);

    const currentLove = loveMessages[showingLoveIndex];
    const hasContacts = userState.emergencySettings.contacts.length > 0;
    const primaryContact = userState.emergencySettings.contacts[0];

    return (
        <>
            <div className="min-h-full bg-gradient-to-b from-rose-50 to-white">
                {/* Header */}
                <div className="p-5 pb-0">
                    <div className="flex items-center gap-3 mb-6">
                        <Link to="/" className="p-2 bg-white rounded-xl text-slate-500 shadow-sm">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800">Estamos contigo</h1>
                            <p className="text-slate-500 text-sm">Elige qué necesitas ahora</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-5 pt-0 space-y-4 pb-24">

                    {/* STEP 1: Calm Down */}
                    <section>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">1. Cálmate</p>
                        <button
                            onClick={() => setShowAgentModal(true)}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-xl shadow-md text-left active:scale-[0.98] transition-transform flex items-center gap-3"
                        >
                            <div className="bg-white/20 p-2.5 rounded-lg">
                                <HeartHandshake size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold">Necesito calmarme</h3>
                                <p className="text-indigo-200 text-xs">Guía de voz para respirar 💙</p>
                            </div>
                        </button>
                    </section>

                    {/* Love Message (if exists) */}
                    {currentLove && (
                        <div className="bg-white p-4 rounded-2xl border border-rose-100 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart size={16} className="text-rose-500" fill="currentColor" />
                                <span className="text-xs font-bold text-rose-600">Alguien te quiere</span>
                            </div>
                            {currentLove.type === 'text' && (
                                <p className="text-slate-600 text-sm italic">"{currentLove.content}"</p>
                            )}
                            {currentLove.type === 'photo' && (
                                <img src={currentLove.content} alt="amor" className="w-full h-24 object-cover rounded-xl" />
                            )}
                            {currentLove.type === 'audio' && (
                                <audio controls className="w-full h-8" src={currentLove.content} />
                            )}
                            <p className="text-xs text-slate-400 mt-2">— {currentLove.senderName}</p>
                        </div>
                    )}

                    {/* STEP 2: Contact Someone */}
                    <section>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">2. Contacta a alguien</p>

                        {hasContacts ? (
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{primaryContact.name}</h3>
                                        <p className="text-xs text-slate-400">{primaryContact.relation}</p>
                                    </div>
                                    <Link to="/love-wall" className="text-xs text-rose-500 font-bold">
                                        Muro de Amor →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={`tel:${primaryContact.phone}`}
                                        className="bg-teal-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        <Phone size={18} /> Llamar
                                    </a>
                                    <a
                                        href={`sms:${primaryContact.phone}?body=${encodeURIComponent(userState.emergencySettings.sosMessage)}`}
                                        className="bg-slate-100 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} /> Mensaje
                                    </a>
                                </div>

                                {/* More contacts */}
                                {userState.emergencySettings.contacts.length > 1 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex flex-wrap gap-2">
                                            {userState.emergencySettings.contacts.slice(1).map(contact => (
                                                <a
                                                    key={contact.id}
                                                    href={`tel:${contact.phone}`}
                                                    className="bg-slate-50 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2"
                                                >
                                                    <Users size={14} /> {contact.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/profile" className="block bg-slate-100 p-4 rounded-2xl text-center">
                                <p className="text-slate-500 text-sm mb-2">Agrega un contacto de confianza</p>
                                <span className="text-teal-600 font-bold text-sm">Configurar →</span>
                            </Link>
                        )}
                    </section>

                    {/* STEP 3: Emergency */}
                    <section>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">3. Emergencia</p>
                        <a
                            href="tel:911"
                            className="flex items-center justify-between bg-rose-500 text-white p-4 rounded-xl shadow-md active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2.5 rounded-lg">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <span className="font-bold">Llamar al 911</span>
                                    <p className="text-rose-200 text-xs">Emergencias graves</p>
                                </div>
                            </div>
                            <span className="text-xl font-black">911</span>
                        </a>
                    </section>

                    {/* More Options (Collapsible) */}
                    <button
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                        className="w-full flex items-center justify-center gap-2 text-slate-400 text-sm font-bold py-2"
                    >
                        {showMoreOptions ? 'Menos opciones' : 'Más opciones'}
                        {showMoreOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showMoreOptions && (
                        <div className="space-y-3 animate-fade-in">
                            {/* Helplines */}
                            <div className="grid gap-2">
                                {HELPLINES.slice(0, 3).map((line, idx) => (
                                    <a
                                        key={idx}
                                        href={`tel:${line.number}`}
                                        className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100"
                                    >
                                        <span className="text-sm font-medium text-slate-700">{line.name}</span>
                                        <span className="font-mono font-bold text-slate-500 text-sm">{line.number}</span>
                                    </a>
                                ))}
                            </div>

                            {/* Safety Plan Link */}
                            <Link
                                to="/safety-plan"
                                className="block bg-indigo-50 p-4 rounded-xl text-center text-indigo-600 font-bold text-sm"
                            >
                                📋 Mi Plan de Seguridad
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* SOS Agent Modal */}
            <SOSAgentModal
                isOpen={showAgentModal}
                onClose={() => setShowAgentModal(false)}
                userId={firebaseUser?.uid}
            />
        </>
    );
};

export default SOSPage;