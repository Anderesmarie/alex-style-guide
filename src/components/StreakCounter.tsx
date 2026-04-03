import { useState, useEffect } from 'react';
import { getStreak, StreakData } from '@/lib/streak';

export default function StreakCounter() {
  const [days, setDays] = useState(0);
  const [streakBroken, setStreakBroken] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data: StreakData = await getStreak();
      setDays(data.currentStreak);

      // Check if streak is broken (last action > 1 day ago)
      if (data.lastActionDate) {
        const last = new Date(data.lastActionDate);
        const today = new Date(new Date().toISOString().split('T')[0]);
        const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 1) setStreakBroken(true);
      } else {
        setStreakBroken(true);
      }
    };
    load();
  }, []);

  if (streakBroken && days === 0) {
    return (
      <span className="text-xs" style={{ color: '#9B9B9B' }}>
        🔥 0 — Reprends dès aujourd'hui ! 💪
      </span>
    );
  }

  const trophy = days >= 30 ? ' 🏆' : '';
  const label = `${days} jour${days > 1 ? 's' : ''}${trophy}`;

  return (
    <span className="text-sm font-medium" style={{ color: '#C9956C' }}>
      🔥 {label}
    </span>
  );
}
