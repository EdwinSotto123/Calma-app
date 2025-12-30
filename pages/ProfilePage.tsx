import React, { useState } from 'react';
import { useApp } from '../App';
import { User, Phone, Trash2, Plus, Save, Bell, Clock, ToggleLeft, ToggleRight, Settings, ArrowLeft, Heart, ChevronRight } from 'lucide-react';
import { Contact, Reminder } from '../types';
import { DEFAULT_SOS_MESSAGE } from '../constants';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { userState, updateName, addContact, removeContact, addReminder, removeReminder, toggleReminder } = useApp();
  const [newName, setNewName] = useState(userState.name);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');

  const [reminderText, setReminderText] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const handleNameSave = () => {
    updateName(newName);
  };

  const handleAddContact = () => {
    if (contactName && contactPhone) {
      const newContact: Contact = {
        id: Date.now().toString(),
        name: contactName,
        phone: contactPhone,
        relation: contactRelation || 'Amigo/a'
      };
      addContact(newContact);
      setContactName('');
      setContactPhone('');
      setContactRelation('');
      setShowAddContact(false);
    }
  };

  const handleAddReminder = () => {
    if (reminderText && reminderTime) {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        text: reminderText,
        time: reminderTime,
        enabled: true
      };
      addReminder(newReminder);
      setReminderText('');
      setReminderTime('');
      setShowAddReminder(false);
    }
  };

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Ajustes</h1>
          <p className="text-slate-500 text-sm">Personaliza tu espacio seguro.</p>
        </div>
      </header>

      {/* Name Settings */}
      <section className="glass-panel p-5 rounded-[2rem] mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Tu Nombre</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tu nombre o apodo"
            className="flex-1 p-3 bg-white/50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-100"
          />
          <button
            onClick={handleNameSave}
            className="bg-teal-600 text-white p-3 rounded-xl shadow-md shadow-teal-100 active:scale-95 transition-transform"
          >
            <Save size={20} />
          </button>
        </div>
      </section>

      {/* Share Love Link */}
      <Link to="/share" className="block glass-panel p-5 rounded-[2rem] mb-6 group active:scale-95 transition-transform">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-full text-rose-500 group-hover:bg-rose-200 transition-colors">
              <Heart size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Compartir Mi Enlace de Amor</h3>
              <p className="text-xs text-slate-500">Invita a seres queridos a enviarte mensajes</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </div>
      </Link>

      {/* Reminders Settings */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <Bell size={20} className="text-indigo-500" /> Rutinas
          </h2>
          <button
            onClick={() => setShowAddReminder(!showAddReminder)}
            className="bg-indigo-50 text-indigo-600 p-2 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Add Reminder Form */}
        {showAddReminder && (
          <div className="bg-white p-5 rounded-[2rem] mb-4 shadow-lg shadow-indigo-100/50 animate-fade-in z-10 relative">
            <div className="space-y-3">
              <input
                className="w-full p-3 rounded-xl bg-slate-50 border-none text-sm"
                placeholder="Recordatorio (ej. Beber agua)"
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
              />
              <input
                type="time"
                className="w-full p-3 rounded-xl bg-slate-50 border-none text-sm"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <button onClick={handleAddReminder} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md">Guardar</button>
                <button onClick={() => setShowAddReminder(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-bold">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {userState.reminders.map(reminder => (
            <div key={reminder.id} className={`glass-panel p-4 rounded-[1.5rem] flex justify-between items-center transition-all ${reminder.enabled ? 'opacity-100' : 'opacity-60 grayscale'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${reminder.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Clock size={18} />
                </div>
                <div>
                  <p className={`font-bold text-sm ${reminder.enabled ? 'text-slate-800' : 'text-slate-500'}`}>{reminder.text}</p>
                  <p className="text-xs text-slate-400 font-mono">{reminder.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleReminder(reminder.id)} className="text-slate-400 hover:text-indigo-500 transition-colors p-2">
                  {reminder.enabled ? <ToggleRight size={28} className="text-indigo-500" /> : <ToggleLeft size={28} />}
                </button>
                <button onClick={() => removeReminder(reminder.id)} className="text-slate-300 hover:text-rose-400 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contacts Settings */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <Phone size={20} className="text-teal-500" /> Contactos SOS
          </h2>
          <button
            onClick={() => setShowAddContact(!showAddContact)}
            className="bg-teal-50 text-teal-600 p-2 rounded-full hover:bg-teal-100 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddContact && (
          <div className="bg-white p-5 rounded-[2rem] mb-4 shadow-lg shadow-teal-100/50 animate-fade-in relative z-10">
            <div className="space-y-3">
              <input
                className="w-full p-3 rounded-xl bg-slate-50 border-none text-sm"
                placeholder="Nombre"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
              />
              <input
                className="w-full p-3 rounded-xl bg-slate-50 border-none text-sm"
                placeholder="Teléfono"
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <button onClick={handleAddContact} className="flex-1 bg-teal-600 text-white py-3 rounded-xl text-sm font-bold shadow-md">Guardar</button>
                <button onClick={() => setShowAddContact(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-bold">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Contact List */}
        <div className="space-y-3">
          {userState.emergencySettings.contacts.map(contact => (
            <div key={contact.id} className="glass-panel p-4 rounded-[1.5rem] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
                  <p className="text-xs text-slate-400">{contact.phone}</p>
                </div>
              </div>
              <button onClick={() => removeContact(contact.id)} className="text-slate-300 hover:text-rose-400 p-2 hover:bg-rose-50 rounded-full transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {userState.emergencySettings.contacts.length === 0 && !showAddContact && (
            <div className="text-center p-8 bg-white/40 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 text-sm">
              Tu lista está vacía.
            </div>
          )}
        </div>
      </section>

      {/* Message Preview */}
      <section className="glass-panel p-6 rounded-[2rem] opacity-70">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Mensaje Automático</h3>
        <p className="text-xs text-slate-600 italic bg-white/50 p-4 rounded-xl leading-relaxed border border-white">
          "{DEFAULT_SOS_MESSAGE}"
        </p>
      </section>

      <div className="mt-8 text-center pb-8">
        <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Calma v2.0 • Soft Edition</p>
      </div>
    </div>
  );
};

export default ProfilePage;