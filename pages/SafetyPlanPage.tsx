import React, { useState } from 'react';
import { useApp } from '../App';
import { ShieldCheck, AlertTriangle, Anchor, Coffee, Phone, Home, Heart, ChevronDown, ChevronUp, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafetyPlan } from '../types';

const SafetyPlanPage: React.FC = () => {
  const { userState, updateSafetyPlan } = useApp();
  const [activeSection, setActiveSection] = useState<keyof SafetyPlan | null>('warningSigns');
  
  // Local state for edits
  const [inputs, setInputs] = useState<SafetyPlan>(userState.safetyPlan);

  const sections: { id: keyof SafetyPlan; title: string; icon: React.ReactNode; desc: string }[] = [
      { id: 'warningSigns', title: '1. Señales de Alerta', icon: <AlertTriangle size={20}/>, desc: '¿Qué pensamientos, sentimientos o conductas te indican que una crisis se acerca?' },
      { id: 'copingStrategies', title: '2. Estrategias Internas', icon: <Anchor size={20}/>, desc: '¿Qué puedo hacer yo solo/a para distraerme o relajarme sin contactar a nadie?' },
      { id: 'distractions', title: '3. Personas y Lugares', icon: <Coffee size={20}/>, desc: 'Lugares públicos o personas que me ayudan a distraerme (sin hablar de la crisis).' },
      { id: 'supportNetwork', title: '4. Red de Apoyo', icon: <Phone size={20}/>, desc: '¿A quién puedo llamar para pedir ayuda explícitamente?' },
      { id: 'environmentSafe', title: '5. Entorno Seguro', icon: <Home size={20}/>, desc: '¿Cómo puedo hacer mi ambiente más seguro? (Ej. Alejar objetos peligrosos).' },
      { id: 'reasonsToLive', title: '6. Razones para Vivir', icon: <Heart size={20}/>, desc: '¿Qué es importante para mí? ¿Por qué vale la pena vivir?' },
  ];

  const handleUpdate = (section: keyof SafetyPlan, value: string, index: number) => {
      const newItems = [...inputs[section]];
      newItems[index] = value;
      setInputs(prev => ({ ...prev, [section]: newItems }));
  };

  const addItem = (section: keyof SafetyPlan) => {
      setInputs(prev => ({ ...prev, [section]: [...prev[section], ''] }));
  };

  const handleSave = (section: keyof SafetyPlan) => {
      // Filter empty
      const cleanItems = inputs[section].filter(i => i.trim() !== '');
      updateSafetyPlan(section, cleanItems);
      // Auto advance or close
      setActiveSection(null); 
  };

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto">
      <header className="mb-6 flex items-center gap-3">
        <Link to="/sos" className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <ArrowLeft size={20} />
        </Link>
        <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Plan de Seguridad</h1>
            <p className="text-slate-500 text-xs">Tu guía personalizada para momentos difíciles.</p>
        </div>
      </header>

      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6 text-sm text-indigo-800 leading-relaxed">
          <p><strong>Recuerda:</strong> Este plan es para prevenir. Si sientes que no puedes seguir el plan o estás en peligro inminente, usa el botón SOS o llama a emergencias.</p>
      </div>

      <div className="space-y-4">
          {sections.map((section) => {
              const isOpen = activeSection === section.id;
              const items = inputs[section.id].length > 0 ? inputs[section.id] : [''];

              return (
                  <div key={section.id} className={`bg-white rounded-3xl transition-all duration-300 border ${isOpen ? 'border-teal-200 shadow-lg shadow-teal-50' : 'border-slate-100 shadow-sm'}`}>
                      <button 
                        onClick={() => setActiveSection(isOpen ? null : section.id)}
                        className="w-full flex items-center justify-between p-5 text-left"
                      >
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${isOpen ? 'bg-teal-100 text-teal-600' : 'bg-slate-50 text-slate-400'}`}>
                                  {section.icon}
                              </div>
                              <span className={`font-bold ${isOpen ? 'text-teal-800' : 'text-slate-700'}`}>{section.title}</span>
                          </div>
                          {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                      </button>

                      {isOpen && (
                          <div className="px-5 pb-5 animate-fade-in">
                              <p className="text-xs text-slate-500 mb-4 italic">{section.desc}</p>
                              
                              <div className="space-y-3">
                                  {items.map((item, idx) => (
                                      <input 
                                        key={idx}
                                        value={item}
                                        onChange={(e) => handleUpdate(section.id, e.target.value, idx)}
                                        placeholder="Escribe aquí..."
                                        className="w-full p-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-teal-100 transition-all text-slate-700 placeholder:text-slate-300"
                                      />
                                  ))}
                              </div>

                              <div className="flex gap-2 mt-4">
                                  <button onClick={() => addItem(section.id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                                      + Agregar otro
                                  </button>
                                  <button onClick={() => handleSave(section.id)} className="flex-1 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-100">
                                      <Save size={16} /> Guardar Sección
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default SafetyPlanPage;