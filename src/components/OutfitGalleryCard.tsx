import { ClothingItem, Outfit } from '@/lib/types';
import { getCategoryByType } from '@/lib/categories';

interface Props {
  outfit: Outfit & { liked?: boolean };
  items: ClothingItem[];
  pseudo?: string | null;
  onClick?: () => void;
  onToggleLike?: (next: boolean) => void;
}

const dropShadow = 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))';

function Piece({ item, height }: { item: ClothingItem; height: number }) {
  return (
    <img
      src={item.imageBase64}
      alt={item.type}
      style={{
        height,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        filter: dropShadow,
      }}
    />
  );
}

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

function bucketize(items: ClothingItem[]) {
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
  return buckets;
}

export default function OutfitGalleryCard({ outfit, items, pseudo, onClick, onToggleLike }: Props) {
  const buckets = bucketize(items);
  const liked = !!outfit.liked;
  const displayName =
    outfit.name?.trim() ||
    new Date(outfit.createdAt).toLocaleDateString('fr-FR');

  // Pulls go to LEFT zone per spec; tops bucket includes both pulls & tops, split them
  const isPull = (it: ClothingItem) =>
    (getCategoryByType(it.type)?.name || it.category) === 'Pulls & sweats';
  const pulls = buckets.top.filter(isPull);
  const tops = buckets.top.filter(it => !isPull(it));

  const leftPiece = buckets.jacket[0] || pulls[0] || null;
  const topPiece = tops[0] || null;
  const bottomPiece = buckets.bottom[0] || null;
  const dressPiece = buckets.dress[0] || null;
  const shoesPiece = buckets.shoes[0] || null;
  const bagPiece = buckets.bag[0] || null;
  const accessories = buckets.jewelry;
  const isEmpty =
    !leftPiece && !topPiece && !bottomPiece && !dressPiece &&
    !shoesPiece && !bagPiece && accessories.length === 0;

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

        {/* Fixed-zone layout */}
        <div className="w-full" style={{ paddingBottom: 48 }}>
          {isEmpty ? (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: 380 }}
            >
              Tenue vide
            </div>
          ) : (
            <>
              <div className="flex w-full" style={{ gap: 8 }}>
                {/* LEFT ZONE 30% */}
                <div
                  className="flex items-center justify-center"
                  style={{ width: '30%', minHeight: 320 }}
                >
                  {leftPiece && <Piece item={leftPiece} height={180} />}
                </div>

                {/* CENTER-RIGHT ZONE 70% */}
                <div
                  className="flex flex-col items-center"
                  style={{ width: '70%', gap: 4 }}
                >
                  {dressPiece ? (
                    <Piece item={dressPiece} height={260} />
                  ) : (
                    <>
                      {topPiece && <Piece item={topPiece} height={140} />}
                      {bottomPiece && <Piece item={bottomPiece} height={180} />}
                    </>
                  )}
                  {shoesPiece && <Piece item={shoesPiece} height={110} />}
                </div>
              </div>

              {/* BOTTOM ZONE: bag left, accessories right */}
              {(bagPiece || accessories.length > 0) && (
                <div
                  className="flex items-end justify-between w-full"
                  style={{ marginTop: 12 }}
                >
                  <div className="flex items-end">
                    {bagPiece && <Piece item={bagPiece} height={80} />}
                  </div>
                  <div className="flex items-end gap-2">
                    {accessories.map(a => (
                      <Piece key={a.id} item={a} height={50} />
                    ))}
                  </div>
                </div>
              )}
            </>
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
