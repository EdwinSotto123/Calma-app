import React, { useMemo } from 'react';
import { Mood } from '../../types';
import { TrendingUp, Calendar } from 'lucide-react';

interface MoodEntry {
  date: string;
  mood: Mood;
}

interface EmotionChartProps {
  moodHistory: MoodEntry[];
  dailyLogs?: any[];
  period?: 'week' | 'month';
}

// Map moods to colors and values
const MOOD_CONFIG: Record<string, { color: string; label: string; value: number }> = {
  [Mood.Great]: { color: 'bg-emerald-500', label: 'Excelente', value: 5 },
  [Mood.Good]: { color: 'bg-teal-500', label: 'Bien', value: 4 },
  [Mood.Okay]: { color: 'bg-amber-500', label: 'Regular', value: 3 },
  [Mood.Sad]: { color: 'bg-rose-500', label: 'Triste', value: 2 },
  [Mood.Overwhelmed]: { color: 'bg-purple-500', label: 'Abrumad@', value: 1 },
  [Mood.Angry]: { color: 'bg-red-500', label: 'Enojad@', value: 2 },
};

const EmotionChart: React.FC<EmotionChartProps> = ({
  moodHistory,
  period = 'week',
}) => {
  // Debug logging
  console.log('[EmotionChart] moodHistory received:', moodHistory);
  console.log('[EmotionChart] moodHistory length:', moodHistory?.length);

  const chartData = useMemo(() => {
    if (!moodHistory || moodHistory.length === 0) {
      console.log('[EmotionChart] No mood history, returning empty');
      return [];
    }

    const now = new Date();
    const days = period === 'week' ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Find all moods for this day - compare only YYYY-MM-DD part
      const dayMoods = moodHistory.filter((entry) => {
        // Handle both full ISO dates and YYYY-MM-DD format
        const entryDate = entry.date.split('T')[0];
        console.log('[EmotionChart] Comparing:', entryDate, 'vs', dateStr);
        return entryDate === dateStr;
      });

      // Calculate average mood value for the day
      const avgValue =
        dayMoods.length > 0
          ? dayMoods.reduce((sum, entry) => {
              return sum + (MOOD_CONFIG[entry.mood]?.value || 3);
            }, 0) / dayMoods.length
          : null;

      const dayLabel = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric' });

      data.push({
        date: dateStr,
        label: dayLabel,
        value: avgValue,
        count: dayMoods.length,
      });
    }

    console.log('[EmotionChart] chartData generated:', data);
    return data;
  }, [moodHistory, period]);

  const maxValue = 5;
  const getHeightPercent = (value: number | null) => {
    if (value === null) return 0;
    return (value / maxValue) * 100;
  };

  const getMoodColor = (value: number | null) => {
    if (value === null) return 'bg-slate-200';
    if (value >= 4.5) return 'bg-emerald-500';
    if (value >= 3.5) return 'bg-teal-500';
    if (value >= 2.5) return 'bg-amber-500';
    if (value >= 1.5) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getTrend = () => {
    const recent = chartData.slice(-3).filter((d) => d.value !== null);
    const older = chartData.slice(-7, -3).filter((d) => d.value !== null);

    if (recent.length === 0 || older.length === 0) return null;

    const recentAvg = recent.reduce((sum, d) => sum + (d.value || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + (d.value || 0), 0) / older.length;

    const diff = recentAvg - olderAvg;
    const isImproving = diff > 0;

    return { diff: Math.abs(diff), isImproving };
  };

  const trend = getTrend();
  
  const dataWithValues = chartData.filter((d) => d.value !== null);
  const avgMood = dataWithValues.length > 0
    ? dataWithValues.reduce((sum, d) => sum + (d.value || 0), 0) / dataWithValues.length
    : 0;

  const getMoodLabel = (value: number) => {
    if (isNaN(value) || value === 0) return 'Sin datos';
    if (value >= 4.5) return 'Excelente 🌟';
    if (value >= 3.5) return 'Bien 😊';
    if (value >= 2.5) return 'Regular 😐';
    if (value >= 1.5) return 'Mal 😔';
    return 'Muy mal 😞';
  };

  // Show empty state if no mood history at all
  if (!moodHistory || moodHistory.length === 0) {
    console.log('[EmotionChart] Rendering empty state - no moodHistory');
    return (
      <div className="bg-white/60 p-6 rounded-2xl backdrop-blur-md border border-white/50">
        <div className="text-center py-4">
          <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin datos de emociones</p>
          <p className="text-slate-400 text-sm mb-4">Registra tus emociones para ver las tendencias</p>
        </div>
        {/* Preview of what the chart will look like */}
        <div className="opacity-40 pointer-events-none">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 text-center">Vista previa del gráfico</p>
          <div className="flex items-end justify-between gap-1 h-20">
            {[60, 80, 40, 100, 70, 50, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full max-w-[16px] rounded-t-md bg-gradient-to-t from-teal-400 to-emerald-400"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[7px] text-slate-400 mt-1">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('[EmotionChart] Rendering chart with', chartData.length, 'days');

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-4 rounded-xl border border-teal-200">
          <p className="text-slate-600 text-xs font-bold uppercase mb-1">Estado Promedio</p>
          <p className="text-xl font-black text-teal-700">{getMoodLabel(avgMood)}</p>
        </div>
        {trend && (
          <div className={`p-4 rounded-xl border ${
            trend.isImproving 
              ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-200' 
              : 'bg-gradient-to-br from-orange-100 to-rose-100 border-orange-200'
          }`}>
            <p className="text-slate-600 text-xs font-bold uppercase mb-1">Tendencia</p>
            <div className="flex items-center gap-2">
              <TrendingUp
                size={20}
                className={trend.isImproving ? 'text-emerald-600 rotate-0' : 'text-orange-600 rotate-180'}
              />
              <span className={`text-lg font-bold ${trend.isImproving ? 'text-emerald-700' : 'text-orange-700'}`}>
                {trend.isImproving ? '+' : '-'}{trend.diff.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white/60 p-4 rounded-2xl backdrop-blur-md border border-white/50">
        <div className="flex items-end justify-between gap-1 h-40">
          {chartData.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center group"
              title={`${day.label}: ${day.count} registro(s)`}
            >
              {/* Bar */}
              <div className="w-full h-full flex flex-col justify-end items-center">
                <div
                  className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-teal-300 cursor-pointer ${getMoodColor(day.value)}`}
                  style={{
                    height: day.value ? `${Math.max(getHeightPercent(day.value), 10)}%` : '4px',
                  }}
                />
              </div>

              {/* Label */}
              <span className="text-[8px] text-slate-500 font-bold mt-2 text-center truncate w-full">
                {day.label.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Escala de emociones</p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600">Excelente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span className="text-slate-600">Bien</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-slate-600">Regular</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-slate-600">Mal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              <span className="text-slate-600">Muy mal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionChart;
