import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

interface InteractiveBreathingProps {
  onComplete?: () => void;
  duration?: 'short' | 'medium' | 'long'; // 3, 5, 10 minutes
}

const BREATHING_CONFIGS = {
  short: {
    cycles: 6,
    inhale: 4,
    hold: 4,
    exhale: 4,
    label: '3 minutos',
  },
  medium: {
    cycles: 10,
    inhale: 4,
    hold: 7,
    exhale: 4,
    label: '5 minutos',
  },
  long: {
    cycles: 20,
    inhale: 5,
    hold: 5,
    exhale: 5,
    label: '10 minutos',
  },
};

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'idle' | 'complete';

const InteractiveBreathing: React.FC<InteractiveBreathingProps> = ({
  onComplete,
  duration = 'medium',
}) => {
  const config = BREATHING_CONFIGS[duration];
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    if (currentCycle >= config.cycles) {
      setPhase('complete');
      setIsActive(false);
      onComplete?.();
      return;
    }

    const totalDuration = (config.inhale + config.hold + config.exhale) * 1000;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const percent = (elapsed / totalDuration) * 100;
      setProgress(percent);

      // Determine phase
      const inhaleEnd = config.inhale * 1000;
      const holdEnd = (config.inhale + config.hold) * 1000;

      if (elapsed <= inhaleEnd) {
        setPhase('inhale');
        setTimeLeft(Math.ceil((inhaleEnd - elapsed) / 1000));
      } else if (elapsed <= holdEnd) {
        setPhase('hold');
        setTimeLeft(Math.ceil((holdEnd - elapsed) / 1000));
      } else if (elapsed <= totalDuration) {
        setPhase('exhale');
        setTimeLeft(Math.ceil((totalDuration - elapsed) / 1000));
      } else {
        // Cycle complete
        clearInterval(interval);
        setCurrentCycle((prev) => prev + 1);
        elapsed = 0;
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, currentCycle, config, onComplete]);

  const handleStart = () => {
    if (currentCycle < config.cycles) {
      setIsActive(true);
      setPhase('idle');
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentCycle(0);
    setProgress(0);
    setPhase('idle');
    setTimeLeft(0);
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return 'from-emerald-400 to-teal-500';
      case 'hold':
        return 'from-blue-400 to-indigo-500';
      case 'exhale':
        return 'from-purple-400 to-rose-500';
      case 'complete':
        return 'from-emerald-400 to-green-500';
      default:
        return 'from-slate-400 to-slate-500';
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'inhale':
        return 'Inhala...';
      case 'hold':
        return 'Retén...';
      case 'exhale':
        return 'Exhala...';
      case 'complete':
        return '¡Completado!';
      default:
        return 'Listo para empezar';
    }
  };

  const totalSeconds = (config.inhale + config.hold + config.exhale) * config.cycles;
  const completedSeconds =
    (currentCycle * (config.inhale + config.hold + config.exhale)) +
    Math.round(progress / 100 * (config.inhale + config.hold + config.exhale));

  return (
    <div className="bg-white/60 p-8 rounded-2xl backdrop-blur-md border border-white/50 text-center space-y-6">
      {/* Main Visualization */}
      <div className="relative w-48 h-48 mx-auto">
        {/* Outer Ring - Background */}
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-200"
          />

          {/* Progress Ring */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeDasharray={`${(2 * Math.PI * 90 * progress) / 100} ${2 * Math.PI * 90}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 0.1s linear',
              transform: 'rotate(-90deg)',
              transformOrigin: '100px 100px',
            }}
          />

          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" className={`text-${getPhaseColor().split('-')[1]}-400`} />
              <stop offset="100%" stopColor="currentColor" className={`text-${getPhaseColor().split('-')[1]}-600`} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Wind size={40} className={`text-${getPhaseColor().split('-')[1]}-500 mb-2 animate-bounce`} />
          <p className={`text-3xl font-black bg-gradient-to-r ${getPhaseColor()} bg-clip-text text-transparent`}>
            {timeLeft}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2 uppercase">{getPhaseLabel()}</p>
        </div>
      </div>

      {/* Cycle Counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: config.cycles }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i < currentCycle
                  ? 'bg-emerald-500 scale-125'
                  : i === currentCycle && isActive
                  ? 'bg-teal-500 animate-pulse'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-600 font-semibold">
          Ciclo {Math.min(currentCycle + 1, config.cycles)} / {config.cycles}
        </p>
      </div>

      {/* Timing Info */}
      <div className="bg-slate-50 p-3 rounded-lg">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-slate-500 font-bold">Inhala</p>
            <p className="text-slate-700 font-black">{config.inhale}s</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold">Retén</p>
            <p className="text-slate-700 font-black">{config.hold}s</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold">Exhala</p>
            <p className="text-slate-700 font-black">{config.exhale}s</p>
          </div>
        </div>
      </div>

      {/* Time Progress */}
      <div className="space-y-1">
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${(completedSeconds / totalSeconds) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {Math.floor(completedSeconds / 60)}:{String(completedSeconds % 60).padStart(2, '0')} /{' '}
          {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isActive && phase !== 'complete' && (
          <button
            onClick={handleStart}
            disabled={currentCycle >= config.cycles}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all ${
              currentCycle >= config.cycles
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:shadow-lg active:scale-95'
            }`}
          >
            <Play size={18} />
            Comenzar
          </button>
        )}
        {isActive && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg active:scale-95 transition-all"
          >
            <Pause size={18} />
            Pausa
          </button>
        )}
        {(currentCycle > 0 || phase !== 'idle') && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 active:scale-95 transition-all"
          >
            <RotateCcw size={18} />
            Reiniciar
          </button>
        )}
      </div>

      {/* Duration Selector - at top if needed */}
      {phase === 'idle' && currentCycle === 0 && (
        <p className="text-xs text-slate-500 font-medium">Duración: {config.label}</p>
      )}
    </div>
  );
};

export default InteractiveBreathing;
