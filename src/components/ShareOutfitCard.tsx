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

const CARD_W = 930;
const CARD_H = 1240;
const OUTFIT_W = 360;
const OUTFIT_H = 500;

// Zone cible sur le fond pour l'image tenue
const ZONE_TOP = 200;
const ZONE_LEFT = 115;
const ZONE_W = 700;
const ZONE_H = 750;

type Status = 'preparing' | 'rendering-outfit' | 'rendering-final' | 'sharing' | 'done' | 'error';

export default function ShareOutfitCard({ outfit, items, userName, onClose }: Props) {
  const outfitRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('preparing');
  const [outfitImageDataUrl, setOutfitImageDataUrl] = useState<string | null>(null);

  const byId = new Map(items.map(it => [it.id, it]));
  const pieces = outfit.layoutData?.pieces?.slice().sort((a, b) => a.z - b.z) ?? [];
  const orderedFallback = items;

  // ÉTAPE 1 — capture du div tenue (360×500) → dataURL
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await new Promise(r => setTimeout(r, 100));
      const node = outfitRef.current;
      if (!node) return;

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
        setStatus('rendering-outfit');
        const canvas = await html2canvas(node, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          width: OUTFIT_W,
          height: OUTFIT_H,
          scale: 2,
        });
        if (cancelled) return;
        setOutfitImageDataUrl(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error('Outfit capture error', e);
        if (!cancelled) setStatus('error');
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ÉTAPE 2 — une fois l'image tenue prête, capture du final
  useEffect(() => {
    if (!outfitImageDataUrl) return;
    let cancelled = false;
    const run = async () => {
      await new Promise(r => setTimeout(r, 100));
      const node = finalRef.current;
      if (!node) return;

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
        setStatus('rendering-final');
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

        setStatus('sharing');
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
        console.error('Final capture error', e);
        if (!cancelled) setStatus('error');
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitImageDataUrl]);

  return (
    <>
      {/* Overlay UI */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center"
        onClick={() => status !== 'sharing' && status !== 'rendering-final' && onClose()}
      >
        <div className="bg-white rounded-2xl px-6 py-5 flex flex-col items-center gap-3 mx-6">
          <div className="text-3xl">{status === 'error' ? '⚠️' : '✨'}</div>
          <p className="text-sm text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            {status === 'preparing' && 'Préparation de ta tenue…'}
            {status === 'rendering-outfit' && 'Mise en scène…'}
            {status === 'rendering-final' && 'Création de l\'image…'}
            {status === 'sharing' && 'Partage en cours…'}
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

      {/* Off-screen — ÉTAPE 1 : div tenue 360×500 (fond transparent) */}
      <div
        style={{
          position: 'fixed',
          left: -99999,
          top: 0,
          width: OUTFIT_W,
          height: OUTFIT_H,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <div
          ref={outfitRef}
          style={{
            position: 'relative',
            width: OUTFIT_W,
            height: OUTFIT_H,
            background: 'transparent',
            overflow: 'hidden',
          }}
        >
          {pieces.length > 0
            ? pieces.map((p) => {
                const item = byId.get(p.itemId);
                if (!item) return null;
                const wPct = p.w ?? 30;
                const hPct = p.h ?? wPct * (OUTFIT_W / OUTFIT_H);
                return (
                  <div
                    key={p.itemId}
                    style={{
                      position: 'absolute',
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                      zIndex: (p.z ?? 1) + 1,
                    }}
                  >
                    <img
                      src={item.imageUrl || item.imageBase64}
                      crossOrigin="anonymous"
                      alt={item.type}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))',
                      }}
                    />
                  </div>
                );
              })
            : orderedFallback.map((it, i) => (
                <div
                  key={it.id + i}
                  style={{
                    position: 'absolute',
                    left: '10%',
                    top: `${5 + i * 22}%`,
                    width: '80%',
                    height: '20%',
                    zIndex: i + 1,
                  }}
                >
                  <img
                    src={it.imageUrl || it.imageBase64}
                    crossOrigin="anonymous"
                    alt={it.type}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ))}
        </div>
      </div>

      {/* Off-screen — ÉTAPE 2 : carte finale 930×1240 */}
      {outfitImageDataUrl && (
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
            ref={finalRef}
            style={{
              position: 'relative',
              width: CARD_W,
              height: CARD_H,
              overflow: 'hidden',
              backgroundColor: '#F5F0EB',
            }}
          >
            {/* Fond MyStyl */}
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

            {/* Image tenue capturée */}
            <img
              src={outfitImageDataUrl}
              alt="tenue"
              style={{
                position: 'absolute',
                top: ZONE_TOP,
                left: ZONE_LEFT,
                width: ZONE_W,
                height: ZONE_H,
                objectFit: 'contain',
              }}
            />

            {/* Nom tenue */}
            <div
              style={{
                position: 'absolute',
                top: ZONE_TOP + ZONE_H + 20,
                left: 0,
                width: '100%',
                textAlign: 'center',
                fontFamily: '"Playfair Display", "Brush Script MT", cursive, serif',
                fontStyle: 'italic',
                fontSize: 44,
                color: '#8B6F5E',
                lineHeight: 1.1,
              }}
            >
              {outfit.name || 'Ma tenue'}
            </div>

            {/* @pseudo */}
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
      )}
    </>
  );
}
