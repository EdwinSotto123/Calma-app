import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { Message } from '../types';
import { SAFETY_KEYWORDS } from '../constants';
import { Send, Bot, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hola. Soy Calma, tu espacio seguro. Estoy aquí para escucharte sin juzgar. ¿Cómo te sientes en este momento?',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const checkSafetyKeywords = (text: string) => {
      const lowerText = text.toLowerCase();
      const detected = SAFETY_KEYWORDS.some(keyword => lowerText.includes(keyword));
      if (detected) setShowSafetyBanner(true);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    checkSafetyKeywords(userMsg.text);

    const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));
    
    const responseText = await getChatResponse(history, userMsg.text);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* 1. Header Area - Static at top */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm border-b border-slate-100 z-20 shrink-0">
         <div className="flex items-center gap-3">
             <Link to="/" className="text-slate-400 hover:text-slate-600 sm:hidden">
                <ArrowLeft size={20} />
             </Link>
             <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-2 rounded-full shadow-inner border border-teal-50">
                <Bot size={24} className="text-teal-700" />
             </div>
             <div>
                 <h1 className="font-extrabold text-slate-800 text-lg leading-none">Calma</h1>
                 <p className="text-xs text-slate-500 font-medium mt-0.5">Apoyo Emocional IA</p>
             </div>
         </div>
         <Link to="/sos" className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-full transition-colors border border-rose-100 active:scale-95">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold">SOS</span>
         </Link>
      </div>

      {/* 2. Messages Area - Flex Grow & Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 relative">
        {showSafetyBanner && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex justify-between items-center shadow-sm sticky top-0 z-10 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-700 text-sm font-bold">
                    <AlertCircle size={18} />
                    <span>¿Necesitas ayuda urgente?</span>
                </div>
                <Link to="/sos" className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-rose-200 hover:bg-rose-600">
                    Ver Recursos
                </Link>
            </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mr-2 mt-auto shrink-0 border border-teal-50">
                    <Bot size={14} className="text-teal-700" />
                </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-[1.2rem] rounded-br-sm' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-[1.2rem] rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
           <div className="flex justify-start animate-fade-in">
               <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mr-2 mt-auto shrink-0 border border-teal-50">
                  <Bot size={14} className="text-teal-700" />
               </div>
               <div className="bg-white border border-slate-200 rounded-[1.2rem] rounded-bl-sm px-4 py-4 shadow-sm flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
               </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Area - Fixed at bottom, above Nav */}
      {/* pb-24 adds padding to ensure the input is not hidden by the floating Nav bar */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shrink-0 pb-24 z-10">
        <div className="flex gap-2 items-end bg-slate-100 rounded-[1.5rem] p-1.5 pr-1.5 border border-slate-200 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe lo que sientes..."
            className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm max-h-24 py-3 px-3 text-slate-700 placeholder:text-slate-400 leading-normal"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className={`p-3 rounded-full mb-0.5 transition-all duration-300 ${
                inputText.trim() 
                ? 'bg-teal-600 text-white shadow-md transform scale-100 hover:bg-teal-700' 
                : 'bg-slate-200 text-slate-400 scale-95'
            }`}
          >
            <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;