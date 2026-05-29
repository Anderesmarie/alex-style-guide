import { useState } from 'react';
import { ClothingItem, Outfit } from '@/lib/types';
import OutfitLayout from '@/components/OutfitLayout';
import { SHARE_BACKGROUND_URL } from '@/lib/constants';


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

const ROSE_GOLD = '#C9956C';

export default function OutfitGalleryCard({
  outfit,
  items,
  pseudo,
  onClick,
  onToggleLike,
  badgeLabel,
  hideLike,
  hideName,
}: Props) {
  const liked = !!outfit.liked;
  const [capturing, setCapturing] = useState(false);
  const displayName =
    outfit.name?.trim() ||
    new Date(outfit.createdAt).toLocaleDateString('fr-FR');

  const handleCapture = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCapturing(true);
  };


  return (
    <div className="mb-4">
      <div
        onClick={onClick}
        className="relative w-full cursor-pointer active:scale-[0.99] transition-transform mx-auto"
        style={{ maxWidth: 360 }}
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





        <OutfitLayout
          items={items}
          layoutData={outfit.layoutData ?? null}
          readOnly={true}
          backgroundUrl={SHARE_BACKGROUND_URL}
        />

        {/* MyStyl banner */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4"
          style={{
            height: 36,
            maxWidth: 360,
            margin: '0 auto',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#000000' }}>
            ✨ Générée par MyStyl
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#000000' }}>
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

      {capturing && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
        >
          <div
            className="text-center mb-4 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              color: '#2C2C2C',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            📸 Fais une capture d'écran puis partage !
          </div>

          <div className="relative w-full" style={{ maxWidth: 360 }}>
            <OutfitLayout
              items={items}
              layoutData={outfit.layoutData ?? null}
              readOnly={true}
              backgroundUrl={SHARE_BACKGROUND_URL}
            />
            <div
              className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4"
              style={{
                height: 36,
                maxWidth: 360,
                margin: '0 auto',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#000000' }}>
                ✨ Générée par MyStyl
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#000000' }}>
                @{pseudo || 'moi'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCapturing(false)}
            className="mt-6 px-6 py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ backgroundColor: ROSE_GOLD }}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
