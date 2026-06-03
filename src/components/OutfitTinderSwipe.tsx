import { useRef, useState } from 'react';
import { ClothingItem } from '@/lib/types';
import OutfitLayout from './OutfitLayout';

interface Props {
  outfits: ClothingItem[][];
  pseudo?: string | null;
  onComplete: (likes: boolean[]) => void;
  aiIndex?: number | null;
}

const ROSE_GOLD = '#C9956C';

export default function OutfitTinderSwipe({ outfits, pseudo, onComplete, aiIndex = null }: Props) {
  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState<boolean[]>([]);
  const [dragX, setDragX] = useState(0);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const dragging = useRef(false);

  const total = outfits.length;
  const threshold = 80;

  const decide = (liked: boolean) => {
    if (exitDir) return;
    setExitDir(liked ? 'right' : 'left');
    setTimeout(() => {
      const nextLikes = [...likes, liked];
      setLikes(nextLikes);
      const nextIdx = index + 1;
      setExitDir(null);
      setDragX(0);
      if (nextIdx >= total) {
        onComplete(nextLikes);
      } else {
        setIndex(nextIdx);
      }
    }, 280);
  };

  if (index >= total) return null;
  const current = outfits[index];

  const onStart = (x: number) => {
    startX.current = x;
    dragging.current = true;
  };
  const onMove = (x: number) => {
    if (!dragging.current) return;
    setDragX(x - startX.current);
  };
  const onEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (Math.abs(dragX) > threshold) decide(dragX > 0);
    else setDragX(0);
  };

  const rotation = dragX * 0.06;
  const likeOpacity = Math.min(Math.max(dragX / threshold, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dragX / threshold, 0), 1);
  const transform = exitDir === 'right'
    ? 'translateX(120%) rotate(15deg)'
    : exitDir === 'left'
      ? 'translateX(-120%) rotate(-15deg)'
      : `translateX(${dragX}px) rotate(${rotation}deg)`;
  const transition = exitDir
    ? 'transform 0.28s ease-out, opacity 0.28s ease-out'
    : dragging.current ? 'none' : 'transform 0.25s ease-out';

  return (
    <div className="space-y-4 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center">Choisis tes tenues du jour ✨</h2>

      {/* Progression */}
      <div className="flex items-center justify-center gap-2">
        {outfits.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-primary'
                : i < index ? 'w-2 bg-primary/40'
                : 'w-2 bg-muted-foreground/20'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground font-medium">
          {index + 1}/{total}
        </span>
      </div>

      {/* Carte */}
      <div className="relative flex items-center justify-center" style={{ minHeight: 500 }}>
        <div
          className="relative w-full max-w-[360px] mx-auto select-none cursor-grab active:cursor-grabbing"
          style={{ transform, transition, opacity: exitDir ? 0.7 : 1 }}
          onTouchStart={(e) => onStart(e.touches[0].clientX)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          onTouchEnd={onEnd}
          onMouseDown={(e) => onStart(e.clientX)}
          onMouseMove={(e) => dragging.current && onMove(e.clientX)}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
        >
          {/* Overlays */}
          <div
            className="absolute top-4 left-4 z-30 border-4 border-green-500 rounded-xl px-3 py-1 font-bold text-green-500 text-xl -rotate-12 pointer-events-none"
            style={{ opacity: likeOpacity }}
          >J'AIME ❤</div>
          <div
            className="absolute top-4 right-4 z-30 border-4 border-red-500 rounded-xl px-3 py-1 font-bold text-red-500 text-xl rotate-12 pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >NOPE ✗</div>

          <OutfitLayout items={current} readOnly />

          {/* Badge bas */}
          <div
            className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4"
            style={{
              background: 'rgba(255,255,255,0.85)',
              height: 36,
              backdropFilter: 'blur(4px)',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
              ✨ Générée par MyStyl
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
              @{pseudo || 'moi'}
            </span>
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={() => decide(false)}
          aria-label="Pas fan"
          className="w-16 h-16 rounded-full bg-card card-shadow flex items-center justify-center text-2xl active:scale-90 transition-transform border-2"
          style={{ borderColor: 'rgba(220,38,38,0.25)' }}
        >❌</button>
        <button
          onClick={() => decide(true)}
          aria-label="J'aime"
          className="w-16 h-16 rounded-full bg-card card-shadow flex items-center justify-center text-2xl active:scale-90 transition-transform border-2"
          style={{ borderColor: ROSE_GOLD + '55' }}
        >❤️</button>
      </div>
    </div>
  );
}
