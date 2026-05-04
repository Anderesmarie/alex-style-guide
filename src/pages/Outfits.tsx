import { useState, useEffect, useRef } from 'react';
import { ClothingItem, Outfit, OutfitLayoutData } from '@/lib/types';
import { getWardrobe, getOutfits, addOutfit, deleteOutfit, setOutfitLiked, setOutfitLayoutData, genId } from '@/lib/storage';
import { generateRecommendations } from '@/lib/recommendations';
import { updateStreak } from '@/lib/streak';
import { getCategoryByType } from '@/lib/categories';
import { supabase } from '@/integrations/supabase/client';
import CalendarView from '@/components/CalendarView';
import OutfitVisualLayout, { SlotKey, SlotMap, SLOT_CONFIG } from '@/components/OutfitVisualLayout';
import OutfitGalleryCard from '@/components/OutfitGalleryCard';
import OutfitFreeCanvas, { CHIPS, ChipKey, chipMatchesItem, defaultPositionForCategory, CANVAS_W, CANVAS_H } from '@/components/OutfitFreeCanvas';
import OutfitLayout, { mapItemsToLayout } from '@/components/OutfitLayout';
import OutfitDetailView from '@/components/OutfitDetailView';
import { getCategoryByType as _getCat } from '@/lib/categories';

type View = 'gallery' | 'createVisual' | 'createQuick' | 'createFree' | 'detail';
type Tab = 'outfits' | 'calendar';

interface OutfitsProps {
  initialOutfitId?: string | null;
  onConsumeInitialOutfitId?: () => void;
}

export default function Outfits({ initialOutfitId, onConsumeInitialOutfitId }: OutfitsProps = {}) {
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
  const [modeSheetState, setModeSheetState] = useState<'collapsed' | 'half' | 'full'>('collapsed');

  // Free-canvas state
  const [freePieces, setFreePieces] = useState<Array<{ itemId: string; item: ClothingItem; x: number; y: number; size: number; z: number }>>([]);
  const [freeSelectedId, setFreeSelectedId] = useState<string | null>(null);
  const [freeChip, setFreeChip] = useState<ChipKey | null>(null);

  // Quick-zones state (createQuick view)
  type ZoneKey = 'jacket' | 'belt' | 'top' | 'bottom' | 'shoes' | 'pull' | 'bag' | 'jewelry' | 'accessory';
  const [zones, setZones] = useState<Record<ZoneKey, string | null>>({
    jacket: null, belt: null, top: null, bottom: null, shoes: null,
    pull: null, bag: null, jewelry: null, accessory: null,
  });
  const [zonePicker, setZonePicker] = useState<ZoneKey | null>(null);

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

  // Auto-open detail view when navigated from Today
  useEffect(() => {
    if (!initialOutfitId || outfits.length === 0) return;
    const found = outfits.find(o => o.id === initialOutfitId);
    if (found) {
      setSelectedOutfit(found);
      setView('detail');
      setTab('outfits');
      onConsumeInitialOutfitId?.();
    }
  }, [initialOutfitId, outfits, onConsumeInitialOutfitId]);

  const handleToggleLike = async (outfit: Outfit, next: boolean) => {
    setOutfits(prev => prev.map(o => o.id === outfit.id ? { ...o, liked: next } : o));
    try { await setOutfitLiked(outfit.id, next); } catch {}
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 8) next.add(id);
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
    await deleteOutfit(deleteConfirm.id);
    const o = await getOutfits();
    setOutfits(o);
    setDeleteConfirm(null);
    setView('gallery');
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
        const cat = getCategoryByType(it.type)?.name || it.category;
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
      const cat = getCategoryByType(it.type)?.name || it.category;
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
                  <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
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
      const cat = _getCat(item.type)?.name || item.category || '';
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
                      <img src={item.imageBase64} alt={item.type} className="w-full h-full object-contain" />
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

  // ----- Quick-zones helpers -----
  const ZONE_META: Record<ZoneKey, { label: string; emoji: string; cats: string[]; types?: string[] }> = {
    jacket: { label: 'Veste / Manteau', emoji: '🧥', cats: ['Manteaux & vestes'] },
    belt: { label: 'Ceinture', emoji: '👔', cats: ['Accessoires'], types: ['Ceinture'] },
    top: { label: 'Haut', emoji: '👕', cats: ['Hauts', 'Robes & combinaisons'] },
    bottom: { label: 'Bas', emoji: '👖', cats: ['Bas', 'Jupes'] },
    shoes: { label: 'Chaussures', emoji: '👟', cats: ['Chaussures'] },
    pull: { label: 'Pull', emoji: '🧶', cats: ['Pulls & sweats'] },
    bag: { label: 'Sac', emoji: '👜', cats: ['Sacs'] },
    jewelry: { label: 'Bijoux', emoji: '💍', cats: ['Accessoires'], types: ['Bijoux'] },
    accessory: { label: 'Accessoire', emoji: '🧢', cats: ['Accessoires'] },
  };

  const zoneFilteredItems = (zk: ZoneKey): ClothingItem[] => {
    const meta = ZONE_META[zk];
    return wardrobe.filter(it => {
      const cat = getCategoryByType(it.type)?.name || it.category || '';
      if (!meta.cats.includes(cat)) return false;
      if (meta.types && !meta.types.includes(it.type)) return false;
      if (zk === 'accessory' && (it.type === 'Ceinture' || it.type === 'Bijoux')) return false;
      return true;
    });
  };

  const filledZoneCount = Object.values(zones).filter(Boolean).length;

  const assignToZone = (item: ClothingItem) => {
    if (!zonePicker) return;
    if (filledZoneCount >= 8 && !zones[zonePicker]) return;
    setZones(prev => ({ ...prev, [zonePicker]: item.id }));
    setZonePicker(null);
  };

  const clearZone = (zk: ZoneKey) => {
    setZones(prev => ({ ...prev, [zk]: null }));
  };

  const resetQuickZones = () => {
    setZones({
      jacket: null, belt: null, top: null, bottom: null, shoes: null,
      pull: null, bag: null, jewelry: null, accessory: null,
    });
    setOutfitName('');
  };

  const handleSaveZones = async () => {
    const ids = (Object.values(zones).filter(Boolean) as string[]);
    if (ids.length < 2 || !outfitName.trim()) return;
    await addOutfit({
      id: genId(),
      name: outfitName.trim(),
      itemIds: ids,
      createdAt: new Date().toISOString(),
    });
    updateStreak();
    const o = await getOutfits();
    setOutfits(o);
    resetQuickZones();
    setView('gallery');
  };

  const Zone = ({ zk, h }: { zk: ZoneKey; h: number }) => {
    const id = zones[zk];
    const item = id ? wardrobe.find(i => i.id === id) : null;
    const meta = ZONE_META[zk];
    return (
      <div
        style={{ width: '100%', height: h, position: 'relative' }}
        onClick={() => { if (!item) setZonePicker(zk); }}
        className={!item ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
      >
        {item ? (
          <>
            <img
              src={item.imageBase64}
              alt={item.type}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); clearZone(zk); }}
              aria-label="Retirer"
              style={{
                position: 'absolute', top: 2, right: 2,
                width: 24, height: 24, borderRadius: 999,
                background: 'rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, lineHeight: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              🗑️
            </button>
          </>
        ) : (
          <div
            style={{
              width: '100%', height: '100%',
              background: '#F5F5F5', borderRadius: 8,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: Math.min(28, h * 0.35), opacity: 0.45 }}>{meta.emoji}</span>
            <div
              style={{
                width: 26, height: 26, borderRadius: 999,
                background: '#C9956C', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 600, lineHeight: 1,
              }}
            >
              +
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuickZones = () => {
    const canSave = filledZoneCount >= 2 && !!outfitName.trim();
    const pickerItems = zonePicker ? zoneFilteredItems(zonePicker) : [];
    return (
      <div className="fade-enter pb-4 no-scrollbar overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { resetQuickZones(); setView('gallery'); setModeSheetOpen(true); }}
            className="text-2xl"
          >
            ←
          </button>
          <h1 className="text-xl font-serif font-bold">Compose ta tenue</h1>
        </div>

        <div
          style={{
            width: '100%', height: 480,
            background: '#FFFFFF', borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: 12, marginBottom: 16,
          }}
        >
          <div className="flex items-start" style={{ gap: 6, width: '100%', height: '100%' }}>
            <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
              <Zone zk="jacket" h={300} />
              <Zone zk="belt" h={70} />
            </div>
            <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
              <Zone zk="top" h={170} />
              <Zone zk="bottom" h={180} />
              <Zone zk="shoes" h={110} />
            </div>
            <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
              <Zone zk="pull" h={150} />
              <Zone zk="bag" h={120} />
              <Zone zk="jewelry" h={70} />
              <Zone zk="accessory" h={70} />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 text-center">
          {filledZoneCount} pièce{filledZoneCount > 1 ? 's' : ''} ajoutée{filledZoneCount > 1 ? 's' : ''} · min 2, max 8
        </p>

        <input
          type="text"
          value={outfitName}
          onChange={e => setOutfitName(e.target.value)}
          placeholder="Nom de la tenue (ex: Bureau lundi)"
          className="w-full px-4 py-3 rounded-lg bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 mb-4"
        />

        <button
          onClick={handleSaveZones}
          disabled={!canSave}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
            canSave
              ? 'bg-primary text-primary-foreground shadow-lg active:scale-[0.98]'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Sauvegarder
        </button>

        {zonePicker && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setZonePicker(null)}>
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
            <div
              onClick={e => e.stopPropagation()}
              className="relative w-full bg-card rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-bold text-lg">
                  {ZONE_META[zonePicker].emoji} {ZONE_META[zonePicker].label}
                </h3>
                <button onClick={() => setZonePicker(null)} className="text-2xl leading-none">×</button>
              </div>
              {pickerItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Aucune pièce dans cette catégorie.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {pickerItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => assignToZone(item)}
                      className="aspect-square rounded-lg overflow-hidden bg-white card-shadow active:scale-[0.96] transition-transform"
                    >
                      <img
                        src={item.imageBase64}
                        alt={item.type}
                        className="w-full h-full"
                        style={{ objectFit: 'contain' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (view === 'createQuick') {
    return renderQuickZones();
  }


  if (view === 'detail' && selectedOutfit) {
    const items = getItemsByIds(selectedOutfit.itemIds);
    const layoutProps = mapItemsToLayout(items);
    return (
      <OutfitDetailView
        key={selectedOutfit.id}
        outfit={selectedOutfit}
        layoutProps={layoutProps}
        items={items}
        onBack={() => setView('gallery')}
        onDelete={() => setDeleteConfirm(selectedOutfit)}
        renderDeleteDialog={renderDeleteDialog}
      />
    );
  }

  // Mode choice bottom sheet (shared) — draggable: collapsed / half / full
  const renderModeSheet = () => {
    if (!modeSheetOpen) return null;

    const heightVh = modeSheetState === 'full' ? 95 : modeSheetState === 'half' ? 60 : 30;

    const cycleUp = () => {
      setModeSheetState(s => s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'full');
    };
    const cycleDown = () => {
      setModeSheetState(s => s === 'full' ? 'half' : s === 'half' ? 'collapsed' : 'collapsed');
    };

    // Touch / pointer drag on the handle
    let startY: number | null = null;
    const onPointerDown = (e: React.PointerEvent) => {
      startY = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e: React.PointerEvent) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      startY = null;
      if (dy < -30) cycleUp();
      else if (dy > 30) cycleDown();
    };

    const closeSheet = () => {
      setModeSheetOpen(false);
      setModeSheetState('collapsed');
    };

    const openCreate = (mode: 'quick' | 'free') => {
      closeSheet();
      if (mode === 'quick') {
        setSlots({}); setSelectedIds(new Set()); setOutfitName('');
        setView('createQuick');
      } else {
        setFreePieces([]); setFreeSelectedId(null); setOutfitName('');
        setView('createFree');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={closeSheet}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        <div
          className="relative w-full bg-card rounded-t-3xl flex flex-col animate-slide-in-bottom transition-[height] duration-300 ease-out"
          style={{ height: `${heightVh}vh` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Draggable handle */}
          <div
            className="pt-3 pb-2 cursor-grab active:cursor-grabbing select-none touch-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onClick={cycleUp}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3">
            <h3 className="font-serif font-bold text-lg mb-1">Créer une tenue</h3>
            <p className="text-xs text-muted-foreground">Choisis ton mode de création</p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <div className="space-y-3">
              <button
                onClick={() => openCreate('quick')}
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
                onClick={() => openCreate('free')}
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

              {/* Quick wardrobe preview — visible when sheet is expanded */}
              {(modeSheetState === 'half' || modeSheetState === 'full') && wardrobe.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Aperçu de ton dressing</p>
                  <div className="grid grid-cols-3 gap-2">
                    {wardrobe.map(item => (
                      <div
                        key={item.id}
                        className="aspect-square rounded-lg overflow-hidden bg-secondary/30"
                      >
                        <img src={item.imageBase64} alt={item.type} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            <div className="space-y-4">
              {outfits.map(outfit => {
                const items = getItemsByIds(outfit.itemIds);
                const layoutProps = mapItemsToLayout(items);
                return (
                  <button
                    key={outfit.id}
                    onClick={() => { setSelectedOutfit(outfit); setView('detail'); }}
                    className="w-full bg-white rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <OutfitLayout
                      {...layoutProps}
                      readOnly={true}
                      initialLayoutData={outfit.layoutData ?? null}
                    />
                    <p
                      className="text-center mt-2"
                      style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#2C2C2C' }}
                    >
                      {outfit.name?.trim() || new Date(outfit.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </button>
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
