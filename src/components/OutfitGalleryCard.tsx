import { ClothingItem, Outfit } from '@/lib/types';
import { getCategoryByType } from '@/lib/categories';

interface Props {
  outfit: Outfit & { liked?: boolean };
  items: ClothingItem[];
  pseudo?: string | null;
  onClick?: () => void;
  onToggleLike?: (next: boolean) => void;
  badgeLabel?: string;
  hideLike?: boolean;
  hideName?: boolean;
}

const dropShadow = 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))';

// Long outerwear types (190px); others are short jackets (150px)
const LONG_OUTERWEAR = new Set([
  'Manteau long',
  'Manteau court',
  'Parka',
  'Trench',
  'Doudoune',
  'Imperméable / Ciré',
  'Cape / Poncho',
]);

function isLongOuterwear(item: ClothingItem) {
  return LONG_OUTERWEAR.has(item.type);
}

// Image rendered to fit a fixed-size slot (object-contain, drop shadow)
function SlotImg({ item }: { item: ClothingItem }) {
  return (
    <img
      src={item.imageBase64}
      alt={item.type}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: dropShadow,
        display: 'block',
      }}
    />
  );
}

// Decide bucket based on category name
function bucketOf(item: ClothingItem): 'jewelry' | 'belt' | 'accessoryPlus' | 'jacket' | 'top' | 'bottom' | 'shoes' | 'bag' | 'dress' | 'pull' | 'other' {
  const cat = getCategoryByType(item.type)?.name || item.category || '';
  if (cat === 'Manteaux & vestes') return 'jacket';
  if (cat === 'Pulls & sweats') return 'pull';
  if (cat === 'Hauts') return 'top';
  if (cat === 'Bas' || cat === 'Jupes') return 'bottom';
  if (cat === 'Robes & combinaisons') return 'dress';
  if (cat === 'Chaussures') return 'shoes';
  if (cat === 'Sacs') return 'bag';
  if (cat === 'Accessoires') {
    if (item.type === 'Ceinture') return 'belt';
    if (item.type === 'Bijoux') return 'jewelry';
    return 'accessoryPlus';
  }
  return 'other';
}

function bucketize(items: ClothingItem[]) {
  const buckets = {
    jewelry: [] as ClothingItem[],
    belt: [] as ClothingItem[],
    accessoryPlus: [] as ClothingItem[],
    jacket: [] as ClothingItem[],
    pull: [] as ClothingItem[],
    top: [] as ClothingItem[],
    bottom: [] as ClothingItem[],
    dress: [] as ClothingItem[],
    shoes: [] as ClothingItem[],
    bag: [] as ClothingItem[],
    other: [] as ClothingItem[],
  };
  items.forEach(it => buckets[bucketOf(it)].push(it));
  return buckets;
}

export default function OutfitGalleryCard({ outfit, items, pseudo, onClick, onToggleLike, badgeLabel, hideLike, hideName }: Props) {
  const buckets = bucketize(items);
  const liked = !!outfit.liked;
  const displayName =
    outfit.name?.trim() ||
    new Date(outfit.createdAt).toLocaleDateString('fr-FR');

  // For the dress case (no separate top/bottom): treat dress as the "top" slot in centre
  const dressPiece = buckets.dress[0] || null;
  const topPiece = dressPiece || buckets.top[0] || null;
  const bottomPiece = dressPiece ? null : buckets.bottom[0] || null;
  const pullPiece = buckets.pull[0] || null;
  const jacketPiece = buckets.jacket[0] || null;
  const shoesPiece = buckets.shoes[0] || null;
  const bagPiece = buckets.bag[0] || null;
  const beltPiece = buckets.belt[0] || null;
  const jewelryPiece = buckets.jewelry[0] || null;
  const accessoryPlusPiece = buckets.accessoryPlus[0] || null;

  const isEmpty =
    !jacketPiece && !topPiece && !bottomPiece && !pullPiece &&
    !shoesPiece && !bagPiece && !beltPiece && !jewelryPiece && !accessoryPlusPiece;

  // Free layout pieces (drag & drop saved positions)
  const layout = outfit.layoutData;
  const hasFreeLayout = !!layout && Array.isArray(layout.pieces) && layout.pieces.length > 0;

  return (
    <div className="mb-4">
      <div
        onClick={onClick}
        className="relative w-full overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        style={{
          height: 480,
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          padding: 12,
        }}
      >
        {/* Like button */}
        {!hideLike && (
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
        )}

        {/* Layout */}
        <div className="w-full" style={{ paddingBottom: 48 }}>
          {hasFreeLayout ? (
            <div
              className="relative w-full mx-auto"
              style={{
                aspectRatio: `${layout!.canvasW} / ${layout!.canvasH}`,
                maxWidth: layout!.canvasW,
              }}
            >
              {layout!.pieces.map(p => {
                const it = items.find(i => i.id === p.itemId);
                if (!it) return null;
                return (
                  <img
                    key={p.itemId}
                    src={it.imageBase64}
                    alt={it.type}
                    style={{
                      position: 'absolute',
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: `${(p.size / layout!.canvasW) * 100}%`,
                      height: 'auto',
                      zIndex: p.z,
                      filter: dropShadow,
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>
          ) : isEmpty ? (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: 380 }}
            >
              Tenue vide
            </div>
          ) : (
            (() => {
              // Absolute percentage-based positions inside a 380px-tall stage
              type Slot = {
                key: string;
                item: ClothingItem;
                top: string;
                left: string;
                width: string;
                maxHeight: number;
                z: number;
              };
              const slots: Slot[] = [];

              if (jacketPiece) {
                const long = isLongOuterwear(jacketPiece);
                slots.push({
                  key: 'jacket',
                  item: jacketPiece,
                  top: '4%',
                  left: '2%',
                  width: long ? '38%' : '35%',
                  maxHeight: long ? 280 : 160,
                  z: 2,
                });
              }
              if (pullPiece) {
                slots.push({ key: 'pull', item: pullPiece, top: '4%', left: '62%', width: '36%', maxHeight: 160, z: 2 });
              }
              if (topPiece) {
                slots.push({
                  key: 'top',
                  item: topPiece,
                  top: '6%',
                  left: dressPiece ? '28%' : '30%',
                  width: dressPiece ? '44%' : '40%',
                  maxHeight: dressPiece ? 320 : 180,
                  z: 3,
                });
              }
              if (bottomPiece) {
                slots.push({ key: 'bottom', item: bottomPiece, top: '44%', left: '22%', width: '44%', maxHeight: 200, z: 3 });
              }
              if (shoesPiece) {
                slots.push({ key: 'shoes', item: shoesPiece, top: '78%', left: '20%', width: '42%', maxHeight: 110, z: 4 });
              }
              if (beltPiece) {
                slots.push({ key: 'belt', item: beltPiece, top: '40%', left: '4%', width: '28%', maxHeight: 70, z: 4 });
              }
              if (bagPiece) {
                slots.push({ key: 'bag', item: bagPiece, top: '50%', left: '70%', width: '28%', maxHeight: 130, z: 4 });
              }
              if (jewelryPiece) {
                slots.push({ key: 'jewelry', item: jewelryPiece, top: '78%', left: '72%', width: '24%', maxHeight: 70, z: 5 });
              }
              if (accessoryPlusPiece) {
                slots.push({ key: 'acc', item: accessoryPlusPiece, top: '88%', left: '72%', width: '24%', maxHeight: 70, z: 5 });
              }

              return (
                <div style={{ position: 'relative', width: '100%', height: 380 }}>
                  {slots.map(s => (
                    <div
                      key={s.key}
                      style={{
                        position: 'absolute',
                        top: s.top,
                        left: s.left,
                        width: s.width,
                        maxHeight: s.maxHeight,
                        zIndex: s.z,
                      }}
                    >
                      <img
                        src={s.item.imageBase64}
                        alt={s.item.type}
                        style={{
                          width: '100%',
                          maxHeight: s.maxHeight,
                          objectFit: 'contain',
                          filter: dropShadow,
                          display: 'block',
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            })()
          )}
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
            {badgeLabel || '✨ Créée par MyStyl'}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
            @{pseudo || 'moi'}
          </span>
        </div>
      </div>

      {/* Outfit name below card */}
      {!hideName && (
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
      )}
    </div>
  );
}
