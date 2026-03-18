import { useState, useEffect } from 'react';
import { updateStreak } from '@/lib/streak';

export default function StreakCounter() {
  const [days, setDays] = useState(0);
  const [brokenMsg, setBrokenMsg] = useState(false);

  useEffect(() => {
    const { streak, wasBroken } = updateStreak();
    setDays(streak.currentStreak);
    if (wasBroken) {
      setBrokenMsg(true);
      const timer = setTimeout(() => setBrokenMsg(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const emoji = days >= 30 ? '🔥✨' : '🔥';
  const label =
    days >= 30
      ? `${days} jours — Tu es une pro !`
      : days >= 7
        ? `${days} jours de suite !`
        : `${days} jour${days > 1 ? 's' : ''}`;

  return (
    <>
      <span className="text-sm font-medium" style={{ color: '#C9956C' }}>
        {emoji} {label}
      </span>
      {brokenMsg && (
        <div className="bg-card rounded-xl p-3 card-shadow mb-4 text-center animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Ton streak est remis à zéro — mais ton style reste parfait 😊 Reviens demain pour recommencer !
          </p>
        </div>
      )}
    </>
  );
}
