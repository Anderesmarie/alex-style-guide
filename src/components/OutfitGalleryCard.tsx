import { useState } from 'react';
import { ClothingItem, Outfit } from '@/lib/types';
import OutfitLayout from '@/components/OutfitLayout';
import { SHARE_BACKGROUND_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const [sharing, setSharing] = useState(false);
  const displayName =
    outfit.name?.trim() ||
    new Date(outfit.createdAt).toLocaleDateString('fr-FR');

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);
    try {
      const CANVAS_W = 360;
      const CANVAS_H = 500;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas non supporté');

      // Background
      const bg = await loadImage(SHARE_BACKGROUND_URL);
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      // Pieces sorted by z ascending
      const pieces = [...(outfit.layoutData?.pieces || [])].sort(
        (a, b) => (a.z ?? 0) - (b.z ?? 0)
      );

      for (const piece of pieces) {
        const item = items.find(i => i.id === piece.itemId);
        if (!item) continue;
        const src = item.imageUrl || item.imageBase64;
        if (!src) continue;
        try {
          const img = await loadImage(src);
          const w = ((piece.w ?? 0) / 100) * CANVAS_W;
          const h = ((piece.h ?? 0) / 100) * CANVAS_H;
          const x = (piece.x / 100) * CANVAS_W;
          const y = ((100 - piece.y - (piece.h ?? 0)) / 100) * CANVAS_H;
          ctx.drawImage(img, x, y, w, h);
        } catch (err) {
          console.warn('Image piece non chargée (CORS ?)', err);
        }
      }

      // Canvas to Blob
      let blob: Blob;
      try {
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
        });
      } catch (err) {
        console.error('Canvas tainted', err);
        throw err;
      }
      console.log('Blob size:', blob.size);

      const fileName = `${outfit.name?.trim() || 'tenue'}.png`.replace(/[^\w.-]+/g, '_');
      const file = new File([blob], fileName, { type: 'image/png' });

      // Try native share with file (mobile)
      const navAny = navigator as any;
      console.log('canShare files:', navAny.canShare?.({ files: [file] }));
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        try {
          await navAny.share({ files: [file], title: outfit.name || 'Ma tenue' });
          return;
        } catch {
          // user cancelled or failed — fall through to upload fallback
        }
      }

      // Fallback: upload to outfit-shares bucket
      const path = `${outfit.id}-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('outfit-shares')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('outfit-shares').getPublicUrl(path);
      const shareUrl = pub.publicUrl;

      if (navigator.share) {
        try {
          await navigator.share({ url: shareUrl, title: outfit.name || 'Ma tenue' });
        } catch {}
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast('Lien copié ! ✨', {
          style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du partage');
    } finally {
      setSharing(false);
    }
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

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={sharing}
          aria-label="Partager"
          className="absolute z-20 active:scale-90 transition-transform disabled:opacity-70"
          style={{
            top: 8,
            right: hideLike ? 8 : 52,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 999,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          {sharing ? (
            <span
              className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: ROSE_GOLD, borderTopColor: 'transparent' }}
            />
          ) : (
            '📤'
          )}
        </button>

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
    </div>
  );
}
