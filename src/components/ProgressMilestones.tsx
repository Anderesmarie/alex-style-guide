import { useState, useEffect } from 'react';
import { getWardrobe } from '@/lib/storage';

const MILESTONES = [
  { count: 8, label: 'Premières suggestions débloquées 👗' },
  { count: 15, label: 'Suggestions beauté optimisées 💄' },
  { count: 20, label: 'Alex commence à apprendre 🧠' },
  { count: 30, label: 'Style Queen 👑' },
];

const CELEBRATED_KEY = 'alex_milestones_celebrated';

function getCelebrated(): number[] {
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCelebrated(list: number[]) {
  localStorage.setItem(CELEBRATED_KEY, JSON.stringify(list));
}

export default function ProgressMilestones() {
  const [count, setCount] = useState(0);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getWardrobe().then(w => {
      setCount(w.length);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const celebrated = getCelebrated();
    const newMilestone = MILESTONES.find(m => count >= m.count && !celebrated.includes(m.count));
    if (newMilestone) {
      setCelebrating(newMilestone.label);
      saveCelebrated([...celebrated, newMilestone.count]);
      const timer = setTimeout(() => setCelebrating(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [count, loaded]);

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
      {/* Show achieved milestones as dots */}
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
