import { useState, useRef, useCallback } from 'react';
import { ClothingItem, UserProfile } from '@/lib/types';
import { getStylingTips, StylingTips } from '@/lib/stylingTips';
import { getColorScore } from '@/lib/colorimetry';
import { getSilhouetteScore, getMorphologyScore } from '@/lib/recommendations';
import type { Season } from '@/lib/colorimetry';

interface OutfitCard {
  outfit: ClothingItem[];
  liked: boolean | null;
}

interface Props {
  outfits: ClothingItem[][];
  weatherCode: number | null;
  temperature: number | null;
  onComplete: (results: OutfitCard[]) => void;
  userSeason?: Season | null;
  userProfile?: UserProfile | null;
}

export default function OutfitSwiper({ outfits, weatherCode, temperature, onComplete, userSeason, userProfile }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState<OutfitCard[]>(
    outfits.map(o => ({ outfit: o, liked: null }))
  );
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const total = cards.length;
  const threshold = 80;

  const handleSwipe = useCallback((liked: boolean) => {
    const dir = liked ? 'right' : 'left';
    setExitDir(dir);

    setTimeout(() => {
      const updated = [...cards];
      updated[currentIndex] = { ...updated[currentIndex], liked };
      setCards(updated);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= total) {
        onComplete(updated);
      } else {
        setCurrentIndex(nextIndex);
      }
      setExitDir(null);
      setDragX(0);
    }, 300);
  }, [cards, currentIndex, total, onComplete]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX.current;
    setDragX(diff);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > threshold) {
      handleSwipe(dragX > 0);
    } else {
      setDragX(0);
    }
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX.current;
    setDragX(diff);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragX) > threshold) {
      handleSwipe(dragX > 0);
    } else {
      setDragX(0);
    }
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (Math.abs(dragX) > threshold) {
        handleSwipe(dragX > 0);
      } else {
        setDragX(0);
      }
    }
  };

  if (currentIndex >= total) return null;

  const currentOutfit = cards[currentIndex].outfit;
  const tips = getStylingTips(currentOutfit, weatherCode, temperature);

  // Smart badge calculation
  const normalizeColor = (color: string) =>
    color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").trim();

  let smartBadge: 'ideal' | 'color' | 'morpho' | null = null;

  const colorAvg = userSeason
    ? currentOutfit.map(item => getColorScore(normalizeColor(item.color), userSeason)).reduce((a, b) => a + b, 0) / currentOutfit.length
    : 0;

  const silhouetteAvg = userProfile
    ? currentOutfit.map(item => getSilhouetteScore(item, userProfile.taille, userProfile.corpulence)).reduce((a, b) => a + b, 0) / currentOutfit.length
    : 0;

  const morphoAvg = userProfile?.morphologie
    ? currentOutfit.map(item => getMorphologyScore(item, userProfile.morphologie)).reduce((a, b) => a + b, 0) / currentOutfit.length
    : 0;

  const totalScore = colorAvg + silhouetteAvg + morphoAvg;

  if (totalScore >= 3) smartBadge = 'ideal';
  else if (colorAvg >= 1 && totalScore < 3) smartBadge = 'color';
  else if (morphoAvg >= 2 && colorAvg < 1) smartBadge = 'morpho';

  const rotation = dragX * 0.08;
  const likeOpacity = Math.min(Math.max(dragX / threshold, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dragX / threshold, 0), 1);

  const exitTransform = exitDir === 'right'
    ? 'translateX(120%) rotate(15deg)'
    : exitDir === 'left'
    ? 'translateX(-120%) rotate(-15deg)'
    : `translateX(${dragX}px) rotate(${rotation}deg)`;

  const exitTransition = exitDir ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : isDragging ? 'none' : 'transform 0.3s ease-out';

  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-6 bg-primary'
                : i < currentIndex
                ? 'w-2 bg-primary/40'
                : 'w-2 bg-muted-foreground/20'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground font-medium">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {/* Card container */}
      <div className="relative flex items-center justify-center" style={{ minHeight: 380 }}>
        <div
          ref={cardRef}
          className="w-full bg-card rounded-2xl card-shadow overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: exitTransform,
            transition: exitTransition,
            opacity: exitDir ? 0.7 : 1,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Like / Nope overlays */}
          <div
            className="absolute top-6 left-6 z-10 border-4 border-green-500 rounded-xl px-4 py-2 font-bold text-green-500 text-2xl -rotate-12 pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            J'AIME ✓
          </div>
          <div
            className="absolute top-6 right-6 z-10 border-4 border-red-500 rounded-xl px-4 py-2 font-bold text-red-500 text-2xl rotate-12 pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            NOPE ✗
          </div>

          {/* Outfit images grid */}
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {currentOutfit.map(item => (
                <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img
                    src={item.imageBase64}
                    alt={item.type}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Type chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {currentOutfit.map(item => (
                <span key={item.id} className="chip text-xs py-1.5 px-3">
                  {item.type}
                </span>
              ))}
            </div>

            {/* Smart badge */}
            {smartBadge === 'ideal' && (
              <div className="px-5 pb-2">
                <span className="inline-block text-[11px] font-bold text-white rounded-xl py-1 px-2.5" style={{ background: 'linear-gradient(135deg, #C9956C, #E8C4A0)' }}>
                  ⭐ Tenue idéale pour toi
                </span>
              </div>
            )}
            {smartBadge === 'color' && (
              <div className="px-5 pb-2">
                <span className="inline-block text-[11px] font-medium text-white rounded-xl py-1 px-2.5" style={{ backgroundColor: '#C9956C' }}>
                  ✨ Parfait pour ton teint
                </span>
              </div>
            )}
            {smartBadge === 'morpho' && (
              <div className="px-5 pb-2">
                <span className="inline-block text-[11px] font-medium rounded-xl py-1 px-2.5" style={{ backgroundColor: '#F5F0EB', color: '#C9956C', border: '1px solid #C9956C' }}>
                  📏 Parfait pour ta morphologie
                </span>
              </div>
            )}

            {/* Styling tips */}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={() => handleSwipe(false)}
          className="w-16 h-16 rounded-full bg-card card-shadow flex items-center justify-center text-2xl active:scale-90 transition-transform border-2 border-destructive/20 hover:border-destructive/50"
        >
          ✗
        </button>
        <button
          onClick={() => handleSwipe(true)}
          className="w-16 h-16 rounded-full bg-card card-shadow flex items-center justify-center text-2xl active:scale-90 transition-transform border-2 border-primary/20 hover:border-primary/50"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
