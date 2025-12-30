import React, { useEffect, useState } from 'react';
import { useApp } from '../App';
import { TrendingUp, Calendar, Flame, Star } from 'lucide-react';
import { getStreakData } from '../services/firebaseService';

const MOOD_COLORS: Record<string, string> = {
    'Great': 'bg-emerald-400',
    'Good': 'bg-teal-400',
    'Okay': 'bg-amber-400',
    'Sad': 'bg-blue-400',
    'Overwhelmed': 'bg-purple-400',
    'Angry': 'bg-rose-400',
};

const MOOD_EMOJIS: Record<string, string> = {
    'Great': '😄',
    'Good': '🙂',
    'Okay': '😐',
    'Sad': '😔',
    'Overwhelmed': '😫',
    'Angry': '😠',
};

interface ProgressWidgetProps {
    compact?: boolean;
}

const ProgressWidget: React.FC<ProgressWidgetProps> = ({ compact = false }) => {
    const { userState, firebaseUser } = useApp();
    const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, totalPoints: 0 });

    useEffect(() => {
        if (firebaseUser?.uid) {
            getStreakData(firebaseUser.uid).then(data => {
                setStreakInfo({ currentStreak: data.currentStreak, totalPoints: data.totalPoints });
            });
        }
    }, [firebaseUser]);

    // Get last 7 days of mood data
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const log = userState.dailyLogs.find(l => l.date === dateStr);
            days.push({
                date: dateStr,
                dayName: date.toLocaleDateString('es', { weekday: 'short' }).slice(0, 2),
                mood: log?.mood || null,
            });
        }
        return days;
    };

    const last7Days = getLast7Days();
    const moodCount = last7Days.filter(d => d.mood).length;

    if (compact) {
        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-teal-500" />
                        <span className="text-xs font-bold text-slate-600">Tu Semana</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-orange-500 font-bold flex items-center gap-1">
                            <Flame size={12} /> {streakInfo.currentStreak}
                        </span>
                        <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                            <Star size={12} /> {streakInfo.totalPoints}
                        </span>
                    </div>
                </div>
                <div className="flex gap-1 justify-between">
                    {last7Days.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${day.mood ? MOOD_COLORS[day.mood] : 'bg-slate-100'
                                    }`}
                            >
                                {day.mood ? MOOD_EMOJIS[day.mood] : '·'}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{day.dayName}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Week Mood Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-100 p-2 rounded-lg">
                            <Calendar size={18} className="text-teal-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Tu Semana</h3>
                            <p className="text-xs text-slate-500">{moodCount} días registrados</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 justify-between">
                    {last7Days.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <div
                                className={`w-full aspect-square max-w-12 rounded-xl flex items-center justify-center text-lg transition-all ${day.mood ? `${MOOD_COLORS[day.mood]} shadow-sm` : 'bg-slate-100 border-2 border-dashed border-slate-200'
                                    }`}
                            >
                                {day.mood ? MOOD_EMOJIS[day.mood] : '?'}
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{day.dayName}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-orange-100 to-rose-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                        <Flame size={18} className="text-orange-500" />
                        <span className="text-xs font-bold text-orange-700">Racha</span>
                    </div>
                    <p className="text-2xl font-black text-orange-600">{streakInfo.currentStreak} <span className="text-sm font-normal">días</span></p>
                </div>
                <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                        <Star size={18} className="text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">Puntos</span>
                    </div>
                    <p className="text-2xl font-black text-amber-600">{streakInfo.totalPoints}</p>
                </div>
            </div>
        </div>
    );
};

export default ProgressWidget;
