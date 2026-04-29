import { useEffect, useState } from 'react';
import { ClothingItem, OutfitLayoutData, UserProfile } from '@/lib/types';
import { addOutfit, genId, saveLastOutfit } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { updateStreak } from '@/lib/streak';
import type { Season } from '@/lib/colorimetry';
import OutfitGalleryCard from '@/components/OutfitGalleryCard';
import OutfitFreeCanvas, {
  CHIPS,
  ChipKey,
  chipMatchesItem,
  defaultPositionForCategory,
  CANVAS_W,
  CANVAS_H,
} from '@/components/OutfitFreeCanvas';
import { getCategoryByType } from '@/lib/categories';

interface OutfitResult {
  outfit: ClothingItem[];
  liked: boolean | null;
  layoutData?: OutfitLayoutData | null;
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

interface CanvasPiece {
  itemId: string;
  item: ClothingItem;
  x: number;
  y: number;
  size: number;
  z: number;
}

export default function OutfitDailyFeed({
  results,
  pseudo,
  wardrobe,
  onResultsChange,
}: Props) {
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [wornIdx, setWornIdx] = useState<number | null>(null);
  const [dislikedIdxs, setDislikedIdxs] = useState<Set<number>>(new Set());

  // Editor state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [freePieces, setFreePieces] = useState<CanvasPiece[]>([]);
  const [freeSelectedId, setFreeSelectedId] = useState<string | null>(null);
  const [freeChip, setFreeChip] = useState<ChipKey | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Detect already-worn outfit today
  useEffect(() => {
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

  const handleWear = async (items: ClothingItem[], idx: number) => {
    const hour = new Date().getHours();
    if (wornIdx !== null && wornIdx !== idx) {
      if (hour >= 12) {
        toast.error("Tu as déjà choisi ta tenue du jour 😊", {
          description: "Après midi, la tenue est définitivement enregistrée.",
        });
        return;
      }
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('reaction', 'portee')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        }
      } catch {}
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const itemIds = items.map(i => i.id);
      await saveLastOutfit(itemIds);
      await supabase.from('user_preferences').insert({
        user_id: userData.user.id,
        item_ids: itemIds,
        reaction: 'portee',
        created_at: new Date().toISOString(),
      });
      // Also save to outfits gallery with layoutData if present
      const r = results[idx];
      await addOutfit({
        id: genId(),
        name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
        itemIds,
        createdAt: new Date().toISOString(),
        layoutData: r.layoutData ?? null,
      });
      setWornIdx(idx);
      setSavedIdxs(prev => new Set(prev).add(idx));
      updateStreak();
      toast("Belle journée avec cette tenue ! 🌸", {
        style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
      });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDislike = (idx: number) => {
    setDislikedIdxs(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    toast("On note ✨ on te proposera autre chose", { duration: 2000 });
  };

  const openEditor = (idx: number) => {
    const r = results[idx];
    // Build pieces from existing layoutData or default positions
    const pieces: CanvasPiece[] = r.outfit.map((item, i) => {
      const existing = r.layoutData?.pieces.find(p => p.itemId === item.id);
      if (existing) {
        return { itemId: item.id, item, x: existing.x, y: existing.y, size: existing.size, z: existing.z };
      }
      const cat = getCategoryByType(item.type)?.name || item.category || '';
      const def = defaultPositionForCategory(cat);
      return { itemId: item.id, item, x: def.xPct, y: def.yPct, size: def.size, z: def.z + i };
    });
    setFreePieces(pieces);
    setFreeSelectedId(null);
    setEditingIdx(idx);
  };

  const closeEditor = () => {
    setEditingIdx(null);
    setFreePieces([]);
    setFreeSelectedId(null);
    setFreeChip(null);
  };

  const addPieceFromItem = (item: ClothingItem) => {
    if (freePieces.some(p => p.itemId === item.id)) {
      setFreeChip(null);
      return;
    }
    const cat = getCategoryByType(item.type)?.name || item.category || '';
    const def = defaultPositionForCategory(cat);
    setFreePieces(prev => [
      ...prev,
      { itemId: item.id, item, x: def.xPct, y: def.yPct, size: def.size, z: def.z + prev.length },
    ]);
    setFreeChip(null);
  };

  const resizeSelected = (delta: number) => {
    if (!freeSelectedId) return;
    setFreePieces(prev =>
      prev.map(p =>
        p.itemId === freeSelectedId
          ? { ...p, size: Math.max(40, Math.min(280, p.size + delta)) }
          : p
      )
    );
  };

  const removeSelected = () => {
    if (!freeSelectedId) return;
    setFreePieces(prev => prev.filter(p => p.itemId !== freeSelectedId));
    setFreeSelectedId(null);
  };

  const saveEditor = async () => {
    if (editingIdx === null || freePieces.length < 1) return;
    const layoutData: OutfitLayoutData = {
      canvasW: CANVAS_W,
      canvasH: CANVAS_H,
      pieces: freePieces.map(p => ({
        itemId: p.itemId,
        x: p.x,
        y: p.y,
        size: p.size,
        z: p.z,
      })),
    };
    const newOutfit = freePieces.map(p => p.item);
    const next = [...results];
    next[editingIdx] = {
      ...next[editingIdx],
      outfit: newOutfit,
      layoutData,
    };
    onResultsChange?.(next);
    toast("Tenue mise à jour ✨", {
      style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
    });
    closeEditor();
  };

  const filteredWardrobe = freeChip ? wardrobe.filter(w => chipMatchesItem(freeChip, w)) : [];

  return (
    <div className="space-y-2 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center mb-2">Tes tenues du jour</h2>

      {/* Vertical list of cards */}
      <div className="space-y-4">
        {results.map((r, idx) => {
          const isWorn = wornIdx === idx;
          const isDisliked = dislikedIdxs.has(idx);
          const fakeOutfit = {
            id: `daily-${idx}`,
            name: '',
            itemIds: r.outfit.map(i => i.id),
            createdAt: new Date().toISOString(),
            liked: false,
            layoutData: r.layoutData ?? null,
          };

          return (
            <div key={idx} className={isDisliked ? 'opacity-50' : ''}>
              <OutfitGalleryCard
                outfit={fakeOutfit}
                items={r.outfit}
                pseudo={pseudo}
                badgeLabel="✨ Générée par MyStyl"
                hideLike
                hideName
              />

              {/* Action buttons */}
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleWear(r.outfit, idx)}
                  disabled={isWorn}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-80"
                  style={{ backgroundColor: isWorn ? '#4CAF50' : ROSE_GOLD }}
                >
                  {isWorn ? 'Portée aujourd\'hui 🌸' : '✨ Je la mets !'}
                </button>

                <button
                  onClick={() => openEditor(idx)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                  style={{
                    border: `1.5px solid ${ROSE_GOLD}`,
                    color: ROSE_GOLD,
                    backgroundColor: 'transparent',
                  }}
                >
                  ✏️ Modifier
                </button>

                <button
                  onClick={() => handleDislike(idx)}
                  className="w-full py-1.5 text-xs text-muted-foreground active:opacity-70"
                >
                  👎 Pas fan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor modal */}
      {editingIdx !== null && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="p-4 pb-24 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={closeEditor} className="text-2xl" aria-label="Fermer">←</button>
              <h1 className="text-xl font-serif font-bold">Modifier la tenue ✨</h1>
            </div>

            <OutfitFreeCanvas
              pieces={freePieces}
              onChange={next =>
                setFreePieces(
                  next.map(n => ({
                    ...n,
                    item: freePieces.find(p => p.itemId === n.itemId)!.item,
                  }))
                )
              }
              selectedId={freeSelectedId}
              onSelectId={setFreeSelectedId}
            />

            {freeSelectedId && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => resizeSelected(-20)}
                  className="w-10 h-10 rounded-full bg-card card-shadow text-lg active:scale-90 transition-transform"
                >−</button>
                <button
                  onClick={() => resizeSelected(20)}
                  className="w-10 h-10 rounded-full bg-card card-shadow text-lg active:scale-90 transition-transform"
                >+</button>
                <button
                  onClick={removeSelected}
                  className="px-4 h-10 rounded-full bg-destructive/15 text-destructive text-sm font-semibold active:scale-95 transition-transform"
                >🗑️ Retirer</button>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-1">
              {CHIPS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setFreeChip(c.key)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium"
                  style={{ border: `1px solid ${ROSE_GOLD}`, color: ROSE_GOLD, background: 'transparent' }}
                >
                  + {c.label}
                </button>
              ))}
            </div>

            {freeChip && (
              <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setFreeChip(null)}>
                <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
                <div
                  className="relative w-full bg-card rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto animate-slide-in-bottom"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                  <h3 className="font-serif font-bold text-lg mb-3">
                    {CHIPS.find(c => c.key === freeChip)?.label}
                  </h3>
                  {filteredWardrobe.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Aucune pièce dans cette catégorie
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredWardrobe.map(item => (
                        <button
                          key={item.id}
                          onClick={() => addPieceFromItem(item)}
                          className="aspect-square rounded-lg overflow-hidden bg-white active:scale-[0.96] transition-transform"
                        >
                          <img src={item.imageBase64} alt={item.type} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={closeEditor}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Annuler
              </button>
              <button
                onClick={saveEditor}
                disabled={freePieces.length < 1}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                style={{ backgroundColor: ROSE_GOLD }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
