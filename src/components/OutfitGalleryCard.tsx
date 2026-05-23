import { ClothingItem, Outfit } from '@/lib/types';
import OutfitLayout from '@/components/OutfitLayout';

interface Props {
  outfit: Outfit & { liked?: boolean };
  items: ClothingItem[];
  pseudo?: string | null;
  onClick?: () => void;
  onToggleLike?: (next: boolean) => void;
  badgeLabel?: string;
  hideLike?: boolean;
  hideName?: boolean;
  onShare?: () => void;
}

export default function OutfitGalleryCard({
  outfit,
  items,
  pseudo,
  onClick,
  onToggleLike,
  badgeLabel,
  hideLike,
  hideName,
  onShare,
}: Props) {
  const liked = !!outfit.liked;
  const displayName =
    outfit.name?.trim() ||
    new Date(outfit.createdAt).toLocaleDateString('fr-FR');

  return (
    <div className="mb-4">
      <div
        onClick={onClick}
        className="relative w-full cursor-pointer active:scale-[0.99] transition-transform mx-auto overflow-hidden"
        style={{
          maxWidth: 360,
          aspectRatio: '360 / 500',
          backgroundImage: 'url("https://tseermbuwyrzcrulhxba.supabase.co/storage/v1/object/public/assets/ChatGPT%20Image%2023%20mai%202026%20final.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 16,
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
              top: 8,
              right: 8,
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

        {/* Share button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onShare?.();
          }}
          className="absolute z-20"
          style={{
            top: 8,
            left: 8,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(4px)',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 11,
            color: '#C4A882',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          @Partager
        </button>

        <OutfitLayout
          items={items}
          layoutData={outfit.layoutData ?? null}
          readOnly={true}
        />

        {/* Bottom band */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4"
          style={{
            background: 'rgba(255,255,255,0.85)',
            height: 36,
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
