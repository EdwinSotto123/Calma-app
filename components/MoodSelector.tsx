import React from 'react';
import { Mood } from '../types';

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onSelect: (mood: Mood) => void;
}

const moodOptions = [
  { mood: Mood.Great, emoji: '😄', label: 'Genial' },
  { mood: Mood.Good, emoji: '🙂', label: 'Bien' },
  { mood: Mood.Okay, emoji: '😐', label: 'Más o menos' },
  { mood: Mood.Sad, emoji: '😔', label: 'Triste' },
  { mood: Mood.Overwhelmed, emoji: '😫', label: 'Agobiado' },
  { mood: Mood.Angry, emoji: '😠', label: 'Molesto' },
];

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {moodOptions.map((option) => (
        <button
          key={option.mood}
          onClick={() => onSelect(option.mood)}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${
            selectedMood === option.mood
              ? 'bg-teal-100 border-2 border-teal-500 transform scale-105'
              : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
          }`}
        >
          <span className="text-3xl mb-1">{option.emoji}</span>
          <span className="text-xs text-slate-600 font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;