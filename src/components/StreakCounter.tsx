import { useState, useEffect } from 'react';
import { getStreak } from '@/lib/streak';

export default function StreakCounter() {
  const [days, setDays] = useState(0);

  useEffect(() => {
    setDays(getStreak().current);
  }, []);

  if (days === 0) {
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
