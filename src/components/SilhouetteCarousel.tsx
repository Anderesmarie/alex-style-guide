import { useRef, useState } from 'react';
import { SILHOUETTES } from '@/lib/types';

interface Props {
  value: string;
  onChange: (label: string) => void;
}

export default function SilhouetteCarousel({ value, onChange }: Props) {
  const initialIdx = Math.max(0, SILHOUETTES.findIndex(s => s.label === value));
  const [index, setIndex] = useState(initialIdx === -1 ? 0 : initialIdx);
  const touchStartX = useRef<number | null>(null);

  const goTo = (i: number) => {
    const next = (i + SILHOUETTES.length) % SILHOUETTES.length;
    setIndex(next);
    onChange(SILHOUETTES[next].label);
  };

  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  const current = SILHOUETTES[index];
  const selected = value === current.label;

  return (
    <div className="flex flex-col items-center select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          type="button"
          onClick={prev}
          aria-label="Précédent"
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-card card-shadow hover:scale-105 transition"
          style={{ color: '#C9956C' }}
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => onChange(current.label)}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card transition-all duration-200"
          style={{
            border: selected ? '2px solid #C9956C' : '2px solid transparent',
            backgroundColor: selected ? '#FAF5F0' : 'hsl(var(--card))',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            minWidth: 180,
          }}
        >
          <img src={current.image} alt={current.label} className="w-40 h-52 object-contain" />
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Suivant"
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-card card-shadow hover:scale-105 transition"
          style={{ color: '#C9956C' }}
        >
          →
        </button>
      </div>

      <p className="mt-4 text-xl font-serif font-semibold" style={{ color: '#2C2C2C' }}>
        {current.label}
      </p>

      <div className="flex gap-1.5 mt-3">
        {SILHOUETTES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => goTo(i)}
            aria-label={s.label}
            className="rounded-full transition-all"
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              backgroundColor: i === index ? '#C9956C' : '#E0D5C8',
            }}
          />
        ))}
      </div>
    </div>
  );
}
