import { ClothingItem, Outfit } from '@/lib/types';

const COLOR_MAP: Record<string, string> = {
  'blanc': '#F5F5F5', 'noir': '#2C2C2C', 'gris': '#9E9E9E', 'beige': '#D4C5A9',
  'bleu': '#4A90D9', 'rouge': '#E53935', 'rose': '#EC407A', 'vert': '#66BB6A',
  'jaune': '#FDD835', 'marron': '#8D6E63', 'orange': '#FF9800', 'violet': '#AB47BC',
  'crème': '#FFFDD0', 'bordeaux': '#800020', 'kaki': '#BDB76B', 'corail': '#FF7F50',
};

interface Props {
  wardrobe: ClothingItem[];
  outfits: Outfit[];
  loading: boolean;
}

export default function WardrobeStats({ wardrobe, outfits, loading }: Props) {
  if (loading) return null;

  // --- Card 1: Never worn ---
  const usedIds = new Set(outfits.flatMap(o => o.itemIds));
  const neverWorn = wardrobe.filter(i => !usedIds.has(i.id));

  // --- Card 2: Dominant colors ---
  const colorCounts: Record<string, number> = {};
  wardrobe.forEach(i => {
    const c = i.color.toLowerCase();
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  });
  const topColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalItems = wardrobe.length || 1;

  // --- Card 3: Dominant styles ---
  const styleCounts: Record<string, number> = {};
  wardrobe.forEach(i => i.style?.forEach(s => { styleCounts[s] = (styleCounts[s] || 0) + 1; }));
  const topStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // --- Card 4: Cost per wear ---
  const wearCounts: Record<string, number> = {};
  outfits.forEach(o => o.itemIds.forEach(id => { wearCounts[id] = (wearCounts[id] || 0) + 1; }));
  const costPerWear = wardrobe
    .filter(i => i.price && i.price > 0 && wearCounts[i.id])
    .map(i => ({ ...i, cpw: i.price! / wearCounts[i.id] }))
    .sort((a, b) => a.cpw - b.cpw)
    .slice(0, 3);
  const hasPrices = wardrobe.some(i => i.price && i.price > 0);

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };

  return (
    <div>
      <p className="font-serif font-semibold text-lg mb-3" style={{ color: '#2C2C2C' }}>
        Mes stats 📊
      </p>
      <div className="space-y-3">
        {/* Card 1 — Never worn */}
        <div style={cardStyle}>
          <p className="font-semibold text-sm mb-2" style={{ color: '#2C2C2C' }}>👗 Jamais portées</p>
          {neverWorn.length === 0 ? (
            <p className="text-xs" style={{ color: '#9B9B9B' }}>Toutes tes pièces ont été portées ! 🎉</p>
          ) : (
            <>
              <p className="text-2xl font-bold" style={{ color: '#C9956C' }}>{neverWorn.length}</p>
              <p className="text-xs mb-2" style={{ color: '#9B9B9B' }}>pièces que tu n'as jamais portées</p>
              <div className="flex gap-2 mb-2">
                {neverWorn.slice(0, 3).map(i => (
                  <img
                    key={i.id}
                    src={i.imageBase64}
                    alt={i.type}
                    className="rounded-lg object-cover"
                    style={{ width: 40, height: 40 }}
                  />
                ))}
              </div>
              <p className="text-[11px]" style={{ color: '#C9956C' }}>
                Redécouvre-les dans tes prochaines suggestions ✨
              </p>
            </>
          )}
        </div>

        {/* Card 2 — Dominant colors */}
        <div style={cardStyle}>
          <p className="font-semibold text-sm mb-2" style={{ color: '#2C2C2C' }}>🎨 Tes couleurs</p>
          {topColors.length === 0 ? (
            <p className="text-xs" style={{ color: '#9B9B9B' }}>Ajoute des vêtements pour voir tes couleurs</p>
          ) : (
            <div className="space-y-1.5">
              {topColors.map(([color, count]) => {
                const pct = Math.round((count / totalItems) * 100);
                const bg = COLOR_MAP[color] || '#DDD';
                return (
                  <div key={color} className="flex items-center gap-2">
                    <div
                      className="rounded-full"
                      style={{ height: 8, width: `${Math.max(pct, 8)}%`, backgroundColor: bg, minWidth: 20 }}
                    />
                    <span className="text-xs capitalize whitespace-nowrap" style={{ color: '#2C2C2C' }}>
                      {color} {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 3 — Dominant styles */}
        <div style={cardStyle}>
          <p className="font-semibold text-sm mb-2" style={{ color: '#2C2C2C' }}>✨ Ton style dominant</p>
          {topStyles.length === 0 ? (
            <p className="text-xs" style={{ color: '#9B9B9B' }}>Ajoute des vêtements pour voir ton style</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                {topStyles.map(([style, count]) => (
                  <span
                    key={style}
                    className="text-xs font-medium rounded-full"
                    style={{ backgroundColor: '#F5F0EB', color: '#C9956C', padding: '4px 12px' }}
                  >
                    🎀 {style} ({count} pièces)
                  </span>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: '#C9956C' }}>
                Ton style dominant est {topStyles[0][0]} ✨
              </p>
            </>
          )}
        </div>

        {/* Card 4 — Cost per wear */}
        <div style={cardStyle}>
          <p className="font-semibold text-sm mb-2" style={{ color: '#2C2C2C' }}>💰 Meilleur rapport qualité/port</p>
          {!hasPrices ? (
            <p className="text-xs" style={{ color: '#9B9B9B' }}>
              Ajoute les prix de tes vêtements pour voir leur rentabilité 💡
            </p>
          ) : costPerWear.length === 0 ? (
            <p className="text-xs" style={{ color: '#9B9B9B' }}>
              Porte tes vêtements dans des tenues pour calculer le coût par port
            </p>
          ) : (
            <div className="space-y-2">
              {costPerWear.map(i => (
                <div key={i.id} className="flex items-center gap-2">
                  <img src={i.imageBase64} alt={i.type} className="rounded-lg object-cover" style={{ width: 40, height: 40 }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: '#2C2C2C' }}>{i.type}</p>
                    <p className="text-xs font-bold" style={{ color: '#4CAF50' }}>{i.cpw.toFixed(2)}€ par port</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
