import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import KitPage from './pages/KitPage';
import ChatPage from './pages/ChatPage';
import LivePage from './pages/LivePage';
import ShareQRPage from './pages/ShareQRPage';
import ProfilePage from './pages/ProfilePage';
import SOSPage from './pages/SOSPage';
import SafetyPlanPage from './pages/SafetyPlanPage';
import JournalPage from './pages/JournalPage';
import WellnessPage from './pages/WellnessPage';
import ChallengesPage from './pages/ChallengesPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import LoveWallPage from './pages/LoveWallPage';
import SendLovePage from './pages/SendLovePage';
import { UserState, Contact, Mood, Reminder, SafetyPlan, DailyLog, Memory, Medication } from './types';
import { DEFAULT_SOS_MESSAGE } from './constants';
import {
  onAuthChange,
  logOut,
  getUserDocument,
  createUserDocument,
  updateUserOnboardingComplete,
  updateUserState as updateFirestoreUserState,
  FirestoreUserData
} from './services/firebaseService';
import { Loader2 } from 'lucide-react';

// --- Context Definition ---
interface AppContextType {
  firebaseUser: User | null;
  userState: UserState;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  updateName: (name: string) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  logMood: (mood: Mood) => void;
  saveNote: (note: string) => void;
  removeNote: (index: number) => void;
  addMemory: (memory: Memory) => void;
  removeMemory: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  updateSafetyPlan: (section: keyof SafetyPlan, items: string[]) => void;
  logDailyEntry: (entry: DailyLog) => void;
  addMedication: (medication: Medication) => void;
  removeMedication: (id: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// Default user state
const getDefaultUserState = (email: string = '', name: string = ''): UserState => ({
  name,
  email,
  emergencySettings: {
    sosMessage: DEFAULT_SOS_MESSAGE,
    contacts: [],
  },
  moodHistory: [],
  dailyLogs: [],
  savedNotes: ["Eres más fuerte de lo que crees.", "Esto también pasará.", "Mereces sentir paz."],
  memories: [],
  reminders: [],
  safetyPlan: {
    warningSigns: [],
    copingStrategies: [],
    distractions: [],
    supportNetwork: [],
    environmentSafe: [],
    reasonsToLive: []
  },
  medications: [],
  baselineMood: null,
});

// --- App Component ---
const App: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userState, setUserState] = useState<UserState>(getDefaultUserState());
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);

      if (user) {
        // User is logged in, fetch their data from Firestore
        const userData = await getUserDocument(user.uid);

        if (userData) {
          // Existing user
          setUserState(userData.userState);
          setHasCompletedOnboarding(userData.hasCompletedOnboarding);
        } else {
          // New user - create document
          await createUserDocument(user);
          setUserState(getDefaultUserState(user.email || '', user.displayName || ''));
          setHasCompletedOnboarding(false);
        }
      } else {
        // User is logged out
        setUserState(getDefaultUserState());
        setHasCompletedOnboarding(false);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync userState to Firestore (debounced)
  useEffect(() => {
    if (!firebaseUser || isLoading) return;

    const timeoutId = setTimeout(() => {
      updateFirestoreUserState(firebaseUser.uid, userState);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [userState, firebaseUser, isLoading]);

  // Handlers for onboarding completion
  const handleOnboardingComplete = async (data: {
    name: string;
    takesMedication: boolean;
    medications: Medication[];
    emergencyContact: Contact | null;
    baselineMood: Mood | null;
  }) => {
    if (!firebaseUser) return;

    // Update Firestore
    await updateUserOnboardingComplete(firebaseUser.uid, {
      name: data.name,
      medications: data.medications,
      emergencyContact: data.emergencyContact,
      baselineMood: data.baselineMood,
    });

    // Update local state
    setUserState(prev => ({
      ...prev,
      name: data.name,
      medications: data.medications,
      baselineMood: data.baselineMood,
      reminders: data.medications.map(m => ({
        id: `med-${m.id}`,
        text: `Tomar ${m.name}`,
        time: m.time || '09:00',
        enabled: true,
      })),
      emergencySettings: data.emergencyContact
        ? { ...prev.emergencySettings, contacts: [data.emergencyContact] }
        : prev.emergencySettings,
    }));

    setHasCompletedOnboarding(true);
  };

  const logout = async () => {
    await logOut();
  };

  // User state handlers
  const updateName = (name: string) => {
    setUserState(prev => ({ ...prev, name }));
  };

  const addContact = (contact: Contact) => {
    setUserState(prev => ({
      ...prev,
      emergencySettings: {
        ...prev.emergencySettings,
        contacts: [...prev.emergencySettings.contacts, contact]
      }
    }));
  };

  const removeContact = (id: string) => {
    setUserState(prev => ({
      ...prev,
      emergencySettings: {
        ...prev.emergencySettings,
        contacts: prev.emergencySettings.contacts.filter(c => c.id !== id)
      }
    }));
  };

  const logMood = (mood: Mood) => {
    setUserState(prev => ({
      ...prev,
      moodHistory: [...prev.moodHistory, { date: new Date().toISOString(), mood }]
    }));
  };

  const saveNote = (note: string) => {
    setUserState(prev => ({
      ...prev,
      savedNotes: [note, ...prev.savedNotes]
    }));
  };

  const removeNote = (index: number) => {
    setUserState(prev => {
      const newNotes = [...prev.savedNotes];
      newNotes.splice(index, 1);
      return { ...prev, savedNotes: newNotes };
    });
  };

  const addMemory = (memory: Memory) => {
    setUserState(prev => ({
      ...prev,
      memories: [memory, ...prev.memories]
    }));
  };

  const removeMemory = (id: string) => {
    setUserState(prev => ({
      ...prev,
      memories: prev.memories.filter(m => m.id !== id)
    }));
  };

  const addReminder = (reminder: Reminder) => {
    setUserState(prev => ({
      ...prev,
      reminders: [...prev.reminders, reminder]
    }));
  };

  const removeReminder = (id: string) => {
    setUserState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id)
    }));
  };

  const toggleReminder = (id: string) => {
    setUserState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    }));
  };

  const updateSafetyPlan = (section: keyof SafetyPlan, items: string[]) => {
    setUserState(prev => ({
      ...prev,
      safetyPlan: {
        ...prev.safetyPlan,
        [section]: items
      }
    }));
  };

  const logDailyEntry = (entry: DailyLog) => {
    setUserState(prev => {
      const filteredLogs = prev.dailyLogs.filter(log => log.date !== entry.date);
      return {
        ...prev,
        dailyLogs: [...filteredLogs, entry]
      };
    });
  };

  const addMedication = (medication: Medication) => {
    setUserState(prev => ({
      ...prev,
      medications: [...prev.medications, medication]
    }));
  };

  const removeMedication = (id: string) => {
    setUserState(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m.id !== id)
    }));
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-teal-500 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      firebaseUser,
      userState,
      isLoading,
      hasCompletedOnboarding,
      updateName,
      addContact,
      removeContact,
      logMood,
      saveNote,
      removeNote,
      addMemory,
      removeMemory,
      addReminder,
      removeReminder,
      toggleReminder,
      updateSafetyPlan,
      logDailyEntry,
      addMedication,
      removeMedication,
      logout,
    }}>
      <HashRouter>
        <Routes>
          {/* Login (No Layout) */}
          <Route path="/login" element={
            firebaseUser
              ? <Navigate to={hasCompletedOnboarding ? "/" : "/onboarding"} replace />
              : <LoginPage />
          } />

          {/* Onboarding (No Layout) */}
          <Route path="/onboarding" element={
            !firebaseUser
              ? <Navigate to="/login" replace />
              : hasCompletedOnboarding
                ? <Navigate to="/" replace />
                : <OnboardingPage onComplete={handleOnboardingComplete} />
          } />

          {/* Public Route - Send Love Message (No Auth Required) */}
          <Route path="/love/:userId" element={<SendLovePage />} />

          {/* Protected Routes (With Layout) */}
          <Route path="/*" element={
            !firebaseUser ? (
              <Navigate to="/login" replace />
            ) : !hasCompletedOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/wellness" element={<WellnessPage />} />
                  <Route path="/kit" element={<KitPage />} />
                  <Route path="/sos" element={<SOSPage />} />
                  <Route path="/safety-plan" element={<SafetyPlanPage />} />
                  <Route path="/journal" element={<JournalPage />} />
                  <Route path="/challenges" element={<ChallengesPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/live" element={<LivePage />} />
                  <Route path="/share" element={<ShareQRPage />} />
                  <Route path="/love-wall" element={<LoveWallPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            )
          } />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;