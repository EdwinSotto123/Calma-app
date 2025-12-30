import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import MoodSelector from '../components/MoodSelector';
import CatMascot from '../components/CatMascot';
import ProgressWidget from '../components/ProgressWidget';
import EmotionChart from '../components/Charts/EmotionChart';
import { Mood, WeatherState } from '../types';
import { getDailyTip } from '../services/geminiService';
import { fetchWeatherData, getWeatherRecommendation } from '../services/weatherService';
import { getLoveMessages, getStreakData } from '../services/firebaseService';
import { getDailyAffirmation } from '../services/affirmationsService';
import { Sparkles, Settings, Heart, Flame, ChevronRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { userState, logMood, firebaseUser } = useApp();
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [tip, setTip] = useState<string>("");
  const [loadingTip, setLoadingTip] = useState(false);
  const [loveCount, setLoveCount] = useState(0);
  const [pendingChallenges, setPendingChallenges] = useState(4);
  const [affirmation, setAffirmation] = useState('');

  const [weather, setWeather] = useState<WeatherState>({
    temp: 0,
    conditionCode: -1,
    loading: true,
    error: false,
    permissionDenied: false
  });

  const displayName = userState.name || "amig@";

  useEffect(() => {
    // Weather
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const data = await fetchWeatherData(position.coords.latitude, position.coords.longitude);
          if (data) {
            setWeather({ temp: data.temperature, conditionCode: data.weathercode, loading: false, error: false, permissionDenied: false });
          } else {
            setWeather(prev => ({ ...prev, loading: false, error: true }));
          }
        },
        () => setWeather(prev => ({ ...prev, loading: false, permissionDenied: true }))
      );
    }

    // Love messages count
    if (firebaseUser?.uid) {
      getLoveMessages(firebaseUser.uid).then(msgs => setLoveCount(msgs.length));

      // Check pending challenges from Firestore
      getStreakData(firebaseUser.uid).then(data => {
        const today = new Date().toISOString().split('T')[0];
        const todayCompleted = data.completedChallenges?.filter((c: any) => c.date === today).length || 0;
        setPendingChallenges(4 - todayCompleted);

        // Get affirmation based on streak and mood
        const lastMood = userState.dailyLogs?.[userState.dailyLogs.length - 1]?.mood;
        const aff = getDailyAffirmation({ currentStreak: data.currentStreak, currentMood: lastMood });
        setAffirmation(aff);
      });
    } else {
      // Default affirmation without context
      setAffirmation(getDailyAffirmation());
    }
  }, [firebaseUser]);

  const handleMoodSelect = async (mood: Mood) => {
    setCurrentMood(mood);
    logMood(mood);
    setLoadingTip(true);
    const newTip = await getDailyTip(mood);
    setTip(newTip);
    setLoadingTip(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const recommendation = !weather.loading && !weather.error && !weather.permissionDenied
    ? getWeatherRecommendation(weather.conditionCode, weather.temp)
    : null;

  return (
    <div className="p-5 pb-24 space-y-4">
      {/* Header with Cat Mascot */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <CatMascot mood={currentMood === 'Sad' || currentMood === 'Overwhelmed' ? 'sleeping' : 'happy'} size={56} showVideo />
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase">{getGreeting()}</p>
            <h1 className="text-xl font-extrabold text-slate-800">
              Hola, <span className="text-teal-600">{displayName}</span>
            </h1>
          </div>
        </div>
        <Link to="/profile" className="bg-slate-100/80 p-2.5 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
          <Settings size={20} />
        </Link>
      </header>

      {/* Pending Challenges Alert */}
      {pendingChallenges > 0 && (
        <Link to="/challenges" className="block bg-gradient-to-r from-orange-100 to-amber-100 p-4 rounded-2xl flex items-center justify-between border border-orange-200 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-orange-200/50 p-2 rounded-full">
              <Flame size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-orange-700 text-sm">{pendingChallenges} reto{pendingChallenges !== 1 ? 's' : ''} pendiente{pendingChallenges !== 1 ? 's' : ''}</p>
              <p className="text-xs text-orange-500">¡Completa tus retos y gana puntos!</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-orange-400" />
        </Link>
      )}

      {/* Love Messages Alert */}
      {loveCount > 0 && (
        <Link to="/love-wall" className="block bg-gradient-to-r from-rose-100 to-pink-100 p-4 rounded-2xl flex items-center justify-between border border-rose-200 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-rose-200/50 p-2 rounded-full">
              <Heart size={18} className="text-rose-500" fill="currentColor" />
            </div>
            <div>
              <p className="font-bold text-rose-700 text-sm">{loveCount} mensaje{loveCount !== 1 ? 's' : ''} de amor</p>
              <p className="text-xs text-rose-500">Toca para ver tu Muro de Amor</p>
            </div>
          </div>
          <Sparkles className="text-rose-400" size={18} />
        </Link>
      )}

      {/* Weather + Affirmation Card */}
      <section className="bg-white/60 p-5 rounded-2xl shadow-sm backdrop-blur-md border border-white/50">
        {recommendation && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
            <div className={`p-2.5 rounded-xl ${recommendation.bg}`}>
              {React.createElement(recommendation.icon, { size: 22, className: recommendation.color })}
            </div>
            <div>
              <span className={`text-2xl font-black ${recommendation.color}`}>{Math.round(weather.temp)}°</span>
              <span className="text-slate-500 text-sm ml-2">{recommendation.text}</span>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Quote size={20} className="text-teal-400 shrink-0 mt-0.5" />
          <p className="text-lg font-medium text-slate-700 leading-relaxed">
            {affirmation || "Un paso a la vez es suficiente."}
          </p>
        </div>
      </section>

      {/* Mood Selector */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-700">¿Cómo te sientes?</h2>
          {currentMood && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full uppercase">✓ Registrado</span>}
        </div>
        <div className="bg-white/50 p-4 rounded-2xl shadow-sm backdrop-blur-md border border-white/50">
          <MoodSelector selectedMood={currentMood} onSelect={handleMoodSelect} />
        </div>
      </section>

      {/* Weekly Progress */}
      <ProgressWidget compact />

      {/* Emotion Chart - Visual representation of mood history */}
      {/* Debug: Always render to see what's happening */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-700 px-1">Tu evolución emocional</h2>
        {/* Debug info */}
        <p className="text-xs text-slate-400 px-1">
          Debug: {userState.moodHistory?.length || 0} registros en moodHistory
        </p>
        {/* Test data for debugging - remove later */}
        <EmotionChart 
          moodHistory={
            userState.moodHistory?.length > 0 
              ? userState.moodHistory 
              : [
                  // Datos de prueba para ver el gráfico
                  { date: new Date().toISOString(), mood: Mood.Good },
                  { date: new Date(Date.now() - 86400000).toISOString(), mood: Mood.Great },
                  { date: new Date(Date.now() - 86400000 * 2).toISOString(), mood: Mood.Okay },
                  { date: new Date(Date.now() - 86400000 * 3).toISOString(), mood: Mood.Sad },
                  { date: new Date(Date.now() - 86400000 * 4).toISOString(), mood: Mood.Good },
                ]
          } 
          period="week" 
        />
      </section>

      {/* AI Tip */}
      {(currentMood || tip) && (
        <section className="bg-gradient-to-br from-indigo-500 to-violet-500 p-5 rounded-2xl shadow-lg text-white">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shrink-0">
              <Sparkles className="text-yellow-200" size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-100 text-xs uppercase tracking-wider mb-1">IA dice para ti</h3>
              <p className="text-sm font-medium leading-relaxed">
                {loadingTip ? "Pensando..." : tip}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;