const STREAK_KEY = 'closify_streak';

export interface StreakData {
  current: number;
  longest: number;
  lastDate: string | null;
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, longest: 0, lastDate: null };
}

export function updateStreak(): StreakData {
  const today = new Date().toISOString().split('T')[0];
  const data = getStreak();

  if (data.lastDate === today) return data;

  const lastDate = data.lastDate ? new Date(data.lastDate) : null;
  const todayDate = new Date(today);
  const diffDays = lastDate
    ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const newStreak = diffDays === 1 ? data.current + 1 : 1;
  const updated: StreakData = {
    lastDate: today,
    current: newStreak,
    longest: Math.max(newStreak, data.longest),
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}
