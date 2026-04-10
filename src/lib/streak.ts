import { supabase } from './supabase';

const STREAK_KEY = 'closify_streak';

export interface StreakData {
  current: number;
  longest: number;
  lastDate: string | null;
}

function getLocalStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, longest: 0, lastDate: null };
}

function saveLocalStreak(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export async function getStreak(): Promise<StreakData> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data } = await supabase
        .from('profiles')
        .select('streak_current, streak_longest, streak_last_date')
        .eq('id', userData.user.id)
        .single();
      if (data) {
        const streak: StreakData = {
          current: data.streak_current ?? 0,
          longest: data.streak_longest ?? 0,
          lastDate: data.streak_last_date ?? null,
        };
        saveLocalStreak(streak);
        return streak;
      }
    }
  } catch {}
  return getLocalStreak();
}

export async function updateStreak(): Promise<StreakData> {
  const today = new Date().toISOString().split('T')[0];
  const data = await getStreak();

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

  saveLocalStreak(updated);

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('profiles').update({
        streak_current: updated.current,
        streak_longest: updated.longest,
        streak_last_date: updated.lastDate,
      }).eq('id', userData.user.id);
    }
  } catch {}

  return updated;
}
