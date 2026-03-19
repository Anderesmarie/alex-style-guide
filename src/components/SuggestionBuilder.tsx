import { useState } from 'react';
import { ClothingItem } from '@/lib/types';

const OCCASIONS = ['Cours', 'Soirée', 'Sport', 'Rendez-vous', 'Bureau', 'Occasion spéciale', 'Week-end'];
const STYLES = ['Casual', 'Chic', 'Boho', 'Sportswear', 'Élégant', 'Minimaliste'];

interface Props {
  wardrobe: ClothingItem[];
  onComplete: (occasion: string, style: string, centralPiece: ClothingItem) => void;
}

export default function SuggestionBuilder({ wardrobe, onComplete }: Props) {
  const [occasion, setOccasion] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

  const handlePieceSelect = (item: ClothingItem) => {
    if (!occasion || !style) return;
    // Save choice history
    try {
      const prev = JSON.parse(localStorage.getItem('mystyl_custom_choices') || '[]');
      prev.push({ occasion, style, pieceType: item.type, date: new Date().toISOString() });
      if (prev.length > 20) prev.shift();
      localStorage.setItem('mystyl_custom_choices', JSON.stringify(prev));
    } catch {}
    onComplete(occasion, style, item);
  };

  return (
    <div className="bg-card rounded-xl p-4 card-shadow fade-enter border border-primary/20 relative">
      <span className="absolute top-3 right-3 text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
        ✨ Mon choix
      </span>

      <p className="text-sm font-serif font-semibold mb-3">Crée ta propre suggestion</p>

      {/* Step 1 — Occasion */}
      <p className="text-xs text-muted-foreground mb-2">Pour quelle occasion ?</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {OCCASIONS.map(o => (
          <button key={o} onClick={() => { setOccasion(o); setStyle(null); }}
            className={`chip whitespace-nowrap text-xs py-1.5 px-3 flex-shrink-0 ${occasion === o ? 'chip-active' : ''}`}>
            {o}
          </button>
        ))}
      </div>

      {/* Step 2 — Style */}
      {occasion && (
        <div className="fade-enter">
          <p className="text-xs text-muted-foreground mb-2">Quel style ?</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`chip whitespace-nowrap text-xs py-1.5 px-3 flex-shrink-0 ${style === s ? 'chip-active' : ''}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Central piece */}
      {occasion && style && (
        <div className="fade-enter">
          <p className="text-xs text-muted-foreground mb-2">Autour de quelle pièce ?</p>
          {wardrobe.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Ton dressing est vide.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {wardrobe.map(item => (
                <button key={item.id} onClick={() => handlePieceSelect(item)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors active:scale-95">
                  <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
