import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function GameTimer({ time, isActive, color }) {
  const [displayTime, setDisplayTime] = useState(time);

  useEffect(() => {
    setDisplayTime(time);
  }, [time]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = displayTime < 60;

  return (
    <div 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isActive 
          ? 'bg-[#d4af37]/20 border border-[#d4af37]' 
          : 'bg-[#241e1b] border border-[#4a3b32]'
      }`}
      data-testid={`timer-${color}`}
    >
      <Clock className={`w-5 h-5 ${isUrgent ? 'text-[#c92a2a]' : 'text-[#d4af37]'}`} />
      <span 
        className={`font-mono text-xl font-bold ${
          isUrgent ? 'timer-urgent' : 'text-[#e6dcc3]'
        }`}
      >
        {formatTime(displayTime)}
      </span>
    </div>
  );
}
