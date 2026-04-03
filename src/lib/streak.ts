import { supabase } from '@/lib/supabase';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActionDate: string;
}

export async function getStreak(): Promise<StreakData> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { currentStreak: 0, longestStreak: 0, lastActionDate: '' };

    const { data } = await supabase
      .from('streak')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!data) return { currentStreak: 0, longestStreak: 0, lastActionDate: '' };

    return {
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastActionDate: data.last_action_date,
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActionDate: '' };
  }
}

export async function updateStreak(): Promise<StreakData> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { currentStreak: 0, longestStreak: 0, lastActionDate: '' };

    const { data } = await supabase
      .from('streak')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!data) {
      await supabase.from('streak').insert({
        user_id: user.id,
        last_action_date: today,
        current_streak: 1,
        longest_streak: 1,
      });
      return { currentStreak: 1, longestStreak: 1, lastActionDate: today };
    }

    const lastDate = new Date(data.last_action_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return {
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastActionDate: data.last_action_date,
      };
    }

    if (diffDays === 1) {
      const newStreak = data.current_streak + 1;
      const newLongest = Math.max(newStreak, data.longest_streak);
      await supabase.from('streak').update({
        last_action_date: today,
        current_streak: newStreak,
        longest_streak: newLongest,
      }).eq('user_id', user.id);
      return { currentStreak: newStreak, longestStreak: newLongest, lastActionDate: today };
    }

    // Streak broken
    await supabase.from('streak').update({
      last_action_date: today,
      current_streak: 1,
    }).eq('user_id', user.id);
    return { currentStreak: 1, longestStreak: data.longest_streak, lastActionDate: today };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActionDate: '' };
  }
}
