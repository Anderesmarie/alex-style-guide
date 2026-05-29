import { useEffect, useState } from 'react';
import { ClothingItem, OutfitLayoutData, UserProfile } from '@/lib/types';
import { addOutfit, genId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { updateStreak } from '@/lib/streak';
import type { Season } from '@/lib/colorimetry';
import OutfitLayout from '@/components/OutfitLayout';
import OutfitTemplateEditor from '@/components/OutfitTemplateEditor';
import { SHARE_BACKGROUND_URL } from '@/lib/constants';

export interface OutfitResult {
  outfit: ClothingItem[];
  liked: boolean | null;
  layoutData?: OutfitLayoutData | null;
  savedOutfitId?: string | null;
}

interface Props {
  results: OutfitResult[];
  weatherCode: number | null;
  temperature: number | null;
  userSeason?: Season | null;
  userProfile?: UserProfile | null;
  pseudo?: string | null;
  wardrobe: ClothingItem[];
  onResultsChange?: (next: OutfitResult[]) => void;
}

const ROSE_GOLD = '#C9956C';

export default function OutfitDailyFeed({
  results,
  pseudo,
  wardrobe,
  onResultsChange,
}: Props) {
  
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [wornIdx, setWornIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const handleShare = async (idx: number) => {
    if (sharingIdx !== null) return;
    setSharingIdx(idx);
    try {
      const result = results[idx];
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
      const pieces = [...(result.layoutData?.pieces || [])].sort(
        (a, b) => (a.z ?? 0) - (b.z ?? 0)
      );

      for (const piece of pieces) {
        const item = result.outfit.find(i => i.id === piece.itemId);
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

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
      });

      const baseName = `tenue-${result.savedOutfitId || idx}`.replace(/[^\w.-]+/g, '_');
      const file = new File([blob], `${baseName}.png`, { type: 'image/png' });

      const navAny = navigator as any;
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        try {
          await navAny.share({ files: [file], title: 'Ma tenue' });
          return;
        } catch {
          // fall through
        }
      }

      // Fallback: upload to outfit-shares
      const path = `${baseName}-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('outfit-shares')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('outfit-shares').getPublicUrl(path);
      const shareUrl = pub.publicUrl;

      if (navigator.share) {
        try {
          await navigator.share({ url: shareUrl, title: 'Ma tenue' });
        } catch {}
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast("Lien copié ! ✨", {
          style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du partage");
    } finally {
      setSharingIdx(null);
    }
  };


  const today = new Date().toISOString().split('T')[0];

  // Detect already-worn outfit today
  useEffect(() => {
    const stored = localStorage.getItem('mystyl_worn_today');
    if (stored) {
      try {
        const { date, outfitId } = JSON.parse(stored);
        if (date === today) {
          const matchIdx = results.findIndex(r => r.savedOutfitId === outfitId);
          if (matchIdx >= 0) {
            setWornIdx(matchIdx);
            return;
          }
        }
      } catch {}
      localStorage.removeItem('mystyl_worn_today');
    }

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data } = await supabase
          .from('user_preferences')
          .select('item_ids')
          .eq('user_id', userData.user.id)
          .eq('reaction', 'portee')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .limit(1);
        if (data && data.length > 0) {
          const wornIds = data[0].item_ids as string[];
          const matchIdx = results.findIndex(
            r =>
              r.outfit.length === wornIds.length &&
              r.outfit.every(item => wornIds.includes(item.id))
          );
          if (matchIdx >= 0) setWornIdx(matchIdx);
        }
      } catch {}
    })();
  }, [today, results]);

  const handleWear = async (idx: number) => {
    const hour = new Date().getHours();
    if (wornIdx !== null && wornIdx !== idx && hour >= 12) {
      toast.error("Tu as déjà choisi ta tenue du jour 😊", {
        description: "Après midi, la tenue est définitivement enregistrée.",
      });
      return;
    }
    setWornIdx(idx);
    setSavedIdxs(prev => new Set(prev).add(idx));
    localStorage.setItem('mystyl_worn_today', JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      outfitId: results[idx].savedOutfitId,
    }));
    updateStreak();
    toast("Belle journée avec cette tenue ! 🌸", {
      style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
    });
  };

  const handleEditorSave = async (newItems: ClothingItem[], layoutData: OutfitLayoutData) => {
    if (editingIdx === null) return;
    try {
      const outfitId = genId();
      await addOutfit({
        id: outfitId,
        name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
        itemIds: newItems.map(i => i.id),
        createdAt: new Date().toISOString(),
        layoutData,
      });
      const next = [...results];
      next[editingIdx] = {
        ...next[editingIdx],
        outfit: newItems,
        layoutData,
        savedOutfitId: outfitId,
      };
      onResultsChange?.(next);
      toast("Tenue enregistrée ✨", {
        style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
      });
      setEditingIdx(null);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-2 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center mb-2">Tes tenues du jour</h2>

      <div className="space-y-4">
        {results.map((r, idx) => {
          const isWorn = wornIdx === idx;
          const isDisliked = r.liked === false;
          const isLocked = !!r.savedOutfitId;
          const isGreyedOut = wornIdx !== null && wornIdx !== idx;

          return (
            <div
              key={idx}
              className={isDisliked ? 'opacity-40 pointer-events-none' : ''}
              style={!isDisliked && isGreyedOut ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
            >
              <div className="relative">
                <OutfitLayout
                  items={r.outfit}
                  layoutData={r.layoutData ?? null}
                  readOnly
                  backgroundUrl={r.layoutData || r.savedOutfitId ? SHARE_BACKGROUND_URL : undefined}
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

              {!isDisliked && !isGreyedOut && (
                <div className="mt-3 space-y-2 max-w-[360px] mx-auto">
                  {isWorn && (
                    <button
                      onClick={() => handleShare(idx)}
                      disabled={sharingIdx === idx}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
                      style={{ backgroundColor: ROSE_GOLD }}
                    >
                      {sharingIdx === idx ? (
                        <span
                          className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                          aria-label="Chargement"
                        />
                      ) : (
                        <>📤 Partager</>
                      )}
                    </button>
                  )}

                  {!isWorn && isLocked && (
                    <button
                      onClick={() => handleWear(idx)}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
                      style={{ backgroundColor: ROSE_GOLD }}
                    >
                      ✨ Je la mets !
                    </button>
                  )}

                  {!isWorn && !isLocked && (
                    <button
                      onClick={() => setEditingIdx(idx)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                      style={{
                        border: `1.5px solid ${ROSE_GOLD}`,
                        color: ROSE_GOLD,
                        backgroundColor: 'transparent',
                      }}
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingIdx !== null && (
        <OutfitTemplateEditor
          items={results[editingIdx].outfit}
          initialLayout={results[editingIdx].layoutData ?? null}
          wardrobe={wardrobe}
          onCancel={() => setEditingIdx(null)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
