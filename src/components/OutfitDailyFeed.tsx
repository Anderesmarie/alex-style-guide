import { useEffect, useState } from 'react';
import { ClothingItem, OutfitLayoutData, UserProfile } from '@/lib/types';
import { addOutfit, genId, saveLastOutfit } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { updateStreak } from '@/lib/streak';
import type { Season } from '@/lib/colorimetry';
import OutfitLayout, { mapItemsToLayout } from '@/components/OutfitLayout';
import { getCategoryByType } from '@/lib/categories';

type EditorCatKey = 'haut' | 'bas' | 'chaussures' | 'sac' | 'accessoire';

const EDITOR_CATS: { key: EditorCatKey; label: string; matches: string[] }[] = [
  { key: 'haut', label: 'Haut', matches: ['Hauts', 'Pulls & sweats', 'Manteaux & vestes', 'Robes & combinaisons'] },
  { key: 'bas', label: 'Bas', matches: ['Bas', 'Jupes'] },
  { key: 'chaussures', label: 'Chaussures', matches: ['Chaussures'] },
  { key: 'sac', label: 'Sac', matches: ['Sacs'] },
  { key: 'accessoire', label: 'Accessoire', matches: ['Accessoires'] },
];

function itemMatchesCat(catKey: EditorCatKey, item: ClothingItem): boolean {
  const cat = getCategoryByType(item.type)?.name || item.category || '';
  const target = EDITOR_CATS.find(c => c.key === catKey);
  return !!target && target.matches.includes(cat);
}

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
  onNavigateToOutfit?: (outfitId: string) => void;
}

const ROSE_GOLD = '#C9956C';

export default function OutfitDailyFeed({
  results,
  pseudo,
  wardrobe,
  onResultsChange,
  onNavigateToOutfit,
}: Props) {
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [wornIdx, setWornIdx] = useState<number | null>(null);
  const [dislikedIdxs, setDislikedIdxs] = useState<Set<number>>(new Set());

  // Editor state — selection only, no free placement
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editPieces, setEditPieces] = useState<ClothingItem[]>([]);
  const [pickerCat, setPickerCat] = useState<EditorCatKey | null>(null);

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
      // Save to outfits gallery WITHOUT layoutData (positions defined later in Tenues)
      const newId = genId();
      await addOutfit({
        id: newId,
        name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
        itemIds,
        createdAt: new Date().toISOString(),
        layoutData: null,
      });
      setWornIdx(idx);
      setSavedIdxs(prev => new Set(prev).add(idx));
      updateStreak();
      toast("Belle journée avec cette tenue ! 🌸", {
        style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
      });
      // Navigate to Tenues page on the new outfit detail
      onNavigateToOutfit?.(newId);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDislike = async (items: ClothingItem[], idx: number) => {
    setDislikedIdxs(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('user_preferences').insert({
          user_id: userData.user.id,
          item_ids: items.map(i => i.id),
          reaction: 'pas_fan',
          created_at: new Date().toISOString(),
        });
      }
    } catch {}
    toast("On note ✨ on te proposera autre chose", { duration: 2000 });
  };

  const openEditor = (idx: number) => {
    const r = results[idx];
    setEditPieces([...r.outfit]);
    setPickerCat(null);
    setEditingIdx(idx);
  };

  const closeEditor = () => {
    setEditingIdx(null);
    setEditPieces([]);
    setPickerCat(null);
  };

  const removePiece = (itemId: string) => {
    setEditPieces(prev => prev.filter(p => p.id !== itemId));
  };

  const addPieceFromItem = (item: ClothingItem) => {
    if (editPieces.some(p => p.id === item.id)) {
      setPickerCat(null);
      return;
    }
    setEditPieces(prev => [...prev, item]);
    setPickerCat(null);
  };

  const saveEditor = async () => {
    if (editingIdx === null || editPieces.length < 1) return;
    const next = [...results];
    next[editingIdx] = {
      ...next[editingIdx],
      outfit: [...editPieces],
      // Reset drag positions — template will recompute
      layoutData: null,
    };
    onResultsChange?.(next);
    toast("Tenue mise à jour ✨", {
      style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
    });
    closeEditor();
  };

  const filteredWardrobe = pickerCat ? wardrobe.filter(w => itemMatchesCat(pickerCat, w)) : [];

  return (
    <div className="space-y-2 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center mb-2">Tes tenues du jour</h2>

      {/* Vertical list of cards */}
      <div className="space-y-4">
        {results.map((r, idx) => {
          const isWorn = wornIdx === idx;
          const isDisliked = dislikedIdxs.has(idx);
          const layoutProps = mapItemsToLayout(r.outfit);

          return (
            <div key={idx} className={isDisliked ? 'opacity-50' : ''}>
              <div className="bg-card rounded-2xl card-shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="inline-block text-[11px] font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: '#F5F0EB', color: ROSE_GOLD }}
                  >
                    ✨ Générée par MyStyl
                  </span>
                </div>
                <OutfitLayout
                  key={r.outfit.map(i => i.id).join('-')}
                  {...layoutProps}
                />
              </div>

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

            {/* Pièces actuelles */}
            <div className="bg-card rounded-2xl card-shadow p-3 mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Pièces de la tenue ({editPieces.length})
              </p>
              {editPieces.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Ajoute des pièces ci-dessous ✨
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {editPieces.map(item => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={item.imageBase64}
                        alt={item.type}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removePiece(item.id)}
                        aria-label="Retirer"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 text-white text-xs font-bold flex items-center justify-center active:scale-90"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons d'ajout par catégorie */}
            <p className="text-xs font-semibold text-muted-foreground mb-2">Ajouter une pièce</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {EDITOR_CATS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setPickerCat(c.key)}
                  className="px-4 py-2 rounded-full text-xs font-medium active:scale-95 transition-transform"
                  style={{ border: `1px solid ${ROSE_GOLD}`, color: ROSE_GOLD, background: 'transparent' }}
                >
                  + {c.label}
                </button>
              ))}
            </div>

            {pickerCat && (
              <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setPickerCat(null)}>
                <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
                <div
                  className="relative w-full bg-card rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto animate-slide-in-bottom"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                  <h3 className="font-serif font-bold text-lg mb-3">
                    {EDITOR_CATS.find(c => c.key === pickerCat)?.label}
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
                disabled={editPieces.length < 1}
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
