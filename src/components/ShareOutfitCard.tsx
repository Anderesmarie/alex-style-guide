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

const CARD_W = FOND_W;
const CARD_H = FOND_H;

export default function ShareOutfitCard({ outfit, items, userName, onClose }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'preparing' | 'sharing' | 'done' | 'error'>('preparing');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Wait one frame so images start loading
      await new Promise(r => setTimeout(r, 100));
      const node = captureRef.current;
      if (!node) return;

      // Wait for all images inside to load
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
          backgroundColor: null,
          width: CARD_W,
          height: CARD_H,
          scale: 1,
        });
        const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
        if (!blob) throw new Error('Capture failed');

        const filename = `mystyl-${(outfit.name || 'tenue').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
        const file = new File([blob], filename, { type: 'image/png' });

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
    return () => { cancelled = true; };
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
            {status === 'sharing' && 'Création de l\'image…'}
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
        style={{
          position: 'fixed',
          left: -99999,
          top: 0,
          width: CARD_W,
          height: CARD_H,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <div
          ref={captureRef}
          style={{
            position: 'relative',
            width: CARD_W,
            height: CARD_H,
            overflow: 'hidden',
            backgroundColor: '#F5F0EB',
          }}
        >
          {/* Background */}
          <img
            src={SHARE_BACKGROUND_URL}
            crossOrigin="anonymous"
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {(() => {
            console.log('snapshot_url:', (outfit as any).snapshot_url, '| snapshotUrl:', outfit.snapshotUrl);
            return null;
          })()}

          {outfit.snapshotUrl ? (
            <img
              src={outfit.snapshotUrl}
              crossOrigin="anonymous"
              alt="Outfit Snapshot"
              style={{
                position: 'absolute',
                left: '5.2%',
                top: '18.9%',
                width: '91.1%',
                height: '73.7%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                left: '5.2%',
                top: '18.9%',
                width: '91.1%',
                height: '73.7%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 10%',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
                fontSize: 26,
                color: '#2C2C2C',
                opacity: 0.75,
                lineHeight: 1.4,
              }}
            >
              Modifie et re-sauvegarde ta tenue pour activer le partage
            </div>
          )}

          {/* Pseudo bottom-right */}
          <div
            style={{
              position: 'absolute',
              right: 36,
              bottom: 80,
              fontFamily: 'Inter, sans-serif',
              fontSize: 26,
              color: '#2C2C2C',
              opacity: 0.85,
            }}
          >
            @{userName || 'moi'}
          </div>
        </div>
      </div>
    </>
  );
}
