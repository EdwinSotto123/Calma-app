import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { UserState, Medication, Contact, Mood, SafetyPlan, DailyLog, Memory, Reminder } from '../types';

// Firebase configuration
const firebaseConfig = {
    apiKey: "",
    authDomain: "calma-appp.firebaseapp.com",
    projectId: "calma-appp",
    storageBucket: "calma-appp.firebasestorage.app",
    messagingSenderId: "355709552670",
    appId: "1:355709552670:web:a44d6efda732691ba2c60f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// --- AUTH FUNCTIONS ---

export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error('Google Sign In Error:', error);
        throw error;
    }
};

export const logOut = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign Out Error:', error);
        throw error;
    }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// --- FIRESTORE FUNCTIONS ---

// User document structure in Firestore
export interface FirestoreUserData {
    uid: string;
    email: string;
    hasCompletedOnboarding: boolean;
    createdAt: any;
    updatedAt: any;
    userState: UserState;
}

// Check if user exists in Firestore
export const getUserDocument = async (uid: string): Promise<FirestoreUserData | null> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as FirestoreUserData;
        }
        return null;
    } catch (error) {
        console.error('Get User Document Error:', error);
        return null;
    }
};

// Create new user document (after registration)
export const createUserDocument = async (user: User): Promise<void> => {
    try {
        const userRef = doc(db, 'users', user.uid);

        const defaultUserState: UserState = {
            name: user.displayName || '',
            email: user.email || '',
            emergencySettings: {
                sosMessage: "Hola, no me siento bien y necesito apoyo. Por favor, contáctame cuando veas esto.",
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
        };

        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            hasCompletedOnboarding: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            userState: defaultUserState,
        });
    } catch (error) {
        console.error('Create User Document Error:', error);
        throw error;
    }
};

// Update user state after onboarding
export const updateUserOnboardingComplete = async (
    uid: string,
    onboardingData: {
        name: string;
        medications: Medication[];
        emergencyContact: Contact | null;
        baselineMood: Mood | null;
    }
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const currentData = userSnap.data() as FirestoreUserData;

        const updatedUserState: UserState = {
            ...currentData.userState,
            name: onboardingData.name,
            medications: onboardingData.medications,
            baselineMood: onboardingData.baselineMood,
            reminders: onboardingData.medications.map(m => ({
                id: `med-${m.id}`,
                text: `Tomar ${m.name}`,
                time: m.time || '09:00',
                enabled: true,
            })),
            emergencySettings: onboardingData.emergencyContact
                ? {
                    ...currentData.userState.emergencySettings,
                    contacts: [onboardingData.emergencyContact]
                }
                : currentData.userState.emergencySettings,
        };

        await updateDoc(userRef, {
            hasCompletedOnboarding: true,
            updatedAt: serverTimestamp(),
            userState: updatedUserState,
        });
    } catch (error) {
        console.error('Update Onboarding Error:', error);
        throw error;
    }
};

// Update user state (for any changes)
export const updateUserState = async (uid: string, userState: Partial<UserState>): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const currentData = userSnap.data() as FirestoreUserData;

        await updateDoc(userRef, {
            updatedAt: serverTimestamp(),
            userState: {
                ...currentData.userState,
                ...userState,
            },
        });
    } catch (error) {
        console.error('Update User State Error:', error);
        throw error;
    }
};

// --- LOVE MESSAGES FUNCTIONS ---
import { collection, addDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LoveMessage } from '../types';

export const storage = getStorage(app);

// Add a love message to a user's collection
export const addLoveMessage = async (
    targetUserId: string,
    message: Omit<LoveMessage, 'id' | 'createdAt'>
): Promise<string> => {
    try {
        const messagesRef = collection(db, 'users', targetUserId, 'loveMessages');
        const docRef = await addDoc(messagesRef, {
            ...message,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Add Love Message Error:', error);
        throw error;
    }
};

// Get all love messages for a user
export const getLoveMessages = async (uid: string): Promise<LoveMessage[]> => {
    try {
        const messagesRef = collection(db, 'users', uid, 'loveMessages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
        })) as LoveMessage[];
    } catch (error) {
        console.error('Get Love Messages Error:', error);
        return [];
    }
};

// Upload a photo to Firebase Storage and return the URL
export const uploadLovePhoto = async (
    targetUserId: string,
    file: File
): Promise<string> => {
    try {
        const fileName = `love_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `lovePhotos/${targetUserId}/${fileName}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
    } catch (error) {
        console.error('Upload Love Photo Error:', error);
        throw error;
    }
};

// Get a random love message for display
export const getRandomLoveMessage = async (uid: string): Promise<LoveMessage | null> => {
    const messages = await getLoveMessages(uid);
    if (messages.length === 0) return null;
    return messages[Math.floor(Math.random() * messages.length)];
};

// --- CHALLENGES & STREAKS ---
import { StreakData, CompletedChallenge } from '../types';

// Get user's streak data
export const getStreakData = async (uid: string): Promise<StreakData> => {
    try {
        const streakRef = doc(db, 'users', uid, 'gamification', 'streak');
        const streakSnap = await getDoc(streakRef);

        if (streakSnap.exists()) {
            return streakSnap.data() as StreakData;
        }

        // Return default streak data
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: '',
            totalPoints: 0,
            completedChallenges: [],
        };
    } catch (error) {
        console.error('Get Streak Data Error:', error);
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: '',
            totalPoints: 0,
            completedChallenges: [],
        };
    }
};

// Save user's streak data
export const saveStreakData = async (uid: string, data: StreakData): Promise<void> => {
    try {
        const streakRef = doc(db, 'users', uid, 'gamification', 'streak');
        await setDoc(streakRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Save Streak Data Error:', error);
        throw error;
    }
};

// Add a completed challenge
export const addCompletedChallenge = async (
    uid: string,
    challenge: CompletedChallenge,
    points: number
): Promise<StreakData> => {
    try {
        const currentData = await getStreakData(uid);
        const today = new Date().toISOString().split('T')[0];

        // Check if this is first challenge today
        const isFirstToday = !currentData.completedChallenges.some(c => c.date === today);

        // Calculate new streak
        let newStreak = currentData.currentStreak;
        if (isFirstToday) {
            const lastDate = currentData.lastCompletedDate;
            if (!lastDate) {
                newStreak = 1;
            } else {
                const lastDateObj = new Date(lastDate);
                const todayObj = new Date(today);
                const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newStreak = currentData.currentStreak + 1;
                } else if (diffDays > 1) {
                    newStreak = 1; // Streak broken
                }
            }
        }

        const newData: StreakData = {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, currentData.longestStreak),
            lastCompletedDate: today,
            totalPoints: currentData.totalPoints + points,
            completedChallenges: [...currentData.completedChallenges, challenge],
        };

        await saveStreakData(uid, newData);
        return newData;
    } catch (error) {
        console.error('Add Completed Challenge Error:', error);
        throw error;
    }
};

// Check and fix streak (call on app load)
export const validateStreak = async (uid: string): Promise<StreakData> => {
    try {
        const data = await getStreakData(uid);
        const today = new Date().toISOString().split('T')[0];

        if (data.lastCompletedDate) {
            const lastDate = new Date(data.lastCompletedDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            // If more than 1 day passed, streak is broken
            if (diffDays > 1 && data.currentStreak > 0) {
                const fixedData = { ...data, currentStreak: 0 };
                await saveStreakData(uid, fixedData);
                return fixedData;
            }
        }

        return data;
    } catch (error) {
        console.error('Validate Streak Error:', error);
        throw error;
    }
};
