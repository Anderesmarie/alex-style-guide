import { ClothingItem } from '@/lib/types';
import { addOutfit, genId, saveLastOutfit } from '@/lib/storage';
import { getStylingTips } from '@/lib/stylingTips';
import { getColorScore } from '@/lib/colorimetry';
import type { Season } from '@/lib/colorimetry';

interface OutfitResult {
  outfit: ClothingItem[];
  liked: boolean | null;
}

interface Props {
  results: OutfitResult[];
  weatherCode: number | null;
  temperature: number | null;
  userSeason?: Season | null;
}

const ROSE_GOLD = '#C9956C';

export default function OutfitResults({ results, weatherCode, temperature, userSeason }: Props) {
  const handleSave = (items: ClothingItem[]) => {
    const ids = items.map(i => i.id);
    saveLastOutfit(ids);
    addOutfit({
      id: genId(),
      name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
      itemIds: ids,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center">Tes tenues du jour</h2>
      <div className="grid grid-cols-3 gap-3">
        {results.map((r, idx) => {
          const isLiked = r.liked === true;
          const tips = getStylingTips(r.outfit, weatherCode, temperature);
          const normalizeColor = (color: string) =>
            color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").trim();

          let colorBadge: 'perfect' | 'avoid' | null = null;
          if (userSeason) {
            const scores = r.outfit.map(item => {
              const norm = normalizeColor(item.color);
              const score = getColorScore(norm, userSeason);
              console.log("Couleur item:", item.color, "→ normalisée:", norm, "→ score:", score, "→ saison:", userSeason);
              return score;
            });
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            if (avg >= 0.5) colorBadge = 'perfect';
            else if (avg <= -1) colorBadge = 'avoid';
          }
          return (
            <div
              key={idx}
              className={`bg-card rounded-xl overflow-hidden card-shadow transition-all ${
                !isLiked ? 'opacity-50 grayscale-[40%]' : ''
              }`}
              style={isLiked ? { border: `2px solid ${ROSE_GOLD}` } : { border: '2px solid transparent' }}
            >
              {/* Badge */}
              <div className="flex justify-center pt-2">
                {isLiked ? (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${ROSE_GOLD}22`, color: ROSE_GOLD }}
                  >
                    ♥
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    ✗
                  </span>
                )}
              </div>

              {/* Images */}
              <div className="p-2 space-y-1.5">
                {r.outfit.map(item => (
                  <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.imageBase64}
                      alt={item.type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Colorimetry badge */}
              {colorBadge === 'perfect' && (
                <div className="px-2 pb-1">
                  <span className="inline-block text-[9px] font-medium text-white rounded-xl py-0.5 px-1.5" style={{ backgroundColor: '#C9956C' }}>
                    ✨ Parfait pour ton teint
                  </span>
                </div>
              )}
              {colorBadge === 'avoid' && (
                <div className="px-2 pb-1">
                  <span className="inline-block text-[9px] font-medium rounded-xl py-0.5 px-1.5" style={{ backgroundColor: '#F0F0F0', color: '#888888' }}>
                    💡 Pas idéal
                  </span>
                </div>
              )}

              {/* Styling tips */}
              <div className="border-t border-border px-2 py-2" style={{ backgroundColor: '#F5F0EB' }}>
                <p className="text-[10px] leading-tight mb-1">
                  <span className="text-muted-foreground">✨ </span>
                  <span style={{ color: '#C9956C' }}>{tips.beauty}</span>
                </p>
                <p className="text-[10px] leading-tight mb-1">
                  <span className="text-muted-foreground">💇 </span>
                  <span style={{ color: '#C9956C' }}>{tips.hair}</span>
                </p>
                <p className="text-[10px] leading-tight">
                  <span className="text-muted-foreground">👜 </span>
                  <span style={{ color: '#C9956C' }}>{tips.accessories}</span>
                </p>
              </div>

              {/* Save button */}
              <div className="px-2 pb-2 pt-1">
                <button
                  onClick={() => handleSave(r.outfit)}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs active:scale-[0.98] transition-transform"
                >
                  💾
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
