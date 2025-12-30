export enum Mood {
  Great = 'Great',
  Good = 'Good',
  Okay = 'Okay',
  Sad = 'Sad',
  Overwhelmed = 'Overwhelmed',
  Angry = 'Angry'
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface WellnessResource {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'breathing' | 'grounding' | 'journaling' | 'routine';
  duration?: string;
}

export interface EmergencySettings {
  sosMessage: string;
  contacts: Contact[];
}

export interface Reminder {
  id: string;
  text: string;
  time: string;
  enabled: boolean;
}

export interface Memory {
  id: string;
  url: string;
  type: 'image';
  caption?: string;
}

// --- MEDICATION TRACKING ---
export interface Medication {
  id: string;
  name: string;
  frequency: 'daily' | 'twice' | 'thrice' | 'asNeeded';
  time?: string;
  enabled: boolean;
}

// --- SAFETY PLAN FOR DEPRESSION/RISK SUPPORT ---

export interface SafetyPlan {
  warningSigns: string[];
  copingStrategies: string[];
  distractions: string[];
  supportNetwork: string[];
  environmentSafe: string[];
  reasonsToLive: string[];
}

export interface DailyLog {
  date: string; // ISO Date string (YYYY-MM-DD)
  mood: Mood;
  medicationTaken: boolean;
  gratitudeText: string;
  notes: string;
}

// --- LOVE MESSAGES (from supporters via QR) ---
export interface LoveMessage {
  id: string;
  senderName: string;
  relation: string; // pareja, familiar, amigo, etc.
  type: 'text' | 'audio' | 'photo';
  content: string; // text message or URL for audio/photo
  caption?: string; // optional text with audio/photo
  createdAt: number; // timestamp
}

// --- AUTH & ONBOARDING ---
export interface AuthState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  email: string;
}

export interface UserState {
  name: string;
  email: string;
  emergencySettings: EmergencySettings;
  moodHistory: { date: string; mood: Mood }[];
  dailyLogs: DailyLog[];
  safetyPlan: SafetyPlan;
  savedNotes: string[];
  memories: Memory[];
  reminders: Reminder[];
  medications: Medication[];
  baselineMood: Mood | null;
}

export interface WeatherState {
  temp: number;
  conditionCode: number;
  loading: boolean;
  error: boolean;
  permissionDenied: boolean;
}

// --- DAILY CHALLENGES & STREAKS ---
export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  points: number;
  verificationType: 'check' | 'photo' | 'auto' | 'timer';
  category: 'movement' | 'mindfulness' | 'social' | 'selfcare';
}

export interface CompletedChallenge {
  challengeId: string;
  completedAt: number;
  photoUrl?: string; // For photo verification
  date: string; // YYYY-MM-DD
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  totalPoints: number;
  completedChallenges: CompletedChallenge[];
}