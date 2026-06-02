import { useState, useEffect } from 'react';
import { getThumb } from '@/lib/wardrobeImages';
import { ClothingItem, Outfit, UserProfile } from '@/lib/types';
import { getWardrobe, getOutfits, addOutfit, deleteOutfit, setOutfitLiked, genId, getProfile } from '@/lib/storage';
import { generateOutfits } from '@/lib/outfitEngine';
import { updateStreak } from '@/lib/streak';
import { getCategoryForType, getSubcategoryForType } from '@/lib/dressingTaxonomy';
import { supabase } from '@/integrations/supabase/client';
import type { Season } from '@/lib/colorimetry';
import CalendarView from '@/components/CalendarView';
import OutfitVisualLayout, { SlotKey, SlotMap, SLOT_CONFIG } from '@/components/OutfitVisualLayout';
import OutfitLayout from '@/components/OutfitLayout';
import OutfitGalleryCard from '@/components/OutfitGalleryCard';

import OutfitFreeCanvas, { CHIPS, ChipKey, chipMatchesItem, defaultPositionForCategory, CANVAS_W, CANVAS_H } from '@/components/OutfitFreeCanvas';
import { toast } from 'sonner';

const ROSE_GOLD = '#C9956C';

// Renvoie le nom de catégorie attendu par SLOT_CONFIG (compat anciens libellés)
function legacyCategoryName(it: ClothingItem): string {
  const cat = getCategoryForType(it.type);
  if (!cat) return it.category;
  if (cat.key === 'Hauts') {
    const sub = getSubcategoryForType(it.type);
    return sub?.subcategory.key === 'Pulls & Mailles' ? 'Pulls & sweats' : 'Hauts';
  }
  if (cat.key === 'Robes') return 'Robes & combinaisons';
  if (cat.key === 'Manteaux') return 'Manteaux & vestes';
  if (cat.key === 'Bas') {
    const sub = getSubcategoryForType(it.type);
    return sub?.subcategory.key === 'Jupes' ? 'Jupes' : 'Bas';
  }
  return cat.key;
}

type View = 'gallery' | 'createVisual' | 'createQuick' | 'createFree' | 'detail';
type Tab = 'outfits' | 'calendar';

export default function Outfits() {
  const [view, setView] = useState<View>('gallery');
  const [tab, setTab] = useState<Tab>('outfits');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [outfitName, setOutfitName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Outfit | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);




  

  // Visual layout state
  const [slots, setSlots] = useState<SlotMap>({});
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);

  // Mode choice bottom sheet
  const [modeSheetOpen, setModeSheetOpen] = useState(false);

  // Free-canvas state
  const [freePieces, setFreePieces] = useState<Array<{ itemId: string; item: ClothingItem; x: number; y: number; size: number; z: number }>>([]);
  const [freeSelectedId, setFreeSelectedId] = useState<string | null>(null);
  const [freeChip, setFreeChip] = useState<ChipKey | null>(null);

  const loadData = async () => {
    const [w, o] = await Promise.all([getWardrobe(), getOutfits()]);
    setWardrobe(w);
    setOutfits(o);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: prof } = await supabase.from('profiles').select('pseudo').eq('id', u.user.id).maybeSingle();
        if (prof?.pseudo) setPseudo(prof.pseudo);
      }
    })();
  }, []);

  const handleToggleLike = async (outfit: Outfit, next: boolean) => {
    setOutfits(prev => prev.map(o => o.id === outfit.id ? { ...o, liked: next } : o));
    try { await setOutfitLiked(outfit.id, next); } catch {}
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 5) next.add(id);
    setSelectedIds(next);
  };

  const handleSaveQuick = async () => {
    if (selectedIds.size < 2 || !outfitName.trim()) return;
    await addOutfit({
      id: genId(),
      name: outfitName.trim(),
      itemIds: Array.from(selectedIds),
      createdAt: new Date().toISOString(),
    });
    updateStreak();
    const o = await getOutfits();
    setOutfits(o);
    setSelectedIds(new Set());
    setOutfitName('');
    setView('gallery');
  };

  const filledSlots = (Object.values(slots).filter(Boolean) as ClothingItem[]);

  const handleSaveVisual = async () => {
    if (filledSlots.length < 2 || !outfitName.trim()) return;
    await addOutfit({
      id: genId(),
      name: outfitName.trim(),
      itemIds: filledSlots.map(i => i.id),
      createdAt: new Date().toISOString(),
    });
    updateStreak();
    const o = await getOutfits();
    setOutfits(o);
    setSlots({});
    setOutfitName('');
    setView('gallery');
  };

  const confirmDeleteOutfit = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteOutfit(deleteConfirm.id);
      const o = await getOutfits();
      setOutfits(o);
      setDeleteConfirm(null);
      setView('gallery');
    } catch (e) {
      console.error('Erreur lors de la suppression de la tenue:', e);
      alert('La suppression a échoué. Réessaie plus tard.');
    }
  };

  const handleGenerate = async () => {
    const recs = await generateRecommendations(wardrobe, null, 1);
    if (recs.length > 0) {
      setSelectedIds(new Set(recs[0].map(i => i.id)));
    }
  };

  const getItemsByIds = (ids: string[]): ClothingItem[] =>
    ids.map(id => wardrobe.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  // Build SlotMap from an outfit's itemIds for gallery preview
  const buildSlotsFromItems = (items: ClothingItem[]): SlotMap => {
    const result: SlotMap = {};
    const used = new Set<string>();
    // Try to assign items to slots based on their category
    (Object.keys(SLOT_CONFIG) as SlotKey[]).forEach(slotKey => {
      const cfg = SLOT_CONFIG[slotKey];
      const candidate = items.find(it => {
        if (used.has(it.id)) return false;
        const cat = legacyCategoryName(it);
        return cfg.categories.includes(cat);
      });
      if (candidate) {
        result[slotKey] = candidate;
        used.add(candidate.id);
      }
    });
    return result;
  };

  const openPicker = (slot: SlotKey) => setPickerSlot(slot);

  const assignToSlot = (item: ClothingItem) => {
    if (!pickerSlot) return;
    setSlots(prev => ({ ...prev, [pickerSlot]: item }));
    setPickerSlot(null);
  };

  const filteredWardrobeForPicker = (): ClothingItem[] => {
    if (!pickerSlot) return [];
    const cfg = SLOT_CONFIG[pickerSlot];
    return wardrobe.filter(it => {
      const cat = legacyCategoryName(it);
      return cfg.categories.includes(cat);
    });
  };

  // Delete confirmation dialog
  const renderDeleteDialog = () => {
    if (!deleteConfirm) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        <div
          className="relative bg-card rounded-2xl p-6 w-full max-w-sm card-shadow animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="font-serif font-bold text-lg mb-1">Supprimer cette tenue ?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Les vêtements qui la composent resteront dans ton dressing
          </p>

          <button
            onClick={confirmDeleteOutfit}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-destructive/15 text-destructive active:scale-[0.98] transition-transform mb-2"
          >
            Supprimer la tenue
          </button>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground active:scale-[0.98] transition-transform"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  };

  // Bottom sheet picker (filtered wardrobe)
  const renderPicker = () => {
    if (!pickerSlot) return null;
    const items = filteredWardrobeForPicker();
    const cfg = SLOT_CONFIG[pickerSlot];
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={() => setPickerSlot(null)}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        <div
          className="relative w-full bg-card rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto animate-slide-in-bottom"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
          <h3 className="font-serif font-bold text-lg mb-3">
            {cfg.icon} Choisir : {cfg.label}
          </h3>
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucune pièce dans cette catégorie
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => assignToSlot(item)}
                  className="aspect-square rounded-lg overflow-hidden active:scale-[0.96] transition-transform"
                >
                  <img src={getThumb(item.imageBase64, 400)} alt={item.type} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fade-enter pb-4">
        <div className="h-8 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="h-12 w-full rounded-xl bg-muted animate-pulse mb-5" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Free canvas creation
  if (view === 'createFree') {
    const canSave = freePieces.length >= 2 && outfitName.trim().length > 0;
    const filteredWardrobe = freeChip ? wardrobe.filter(w => chipMatchesItem(freeChip, w)) : [];

    const addPieceFromItem = (item: ClothingItem) => {
      if (freePieces.some(p => p.itemId === item.id)) {
        setFreeChip(null);
        return;
      }
      const cat = legacyCategoryName(item);
      const def = defaultPositionForCategory(cat);
      setFreePieces(prev => [...prev, {
        itemId: item.id,
        item,
        x: def.xPct,
        y: def.yPct,
        size: def.size,
        z: def.z,
      }]);
      setFreeChip(null);
    };

    const removeSelected = () => {
      if (!freeSelectedId) return;
      setFreePieces(prev => prev.filter(p => p.itemId !== freeSelectedId));
      setFreeSelectedId(null);
    };

    const resizeSelected = (delta: number) => {
      if (!freeSelectedId) return;
      setFreePieces(prev => prev.map(p => p.itemId === freeSelectedId
        ? { ...p, size: Math.max(40, Math.min(280, p.size + delta)) }
        : p));
    };

    const handleSaveFree = async () => {
      if (!canSave) return;
      await addOutfit({
        id: genId(),
        name: outfitName.trim(),
        itemIds: freePieces.map(p => p.itemId),
        createdAt: new Date().toISOString(),
        layoutData: {
          canvasW: CANVAS_W,
          canvasH: CANVAS_H,
          pieces: freePieces.map(p => ({
            itemId: p.itemId, x: p.x, y: p.y, size: p.size, z: p.z,
          })),
        },
      });
      updateStreak();
      const o = await getOutfits();
      setOutfits(o);
      setFreePieces([]);
      setFreeSelectedId(null);
      setOutfitName('');
      setView('gallery');
    };

    return (
      <div className="fade-enter pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setFreePieces([]); setFreeSelectedId(null); setView('gallery'); setModeSheetOpen(true); }} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">Disposition libre ✨</h1>
        </div>

        <OutfitFreeCanvas
          pieces={freePieces}
          onChange={(next) => setFreePieces(next.map(n => ({
            ...n,
            item: freePieces.find(p => p.itemId === n.itemId)!.item,
          })))}
          selectedId={freeSelectedId}
          onSelectId={setFreeSelectedId}
        />

        {/* Selection actions */}
        {freeSelectedId && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => resizeSelected(-20)}
              className="w-10 h-10 rounded-full bg-card card-shadow text-lg active:scale-90 transition-transform"
              aria-label="Réduire"
            >−</button>
            <button
              onClick={() => resizeSelected(20)}
              className="w-10 h-10 rounded-full bg-card card-shadow text-lg active:scale-90 transition-transform"
              aria-label="Agrandir"
            >+</button>
            <button
              onClick={removeSelected}
              className="px-4 h-10 rounded-full bg-destructive/15 text-destructive text-sm font-semibold active:scale-95 transition-transform"
            >🗑️ Retirer</button>
          </div>
        )}

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-1">
          {CHIPS.map(c => (
            <button
              key={c.key}
              onClick={() => setFreeChip(c.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors"
              style={{
                border: '1px solid #C9956C',
                color: '#C9956C',
                background: 'transparent',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Picker bottom sheet */}
        {freeChip && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setFreeChip(null)}>
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
                      <img src={getThumb(item.imageBase64, 400)} alt={item.type} className="w-full h-full object-contain" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <input
          type="text"
          value={outfitName}
          onChange={e => setOutfitName(e.target.value)}
          placeholder="Nom de la tenue (ex: Soirée samedi)"
          className="w-full px-4 py-3 rounded-lg bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 mt-4 mb-3"
        />

        <button
          onClick={handleSaveFree}
          disabled={!canSave}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
            canSave
              ? 'text-white shadow-lg active:scale-[0.98]'
              : 'bg-muted text-muted-foreground'
          }`}
          style={canSave ? { backgroundColor: '#C9956C' } : undefined}
        >
          Sauvegarder
        </button>
      </div>
    );
  }

  // Visual layout creation
  if (view === 'createVisual') {
    const canSave = filledSlots.length >= 2 && outfitName.trim().length > 0;
    return (
      <div className="fade-enter pb-4">
        {renderPicker()}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setSlots({}); setView('gallery'); setModeSheetOpen(true); }} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">Layout visuel</h1>
        </div>

        <OutfitVisualLayout slots={slots} onSlotTap={openPicker} />

        <p className="text-xs text-muted-foreground text-center mt-3 mb-4">
          {filledSlots.length} pièce{filledSlots.length > 1 ? 's' : ''} · min. 2 pour sauvegarder
        </p>

        <input
          type="text"
          value={outfitName}
          onChange={e => setOutfitName(e.target.value)}
          placeholder="Ex: Bureau lundi, Soirée…"
          className="w-full px-4 py-3 rounded-lg bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 mb-3"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSlots({})}
            className="text-xs text-muted-foreground underline px-2"
          >
            Effacer tout
          </button>
          <button
            onClick={handleSaveVisual}
            disabled={!canSave}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition-all duration-200 ${
              canSave
                ? 'text-white shadow-lg active:scale-[0.98]'
                : 'bg-muted text-muted-foreground'
            }`}
            style={canSave ? { backgroundColor: '#C9956C' } : undefined}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    );
  }

  if (view === 'createQuick') {
    const selected = getItemsByIds(Array.from(selectedIds));
    return (
      <div className="fade-enter pb-4 no-scrollbar overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setSelectedIds(new Set()); setView('gallery'); setModeSheetOpen(true); }} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">Sélection rapide</h1>
        </div>

        {selected.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {selected.map(item => (
              <img key={item.id} src={getThumb(item.imageBase64, 400)} alt={item.type}
 className="w-16 h-16 rounded-lg object-cover flex-shrink-0 ring-2 ring-primary" loading="lazy" decoding="async" />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-3">
          Sélectionne 2 à 5 pièces ({selectedIds.size}/5)
        </p>

        <button onClick={handleGenerate}
          className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm mb-4 active:scale-[0.98] transition-transform">
          ✨ Générer pour aujourd'hui
        </button>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {wardrobe.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`aspect-square rounded-lg overflow-hidden relative active:scale-[0.96] transition-transform ${
                selectedIds.has(item.id) ? 'ring-3 ring-primary' : ''
              }`}
            >
              <img src={getThumb(item.imageBase64, 400)} alt={item.type} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              {selectedIds.has(item.id) && (
                <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedIds.size >= 2 && (
          <>
            <input
              type="text"
              value={outfitName}
              onChange={e => setOutfitName(e.target.value)}
              placeholder="Nom de la tenue (ex: Bureau lundi)"
              className="w-full px-4 py-3 rounded-lg bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <button
              onClick={handleSaveQuick}
              disabled={!outfitName.trim()}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                outfitName.trim()
                  ? 'bg-primary text-primary-foreground shadow-lg active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Sauvegarder la tenue
            </button>
          </>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedOutfit) {
    const items = getItemsByIds(selectedOutfit.itemIds);
    return (
      <div className="fade-enter pb-4">
        {renderDeleteDialog()}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('gallery')} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">{selectedOutfit.name}</h1>
        </div>

        <OutfitLayout
          items={items}
          layoutData={selectedOutfit.layoutData ?? null}
          readOnly={true}
        />

        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg overflow-hidden card-shadow">
              <img src={getThumb(item.imageBase64, 400)} alt={item.type} className="w-full aspect-square object-cover bg-white" loading="lazy" decoding="async" />
              <div className="p-2 bg-card">
                <p className="text-xs font-medium truncate">{item.type}</p>
                <p className="text-xs text-muted-foreground truncate">{(item.color || []).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Créée le {new Date(selectedOutfit.createdAt).toLocaleDateString('fr-FR')}
        </p>
        <button
          onClick={() => setDeleteConfirm(selectedOutfit)}
          className="w-full py-3 rounded-xl bg-destructive/15 text-destructive font-semibold active:scale-[0.98] transition-transform"
        >
          Supprimer cette tenue
        </button>
      </div>
    );
  }

  // Mode choice bottom sheet (shared)
  const renderModeSheet = () => {
    if (!modeSheetOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={() => setModeSheetOpen(false)}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        <div
          className="relative w-full bg-card rounded-t-3xl p-5 animate-slide-in-bottom"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
          <h3 className="font-serif font-bold text-lg mb-1">Créer une tenue</h3>
          <p className="text-xs text-muted-foreground mb-4">Choisis ton mode de création</p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setModeSheetOpen(false);
                setSlots({}); setSelectedIds(new Set()); setOutfitName('');
                setView('createQuick');
              }}
              className="w-full bg-secondary/40 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-2xl flex-shrink-0">
                  ▦
                </div>
                <div className="flex-1">
                  <p className="font-serif font-bold text-base">Layout guidé</p>
                  <p className="text-xs text-muted-foreground">Sélection rapide de pièces</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setModeSheetOpen(false);
                setFreePieces([]); setFreeSelectedId(null); setOutfitName('');
                setView('createFree');
              }}
              className="w-full bg-secondary/40 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-2xl flex-shrink-0">
                  ✨
                </div>
                <div className="flex-1">
                  <p className="font-serif font-bold text-base">Disposition libre</p>
                  <p className="text-xs text-muted-foreground">Compose en drag & drop sur un canvas blanc</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Gallery
  return (
    <div className="fade-enter pb-4">
      {renderDeleteDialog()}
      {renderModeSheet()}
      <h1 className="text-2xl font-serif font-bold mb-4">Mes Looks</h1>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('outfits')}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors"
          style={{
            backgroundColor: tab === 'outfits' ? '#C9956C' : 'transparent',
            color: tab === 'outfits' ? '#FFFFFF' : '#C9956C',
            border: '1px solid #C9956C',
          }}
        >
          Mes tenues
        </button>
        <button
          onClick={() => setTab('calendar')}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors"
          style={{
            backgroundColor: tab === 'calendar' ? '#C9956C' : 'transparent',
            color: tab === 'calendar' ? '#FFFFFF' : '#C9956C',
            border: '1px solid #C9956C',
          }}
        >
          Calendrier
        </button>
      </div>

      {tab === 'calendar' && <CalendarView />}

      {tab === 'outfits' && (
        <>
          <button
            onClick={() => setModeSheetOpen(true)}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold mb-5 active:scale-[0.98] transition-transform shadow-lg"
          >
            + Créer une tenue
          </button>

          {outfits.length > 0 ? (
            <div>
              {outfits.map(outfit => {
                const items = getItemsByIds(outfit.itemIds);
                return (
                  <div key={outfit.id}>
                    <OutfitGalleryCard
                      outfit={outfit}
                      items={items}
                      pseudo={pseudo}
                      onClick={() => { setSelectedOutfit(outfit); setView('detail'); }}
                      onToggleLike={(next) => handleToggleLike(outfit, next)}
                      hideName
                    />
                    <p style={{
                      textAlign: 'center',
                      fontSize: 14,
                      fontStyle: 'italic',
                      color: '#8B6F5E',
                      marginTop: 8,
                      marginBottom: 4,
                    }}>
                      {outfit.name || 'Tenue sans nom'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">✨</p>
              <p className="font-serif text-lg">Aucune tenue créée</p>
              <p className="text-sm mt-1">Compose ta première tenue !</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
