import { useState, useEffect } from 'react';
import { getWardrobe } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const MILESTONES = [
  { count: 8, label: 'Premières suggestions débloquées 👗' },
  { count: 15, label: 'Suggestions beauté optimisées 💄' },
  { count: 20, label: 'Alex commence à apprendre 🧠' },
  { count: 30, label: 'Style Queen 👑' },
];

const CELEBRATED_KEY = 'mystyl_milestones_celebrated';

async function getCelebrated(): Promise<number[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data } = await supabase
        .from('profiles')
        .select('milestones_celebrated')
        .eq('id', userData.user.id)
        .single();
      if (data?.milestones_celebrated) {
        const list = data.milestones_celebrated as number[];
        localStorage.setItem(CELEBRATED_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch {}
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveCelebrated(list: number[]) {
  localStorage.setItem(CELEBRATED_KEY, JSON.stringify(list));
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('profiles').update({
        milestones_celebrated: list,
      }).eq('id', userData.user.id);
    }
  } catch {}
}

export default function ProgressMilestones() {
  const [count, setCount] = useState(0);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [celebrated, setCelebratedState] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([getWardrobe(), getCelebrated()]).then(([w, c]) => {
      setCount(w.length);
      setCelebratedState(c);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const newMilestone = MILESTONES.find(m => count >= m.count && !celebrated.includes(m.count));
    if (newMilestone) {
      setCelebrating(newMilestone.label);
      const updated = [...celebrated, newMilestone.count];
      setCelebratedState(updated);
      saveCelebrated(updated);
      const timer = setTimeout(() => setCelebrating(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [count, loaded, celebrated]);

  if (!loaded) return null;

  // All milestones done
  if (count >= 30) {
    return (
      <div className="bg-card rounded-xl p-4 card-shadow mb-4 text-center">
        <p className="font-serif font-bold text-lg" style={{ color: '#C9956C' }}>
          Style Queen 👑
        </p>
      </div>
    );
  }

  const nextMilestone = MILESTONES.find(m => count < m.count);
  if (!nextMilestone) return null;

  const prevCount = MILESTONES.filter(m => m.count <= count).pop()?.count || 0;
  const progress = ((count - prevCount) / (nextMilestone.count - prevCount)) * 100;

  return (
    <div className="bg-card rounded-xl p-4 card-shadow mb-4">
      {celebrating && (
        <div className="text-center mb-2 animate-scale-in">
          <p className="text-sm font-semibold" style={{ color: '#C9956C' }}>
            Nouveau palier débloqué ✨
          </p>
          <p className="text-xs text-muted-foreground">{celebrating}</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground">
          {count}/{nextMilestone.count} pièces — {nextMilestone.label}
        </p>
      </div>
      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: '#C9956C' }}
        />
      </div>
      <div className="flex gap-1 mt-1.5">
        {MILESTONES.map(m => (
          <div
            key={m.count}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: count >= m.count ? '#C9956C' : 'hsl(var(--secondary))' }}
            title={m.label}
          />
        ))}
      </div>
    </div>
  );
}
