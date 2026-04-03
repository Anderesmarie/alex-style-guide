import { useState, useMemo } from 'react';
import { ClothingItem, UserProfile, STYLE_OPTIONS } from '@/lib/types';
import { buildCustomOutfit } from '@/lib/recommendations';
import { addOutfit, genId, saveLastOutfit } from '@/lib/storage';
import { getStylingTips } from '@/lib/stylingTips';

const ROSE_GOLD = '#C9956C';

const ALL_OCCASIONS = [
  'Travail', 'Sortie', 'Sport', 'Événement', 'Mariage', 'Voyage', 'Plage', 'Quotidien'
];

interface Props {
  wardrobe: ClothingItem[];
  temperature: number | null;
  weatherCode: number | null;
  userProfile?: UserProfile | null;
}

export default function CustomOutfitCard({ wardrobe, temperature, weatherCode }: Props) {
  const [occasion, setOccasion] = useState('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [generatedOutfit, setGeneratedOutfit] = useState<ClothingItem[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const hasFilter = occasion || selectedItem || selectedStyle;

  const handleGenerate = () => {
    if (!hasFilter) return;
    setGenerating(true);

    // Pick a central piece: selected item, or random from wardrobe matching filters
    let central = selectedItem;
    if (!central) {
      let candidates = [...wardrobe];
      if (occasion) candidates = candidates.filter(i => i.occasion?.some(o => o === occasion));
      if (selectedStyle) candidates = candidates.filter(i => i.style?.some(s => s === selectedStyle));
      if (candidates.length === 0) candidates = wardrobe;
      central = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const outfit = buildCustomOutfit(
      wardrobe,
      central,
      occasion || 'Quotidien',
      selectedStyle || '',
      new Set<string>()
    );

    setGeneratedOutfit(outfit);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedOutfit) return;
    const ids = generatedOutfit.map(i => i.id);
    await saveLastOutfit(ids);
    await addOutfit({
      id: genId(),
      name: `Tenue perso du ${new Date().toLocaleDateString('fr-FR')}`,
      itemIds: ids,
      createdAt: new Date().toISOString(),
    });
  };

  const handleRetry = () => {
    setGeneratedOutfit(null);
  };

  const tips = generatedOutfit ? getStylingTips(generatedOutfit, weatherCode, temperature) : null;

  // Show result card
  if (generatedOutfit) {
    return (
      <div className="bg-card rounded-xl overflow-hidden card-shadow" style={{ border: `2px solid ${ROSE_GOLD}` }}>
        <div className="p-4">
          <p className="text-sm font-serif font-semibold text-center mb-3" style={{ color: ROSE_GOLD }}>
            Ta tenue personnalisée ✨
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {generatedOutfit.map(item => (
              <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {generatedOutfit.map(item => (
              <span key={item.id} className="chip text-xs py-1 px-2.5">{item.type}</span>
            ))}
          </div>

          {tips && (
            <div className="border-t border-border px-2 py-2 rounded-b-lg mb-3" style={{ backgroundColor: '#F5F0EB' }}>
              <p className="text-[10px] leading-tight mb-1">
                <span className="text-muted-foreground">✨ </span>
                <span style={{ color: ROSE_GOLD }}>{tips.beauty}</span>
              </p>
              <p className="text-[10px] leading-tight mb-1">
                <span className="text-muted-foreground">💇 </span>
                <span style={{ color: ROSE_GOLD }}>{tips.hair}</span>
              </p>
              <p className="text-[10px] leading-tight">
                <span className="text-muted-foreground">👜 </span>
                <span style={{ color: ROSE_GOLD }}>{tips.accessories}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm active:scale-[0.98] transition-transform"
            >
              Réessayer 🔄
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white active:scale-[0.98] transition-transform"
              style={{ backgroundColor: ROSE_GOLD }}
            >
              Sauvegarder 💾
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show filter card
  return (
    <div className="bg-card rounded-xl overflow-hidden card-shadow p-4 space-y-4">
      <div className="text-center">
        <p className="text-base font-serif font-semibold">Crée ta tenue du moment ✨</p>
        <p className="text-sm text-muted-foreground mt-1">Dis-nous ce que tu veux porter</p>
      </div>

      {/* Occasion dropdown */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Occasion</label>
        <select
          value={occasion}
          onChange={e => setOccasion(e.target.value)}
          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Pour quelle occasion ?</option>
          {ALL_OCCASIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Wardrobe item selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Autour de quelle pièce ?</label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {wardrobe.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
              className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all"
              style={{
                border: selectedItem?.id === item.id ? `2px solid ${ROSE_GOLD}` : '2px solid transparent',
                opacity: selectedItem && selectedItem.id !== item.id ? 0.5 : 1,
              }}
            >
              <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Style chips */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Quel style ?</label>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => setSelectedStyle(selectedStyle === s.label ? '' : s.label)}
              className="text-xs py-1 px-2.5 rounded-full transition-all"
              style={
                selectedStyle === s.label
                  ? { backgroundColor: ROSE_GOLD, color: 'white' }
                  : { backgroundColor: '#F5F0EB', color: '#666' }
              }
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!hasFilter || generating}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-40"
        style={{ backgroundColor: ROSE_GOLD }}
      >
        {generating ? 'Génération...' : 'Générer ma tenue 🎯'}
      </button>
    </div>
  );
}
