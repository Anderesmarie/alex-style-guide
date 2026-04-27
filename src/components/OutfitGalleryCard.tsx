import { ClothingItem, Outfit } from '@/lib/types';
import { getCategoryByType } from '@/lib/categories';

interface Props {
  outfit: Outfit & { liked?: boolean };
  items: ClothingItem[];
  pseudo?: string | null;
  onClick?: () => void;
  onToggleLike?: (next: boolean) => void;
}

type Placement = {
  item: ClothingItem;
  size: number;
  style: React.CSSProperties;
  zIndex: number;
};

// Decide bucket based on category name
function bucketOf(item: ClothingItem): 'jewelry' | 'jacket' | 'top' | 'bottom' | 'shoes' | 'bag' | 'dress' | 'other' {
  const cat = getCategoryByType(item.type)?.name || item.category || '';
  if (cat === 'Manteaux & vestes') return 'jacket';
  if (cat === 'Pulls & sweats' || cat === 'Hauts') return 'top';
  if (cat === 'Bas' || cat === 'Jupes') return 'bottom';
  if (cat === 'Robes & combinaisons') return 'dress';
  if (cat === 'Chaussures') return 'shoes';
  if (cat === 'Sacs') return 'bag';
  if (cat === 'Accessoires') return 'jewelry';
  return 'other';
}

function buildPlacements(items: ClothingItem[]): Placement[] {
  const placements: Placement[] = [];
  const buckets = {
    jewelry: [] as ClothingItem[],
    jacket: [] as ClothingItem[],
    top: [] as ClothingItem[],
    bottom: [] as ClothingItem[],
    dress: [] as ClothingItem[],
    shoes: [] as ClothingItem[],
    bag: [] as ClothingItem[],
    other: [] as ClothingItem[],
  };
  items.forEach(it => buckets[bucketOf(it)].push(it));

  // Jewelry / accessories (small, top, dispersed left & right)
  buckets.jewelry.forEach((it, i) => {
    const left = i % 2 === 0;
    placements.push({
      item: it,
      size: 80,
      zIndex: 1,
      style: {
        position: 'absolute',
        top: `${10 + Math.floor(i / 2) * 70}px`,
        [left ? 'left' : 'right']: `${8 + Math.floor(i / 2) * 10}px`,
      },
    });
  });

  // Jacket (large, left, slight overlap top)
  buckets.jacket.forEach((it, i) => {
    placements.push({
      item: it,
      size: 200,
      zIndex: 2,
      style: { position: 'absolute', top: `${30 + i * 20}px`, left: '4%' },
    });
  });

  // Top (large, center / right)
  buckets.top.forEach((it, i) => {
    placements.push({
      item: it,
      size: 200,
      zIndex: 3,
      style: { position: 'absolute', top: `${60 + i * 20}px`, right: '8%' },
    });
  });

  // Dress (large, center) - treat like top+bottom combined
  buckets.dress.forEach((it, i) => {
    placements.push({
      item: it,
      size: 220,
      zIndex: 3,
      style: {
        position: 'absolute',
        top: `${60 + i * 20}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      },
    });
  });

  // Bottom (large, center, below top with slight overlap)
  buckets.bottom.forEach((it, i) => {
    placements.push({
      item: it,
      size: 200,
      zIndex: 4,
      style: {
        position: 'absolute',
        top: `${210 + i * 20}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      },
    });
  });

  // Shoes (medium, bottom-left)
  buckets.shoes.forEach((it, i) => {
    placements.push({
      item: it,
      size: 130,
      zIndex: 5,
      style: { position: 'absolute', bottom: `${10 + i * 20}px`, left: '6%' },
    });
  });

  // Bag (medium, bottom-right)
  buckets.bag.forEach((it, i) => {
    placements.push({
      item: it,
      size: 130,
      zIndex: 5,
      style: { position: 'absolute', bottom: `${10 + i * 20}px`, right: '6%' },
    });
  });

  // Other (dispersed)
  buckets.other.forEach((it, i) => {
    placements.push({
      item: it,
      size: 100,
      zIndex: 2,
      style: {
        position: 'absolute',
        top: `${120 + i * 50}px`,
        left: i % 2 === 0 ? '12%' : 'auto',
        right: i % 2 === 1 ? '12%' : 'auto',
      },
    });
  });

  return placements;
}

export default function OutfitGalleryCard({ outfit, items, pseudo, onClick, onToggleLike }: Props) {
  const placements = buildPlacements(items);
  const liked = !!outfit.liked;
  const displayName =
    outfit.name?.trim() ||
    new Date(outfit.createdAt).toLocaleDateString('fr-FR');

  return (
    <div className="mb-4">
      <div
        onClick={onClick}
        className="relative w-full overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        style={{
          minHeight: 450,
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          padding: 24,
        }}
      >
        {/* Like button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleLike?.(!liked);
          }}
          aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute z-20 active:scale-90 transition-transform"
          style={{
            top: 12,
            right: 12,
            fontSize: 22,
            lineHeight: 1,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 999,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          {liked ? '❤️' : '🤍'}
        </button>

        {/* Canvas with pieces */}
        <div className="relative w-full" style={{ height: 380 }}>
          {placements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Tenue vide
            </div>
          )}
          {placements.map((p, idx) => (
            <img
              key={`${p.item.id}-${idx}`}
              src={p.item.imageBase64}
              alt={p.item.type}
              style={{
                width: p.size,
                height: p.size,
                objectFit: 'contain',
                zIndex: p.zIndex,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))',
                ...p.style,
              }}
            />
          ))}
        </div>

        {/* Bottom band */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4"
          style={{
            background: 'rgba(255,255,255,0.85)',
            height: 40,
            backdropFilter: 'blur(4px)',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
            ✨ Créée par MyStyl
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
            @{pseudo || 'moi'}
          </span>
        </div>
      </div>

      {/* Outfit name below card */}
      <p
        className="text-center mt-2"
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 14,
          color: '#2C2C2C',
        }}
      >
        {displayName}
      </p>
    </div>
  );
}
