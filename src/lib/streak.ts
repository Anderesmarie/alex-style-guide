export interface StreakData {
  currentStreak: number;
  lastOpenDate: string;
  bestStreak: number;
}

const STREAK_KEY = 'mystyl_streak';

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { currentStreak: 0, lastOpenDate: '', bestStreak: 0 };
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

/** Updates streak on app open. Returns { streak, wasBroken } */
export function updateStreak(): { streak: StreakData; wasBroken: boolean } {
  const data = getStreak();
  const today = getToday();
  const yesterday = getYesterday();

  if (data.lastOpenDate === today) {
    return { streak: data, wasBroken: false };
  }

  let wasBroken = false;

  if (data.lastOpenDate === yesterday) {
    data.currentStreak += 1;
  } else if (data.lastOpenDate === '') {
    data.currentStreak = 1;
  } else {
    wasBroken = data.currentStreak > 1;
    data.currentStreak = 1;
  }

  data.lastOpenDate = today;
  if (data.currentStreak > data.bestStreak) {
    data.bestStreak = data.currentStreak;
  }

  saveStreak(data);
  return { streak: data, wasBroken };
}
