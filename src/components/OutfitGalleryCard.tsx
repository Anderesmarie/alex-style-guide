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
          minHeight: 450,
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          padding: 16,
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
              const jacketH = jacketPiece && isLongOuterwear(jacketPiece) ? 190 : 150;

              // Left column rows: jacket then belt; if no jacket, belt rises to top.
              const leftRows: { item: ClothingItem; h: number }[] = [];
              if (jacketPiece) leftRows.push({ item: jacketPiece, h: jacketH });
              if (beltPiece) leftRows.push({ item: beltPiece, h: 80 });

              // Right column: pull, bag, jewelry, accessoryPlus
              const rightRows: { item: ClothingItem; h: number }[] = [];
              if (pullPiece) rightRows.push({ item: pullPiece, h: 150 });
              if (bagPiece) rightRows.push({ item: bagPiece, h: 150 });
              if (jewelryPiece) rightRows.push({ item: jewelryPiece, h: 80 });
              if (accessoryPlusPiece) rightRows.push({ item: accessoryPlusPiece, h: 80 });

              const renderCol = (
                rows: { item: ClothingItem; h: number }[],
                width: string,
              ) => (
                <div style={{ width, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.map((r, i) => (
                    <div key={`${r.item.id}-${i}`} style={{ width: '100%', height: r.h }}>
                      <SlotImg item={r.item} />
                    </div>
                  ))}
                </div>
              );

              return (
                <div className="flex w-full items-start" style={{ gap: 8 }}>
                  {renderCol(leftRows, '30%')}
                  {/* Center col with chaussures centered (60% width inside the 40% col) */}
                  <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    {topPiece && (
                      <div style={{ width: '100%', height: dressPiece ? 320 : 150 }}>
                        <SlotImg item={topPiece} />
                      </div>
                    )}
                    {bottomPiece && (
                      <div style={{ width: '100%', height: 170 }}>
                        <SlotImg item={bottomPiece} />
                      </div>
                    )}
                    {shoesPiece && (
                      <div style={{ width: '60%', height: 120 }}>
                        <SlotImg item={shoesPiece} />
                      </div>
                    )}
                  </div>
                  {renderCol(rightRows, '30%')}
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
