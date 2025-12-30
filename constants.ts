import { WellnessResource } from './types';

export const HELPLINES = [
  { name: 'Emergencias Generales', number: '911' },
  { name: 'Línea de Vida (Prevención)', number: '800-911-2000' },
  { name: 'Cruz Roja', number: '065' },
];

export const WELLNESS_RESOURCES: WellnessResource[] = [
  {
    id: '1',
    title: 'Respiración 4-7-8',
    description: 'Técnica simple para reducir la ansiedad rápidamente.',
    icon: 'Wind',
    category: 'breathing',
    duration: '2 min'
  },
  {
    id: '2',
    title: 'Técnica 5-4-3-2-1',
    description: 'Ejercicio de grounding para reconectar con el presente.',
    icon: 'Anchor',
    category: 'grounding',
    duration: '5 min'
  },
  {
    id: '3',
    title: 'Diario de Gratitud',
    description: 'Escribe 3 cosas por las que te sientes bien hoy.',
    icon: 'BookHeart',
    category: 'journaling',
    duration: '3 min'
  },
  {
    id: '4',
    title: 'Sonidos de Lluvia',
    description: 'Audio relajante para calmar la mente.',
    icon: 'CloudRain',
    category: 'routine',
    duration: '∞'
  }
];

export const SAFETY_KEYWORDS = [
  'morir', 'suicidio', 'matarme', 'fin', 'no puedo más', 'herirme', 'sangre', 'adiós', 'peligro', 'ayuda'
];

export const DEFAULT_SOS_MESSAGE = "Hola, no me siento bien y necesito apoyo. Por favor, contáctame cuando veas esto.";