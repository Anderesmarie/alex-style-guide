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
              // "Invisible mannequin" composition — centered, Pinterest flat-lay style.
              // Each piece is positioned by its CENTER (left = center X) using translateX(-50%).
              type Slot = {
                key: string;
                item: ClothingItem;
                left: string;
                top: string;
                width: string;
                maxHeight: number;
                z: number;
                rotate: number;
              };

              const mannequinShadow = 'drop-shadow(0 8px 12px rgba(0,0,0,0.14))';
              const slots: Slot[] = [];
              const hasOuter = !!jacketPiece;
              const hasTopOrPull = !!(topPiece || pullPiece);
              const hasBottom = !!bottomPiece;
              const isDress = !!dressPiece;

              // BOTTOM (behind) — centered
              if (bottomPiece) {
                slots.push({
                  key: 'bottom', item: bottomPiece,
                  left: '50%', top: '34%', width: '36%',
                  maxHeight: 230, z: 1, rotate: 0,
                });
              }

              // OUTERWEAR (manteau / veste)
              if (jacketPiece) {
                if (hasTopOrPull) {
                  slots.push({
                    key: 'jacket', item: jacketPiece,
                    left: '42%', top: '6%', width: '38%',
                    maxHeight: 220, z: 2, rotate: -3,
                  });
                } else {
                  slots.push({
                    key: 'jacket', item: jacketPiece,
                    left: '50%', top: '6%', width: '40%',
                    maxHeight: 220, z: 2, rotate: 0,
                  });
                }
              }

              // PULL (intermediate layer) — slightly offset if a top is also present
              if (pullPiece && !isDress) {
                slots.push({
                  key: 'pull', item: pullPiece,
                  left: hasOuter ? '54%' : '50%',
                  top: '8%', width: topPiece ? '30%' : '34%',
                  maxHeight: 160, z: 3, rotate: 0,
                });
              }

              // TOP / DRESS (front torso)
              if (isDress) {
                // Dress replaces top + bottom
                slots.push({
                  key: 'dress', item: dressPiece!,
                  left: '50%', top: '10%', width: '42%',
                  maxHeight: 320, z: 3, rotate: 0,
                });
              } else if (topPiece) {
                slots.push({
                  key: 'top', item: topPiece,
                  left: hasOuter ? '54%' : '50%',
                  top: '8%', width: hasOuter ? '32%' : '34%',
                  maxHeight: 160, z: 3, rotate: 0,
                });
              }

              // SHOES (front, bottom) — raise if no bottom present
              if (shoesPiece) {
                slots.push({
                  key: 'shoes', item: shoesPiece,
                  left: '50%',
                  top: hasBottom || isDress ? '70%' : '58%',
                  width: '34%', maxHeight: 120, z: 5, rotate: 0,
                });
              }

              // BAG (right side)
              if (bagPiece) {
                slots.push({
                  key: 'bag', item: bagPiece,
                  left: '76%', top: '42%', width: '22%',
                  maxHeight: 120, z: 4, rotate: 4,
                });
              }

              // BELT (left side, mid)
              if (beltPiece) {
                slots.push({
                  key: 'belt', item: beltPiece,
                  left: '25%', top: '48%', width: '20%',
                  maxHeight: 90, z: 4, rotate: -8,
                });
              }

              // ACCESSOIRES (jewelry + others) — left column, stacked vertically
              const accs: ClothingItem[] = [];
              if (jewelryPiece) accs.push(jewelryPiece);
              if (accessoryPlusPiece) accs.push(accessoryPlusPiece);
              accs.forEach((acc, i) => {
                slots.push({
                  key: `acc-${i}`, item: acc,
                  left: '25%',
                  top: `${12 + i * 10}%`,
                  width: '16%', maxHeight: 90, z: 4, rotate: -6,
                });
              });

              return (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 380,
                    overflow: 'hidden',
                  }}
                >
                  {slots.map(s => (
                    <img
                      key={s.key}
                      src={s.item.imageBase64}
                      alt={s.item.type}
                      style={{
                        position: 'absolute',
                        left: s.left,
                        top: s.top,
                        width: s.width,
                        maxWidth: '100%',
                        maxHeight: s.maxHeight,
                        objectFit: 'contain',
                        zIndex: s.z,
                        transform: `translateX(-50%) rotate(${s.rotate}deg)`,
                        filter: mannequinShadow,
                        display: 'block',
                        pointerEvents: 'none',
                      }}
                    />
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
