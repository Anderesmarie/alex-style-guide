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
  width: number;
  height: number;
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

  // Layering order (z-index, low → high):
  // 1 jewelry/accessories (background, small)
  // 2 shoes (under bottom)
  // 3 bottom
  // 4 top (overlaps bottom slightly)
  // 5 jacket (overlaps top)
  // 6 bag (front, on the side)

  // Jewelry / petits accessoires (très petits, dispersés en haut)
  buckets.jewelry.forEach((it, i) => {
    const left = i % 2 === 0;
    placements.push({
      item: it,
      width: 60,
      height: 60,
      zIndex: 1,
      style: {
        position: 'absolute',
        top: `${8 + Math.floor(i / 2) * 60}px`,
        [left ? 'left' : 'right']: `${10 + Math.floor(i / 2) * 8}px`,
      },
    });
  });

  // Top (haut centré, 180px)
  buckets.top.forEach((it, i) => {
    placements.push({
      item: it,
      width: 180,
      height: 180,
      zIndex: 4,
      style: {
        position: 'absolute',
        top: `${40 + i * 16}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      },
    });
  });

  // Bottom (bas centré, 220px, chevauche le haut par le dessous)
  buckets.bottom.forEach((it, i) => {
    placements.push({
      item: it,
      width: 220,
      height: 220,
      zIndex: 3,
      style: {
        position: 'absolute',
        // top haut commence à ~40, fait 180 → fin à 220
        // on remonte le bas de ~40px pour overlap léger
        top: `${180 + i * 16}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      },
    });
  });

  // Dress (robe centrée, plus haute)
  buckets.dress.forEach((it, i) => {
    placements.push({
      item: it,
      width: 220,
      height: 320,
      zIndex: 3,
      style: {
        position: 'absolute',
        top: `${50 + i * 16}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      },
    });
  });

  // Jacket / Manteau (220px, à gauche, par-dessus le haut)
  buckets.jacket.forEach((it, i) => {
    placements.push({
      item: it,
      width: 220,
      height: 220,
      zIndex: 5,
      style: {
        position: 'absolute',
        top: `${30 + i * 16}px`,
        left: '2%',
      },
    });
  });

  // Shoes (110px, sous le bas, légèrement devant)
  buckets.shoes.forEach((it, i) => {
    placements.push({
      item: it,
      width: 110,
      height: 110,
      zIndex: 4, // devant le bas
      style: {
        position: 'absolute',
        bottom: `${4 + i * 12}px`,
        left: i === 0 ? '50%' : `${20 + i * 10}%`,
        transform: i === 0 ? 'translateX(-50%)' : 'none',
      },
    });
  });

  // Bag (110px, bottom-right, au premier plan)
  buckets.bag.forEach((it, i) => {
    placements.push({
      item: it,
      width: 110,
      height: 110,
      zIndex: 6,
      style: {
        position: 'absolute',
        bottom: `${20 + i * 14}px`,
        right: `${4 + i * 8}%`,
      },
    });
  });

  // Other (petits, dispersés)
  buckets.other.forEach((it, i) => {
    placements.push({
      item: it,
      width: 60,
      height: 60,
      zIndex: 2,
      style: {
        position: 'absolute',
        top: `${120 + i * 50}px`,
        left: i % 2 === 0 ? '8%' : 'auto',
        right: i % 2 === 1 ? '8%' : 'auto',
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
                width: p.width,
                height: p.height,
                objectFit: 'contain',
                zIndex: p.zIndex,
                filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.15))',
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
