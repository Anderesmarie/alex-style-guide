import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { ClothingItem, Outfit } from '@/lib/types';
import { SHARE_BACKGROUND_URL } from '@/lib/constants';

interface Props {
  outfit: Outfit;
  items: ClothingItem[];
  userName: string;
  onClose: () => void;
}

const FOND_W = 1064;
const FOND_H = 1478;

// Zone safe dans le fond MyStyl
const ZONE_LEFT = 139;
const ZONE_TOP = 280;
const ZONE_W = 785;
const ZONE_H = 1090;

export default function ShareOutfitCard({ outfit, items, userName, onClose }: Props) {
  const shareRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'preparing' | 'sharing' | 'done' | 'error'>('preparing');

  const layoutPieces = outfit.layoutData?.pieces ?? [];
  const itemById = new Map(items.map(i => [i.id, i]));

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await new Promise(r => setTimeout(r, 80));
      const node = shareRef.current;
      if (!node) return;

      // Wait for all images to load
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(res => {
                img.onload = () => res(null);
                img.onerror = () => res(null);
              })
        )
      );

      if (cancelled) return;

      try {
        setStatus('sharing');
        const canvas = await html2canvas(node, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          backgroundColor: null,
          width: FOND_W,
          height: FOND_H,
        });

        const blob: Blob | null = await new Promise(res =>
          canvas.toBlob(res, 'image/jpeg', 0.85)
        );
        if (!blob) throw new Error('Capture failed');

        const filename = `mystyl-${(outfit.name || 'tenue').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });

        const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        if (navAny.share && navAny.canShare && navAny.canShare({ files: [file] })) {
          try {
            await navAny.share({ files: [file], title: outfit.name || 'Ma tenue MyStyl' });
            setStatus('done');
            onClose();
            return;
          } catch {
            // fall through to download
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus('done');
        onClose();
      } catch (e) {
        console.error('Share capture error', e);
        setStatus('error');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center"
        onClick={() => status !== 'sharing' && onClose()}
      >
        <div className="bg-white rounded-2xl px-6 py-5 flex flex-col items-center gap-3 mx-6">
          <div className="text-3xl">{status === 'error' ? '⚠️' : '✨'}</div>
          <p className="text-sm text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            {status === 'preparing' && 'Préparation de ta tenue…'}
            {status === 'sharing' && "Création de l'image…"}
            {status === 'done' && 'Prête !'}
            {status === 'error' && 'Oups, échec du partage.'}
          </p>
          {status === 'error' && (
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-full bg-[#C9956C] text-white"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* Off-screen capture target */}
      <div
        ref={shareRef}
        style={{
          position: 'fixed',
          left: -99999,
          top: 0,
          width: FOND_W,
          height: FOND_H,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        {/* Fond MyStyl */}
        <img
          src={SHARE_BACKGROUND_URL}
          crossOrigin="anonymous"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: FOND_W,
            height: FOND_H,
            objectFit: 'cover',
          }}
        />

        {/* Zone safe — pieces positionnées via layoutData (% sur 360x500) */}
        <div
          style={{
            position: 'absolute',
            left: ZONE_LEFT,
            top: ZONE_TOP,
            width: ZONE_W,
            height: ZONE_H,
          }}
        >
          {layoutPieces
            .slice()
            .sort((a, b) => a.z - b.z)
            .map((piece, i) => {
              const item = itemById.get(piece.itemId);
              if (!item) return null;
              return (
                <img
                  key={piece.itemId + i}
                  src={item.imageUrl || item.imageBase64}
                  crossOrigin="anonymous"
                  alt={item.type}
                  style={{
                    position: 'absolute',
                    left: `${piece.x}%`,
                    top: `${piece.y}%`,
                    width: `${piece.w}%`,
                    height: `${piece.h}%`,
                    objectFit: 'contain',
                    zIndex: piece.z,
                    filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))',
                  }}
                />
              );
            })}
        </div>

        {/* @Pseudo bottom-right */}
        <div
          style={{
            position: 'absolute',
            right: 60,
            bottom: 90,
            fontFamily: 'Inter, sans-serif',
            fontSize: 32,
            color: '#2C2C2C',
            opacity: 0.85,
          }}
        >
          @{userName || 'moi'}
        </div>
      </div>
    </>
  );
}
