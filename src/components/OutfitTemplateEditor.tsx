import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import { ClothingItem, OutfitLayoutData, OutfitLayoutPiece } from '@/lib/types';
import {
  LAYOUT_GRID,
  LAYOUT_TEMPLATES,
  selectTemplateForItems,
  categoryOfItem,
} from './OutfitLayout';
const ROSE_GOLD = '#C9956C';
const CANVAS_W = 360;
const CANVAS_H = 500;

export type SlotKey = 'H1' | 'H2' | 'H3' | 'B' | 'ACH' | 'ASAC' | 'A1' | 'A2' | 'A3';

export type AddCategory = 'haut' | 'bas' | 'veste' | 'chaussures' | 'sac' | 'accessoire';

const ADD_BUTTONS: { key: AddCategory; label: string; cats: string[]; slots: SlotKey[] }[] = [
  { key: 'haut', label: '+ Haut', cats: ['Hauts', 'Pulls'], slots: ['H1', 'H2'] },
  { key: 'bas', label: '+ Bas', cats: ['Bas', 'Robes'], slots: ['B'] },
  { key: 'veste', label: '+ Veste', cats: ['Manteaux'], slots: ['H3'] },
  { key: 'chaussures', label: '+ Chaussures', cats: ['Chaussures'], slots: ['ACH'] },
  { key: 'sac', label: '+ Sac', cats: ['Sacs'], slots: ['ASAC'] },
  { key: 'accessoire', label: '+ Accessoire', cats: ['Accessoires', 'Bijoux'], slots: ['A1', 'A2', 'A3'] },
];

interface EditorPiece {
  slot: SlotKey;
  itemId: string;
  item: ClothingItem;
  x: number; // %
  y: number; // %
  w: number; // %
  h: number; // %
  z: number;
}

function slotForCategory(cat: string, isRobe: boolean, used: Set<SlotKey>): SlotKey | null {
  if (cat === 'Hauts') return used.has('H1') ? null : 'H1';
  if (cat === 'Pulls') return used.has('H2') ? null : 'H2';
  if (cat === 'Manteaux') return used.has('H3') ? null : 'H3';
  if (cat === 'Chaussures') return used.has('ACH') ? null : 'ACH';
  if (cat === 'Sacs') return used.has('ASAC') ? null : 'ASAC';
  if (cat === 'Accessoires' || cat === 'Bijoux') {
    for (const s of ['A1', 'A2', 'A3'] as SlotKey[]) if (!used.has(s)) return s;
    return null;
  }
  if (cat === 'Bas' || cat === 'Robes') {
    return used.has('B') ? null : 'B';
  }
  return null;
}

function cellToPiece(cell: { x: number; y: number; w: number; h: number }): { x: number; y: number; w: number; h: number } {
  return {
    x: (cell.x / LAYOUT_GRID.W) * 100,
    y: ((LAYOUT_GRID.H - cell.y - cell.h) / LAYOUT_GRID.H) * 100,
    w: (cell.w / LAYOUT_GRID.W) * 100,
    h: (cell.h / LAYOUT_GRID.H) * 100,
  };
}

interface Props {
  items: ClothingItem[];
  initialLayout?: OutfitLayoutData | null;
  wardrobe: ClothingItem[];
  onCancel: () => void;
  onSave: (newItems: ClothingItem[], layoutData: OutfitLayoutData, name?: string, snapshotUrl?: string | null) => void;
  initialName?: string;
  showSafeZone?: boolean;
}

export default function OutfitTemplateEditor({ items, initialLayout, wardrobe, onCancel, onSave, initialName = '', showSafeZone = true }: Props) {
  const tplKey = selectTemplateForItems(items);
  const template = LAYOUT_TEMPLATES[tplKey];

  // Build initial pieces
  const buildInitial = useCallback((): EditorPiece[] => {
    const used = new Set<SlotKey>();
    const out: EditorPiece[] = [];
    let z = 1;
    for (const it of items) {
      const cat = categoryOfItem(it);
      const slot = slotForCategory(cat, tplKey === 'RC', used);
      if (!slot) continue;
      used.add(slot);
      const cellKey = (slot === 'A2' || slot === 'A3' ? 'A1' : slot) as keyof typeof template;
      const cell = (template as any)[cellKey];
      let pos = cell ? cellToPiece(cell) : { x: 35, y: 40, w: 30, h: 22 };
      // offset secondary accessories
      if (slot === 'A2') pos = { ...pos, x: pos.x + 8, y: pos.y + 8 };
      if (slot === 'A3') pos = { ...pos, x: pos.x - 8, y: pos.y + 16 };
      // override from initialLayout if available
      const saved = initialLayout?.pieces.find(p => p.itemId === it.id);
      if (saved) {
        const cw = initialLayout?.canvasW || CANVAS_W;
        const ch = initialLayout?.canvasH || CANVAS_H;
        const w = saved.w ?? (saved.size ? (saved.size / cw) * 100 : pos.w);
        const h = saved.h ?? w * (cw / ch);
        pos = { x: saved.x, y: saved.y, w, h };
        z = Math.max(z, saved.z + 1);
      }
      out.push({ slot, itemId: it.id, item: it, ...pos, z: saved?.z ?? z++ });
    }
    return out;
  }, [items, initialLayout, template, tplKey]);

  const [pieces, setPieces] = useState<EditorPiece[]>(buildInitial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<AddCategory | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [name, setName] = useState<string>(initialName);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const needsName = !initialName;
  const nameValid = !needsName || name.trim().length > 0;

  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sheet]);

  const usedSlots = useMemo(() => new Set(pieces.map(p => p.slot)), [pieces]);

  // ---------- Drag ----------
  const dragRef = useRef<{ id: string; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  const endDrag = useCallback((commit: boolean) => {
    const d = dragRef.current;
    if (!d) return;
    if (commit) {
      const finalX = d.baseX + (offsetRef.current.dx / CANVAS_W) * 100;
      const finalY = d.baseY + (offsetRef.current.dy / CANVAS_H) * 100;
      setPieces(prev => prev.map(p =>
        p.itemId === d.id
          ? { ...p, x: Math.max(5.6, Math.min(94.4, finalX)), y: Math.max(20, Math.min(89.6, finalY)) }
          : p
      ));
    }
    dragRef.current = null;
    offsetRef.current = { dx: 0, dy: 0 };
    setDragOffset({ dx: 0, dy: 0 });
    setDragId(null);
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }, []);

  useEffect(() => {
    if (!dragId) return;
    const move = (cx: number, cy: number) => {
      const d = dragRef.current;
      if (!d) return;
      offsetRef.current = { dx: cx - d.startX, dy: cy - d.startY };
      setDragOffset(offsetRef.current);
    };
    const onMM = (e: MouseEvent) => { e.preventDefault(); move(e.clientX, e.clientY); };
    const onMU = (e: MouseEvent) => { e.preventDefault(); endDrag(true); };
    const onTM = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTE = (e: TouchEvent) => { e.preventDefault(); endDrag(true); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
    window.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend', onTE, { passive: false });
    window.addEventListener('touchcancel', () => endDrag(false));
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend', onTE);
    };
  }, [dragId, endDrag]);

  const bringToFront = (itemId: string) => {
    setPieces(prev => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map(pp => pp.z)) : 0;
      const target = prev.find(pp => pp.itemId === itemId);
      if (!target || target.z === maxZ) return prev;
      return prev.map(pp => pp.itemId === itemId ? { ...pp, z: maxZ + 1 } : pp);
    });
  };

  const startDrag = (p: EditorPiece, cx: number, cy: number) => {
    dragRef.current = { id: p.itemId, startX: cx, startY: cy, baseX: p.x, baseY: p.y };
    offsetRef.current = { dx: 0, dy: 0 };
    setDragOffset({ dx: 0, dy: 0 });
    setDragId(p.itemId);
    setSelectedId(p.itemId);
    bringToFront(p.itemId);
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };

  // ---------- Resize ----------
  const resizeSelected = (factor: number) => {
    if (!selectedId) return;
    setPieces(prev => prev.map(p => {
      if (p.itemId !== selectedId) return p;
      const newW = Math.max(8, Math.min(95, p.w * factor));
      const newH = Math.max(6, Math.min(95, p.h * factor));
      return { ...p, w: newW, h: newH };
    }));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setPieces(prev => prev.filter(p => p.itemId !== selectedId));
    setSelectedId(null);
  };

  // ---------- Add ----------
  const isAddDisabled = (btn: typeof ADD_BUTTONS[number]) => btn.slots.every(s => usedSlots.has(s));

  const sheetItems = useMemo(() => {
    if (!sheet) return [];
    const def = ADD_BUTTONS.find(b => b.key === sheet);
    if (!def) return [];
    return wardrobe.filter(it => {
      const cat = categoryOfItem(it);
      if (!def.cats.includes(cat)) return false;
      // skip if already in pieces
      return !pieces.some(p => p.itemId === it.id);
    });
  }, [sheet, wardrobe, pieces]);

  const addPiece = (item: ClothingItem) => {
    const cat = categoryOfItem(item);
    const used = new Set(pieces.map(p => p.slot));
    const slot = slotForCategory(cat, tplKey === 'RC', used);
    if (!slot) {
      setSheet(null);
      return;
    }
    const cellKey = (slot === 'A2' || slot === 'A3' ? 'A1' : slot) as keyof typeof template;
    const cell = (template as any)[cellKey];
    let pos = cell ? cellToPiece(cell) : { x: 35, y: 40, w: 30, h: 22 };
    if (slot === 'A2') pos = { ...pos, x: pos.x + 8, y: pos.y + 8 };
    if (slot === 'A3') pos = { ...pos, x: pos.x - 8, y: pos.y + 16 };
    const z = pieces.length > 0 ? Math.max(...pieces.map(p => p.z)) + 1 : 1;
    setPieces(prev => [...prev, { slot, itemId: item.id, item, ...pos, z }]);
    setSelectedId(item.id);
    setSheet(null);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    if (isBottom) setShowScrollHint(false);
  };

  useEffect(() => {
    setShowScrollHint(true);
  }, [sheet]);

  // ---------- Save ----------
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const layoutPieces: OutfitLayoutPiece[] = pieces.map(p => ({
      itemId: p.itemId,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      size: (p.w / 100) * CANVAS_W, // legacy
      z: p.z,
    }));
    const layoutData: OutfitLayoutData = {
      canvasW: CANVAS_W,
      canvasH: CANVAS_H,
      pieces: layoutPieces,
    };

    // Capture safe-zone snapshot and upload to Supabase Storage
    let snapshotUrl: string | null = null;
    try {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const renderedW = rect.width;
        const renderedH = rect.height;
        const safeX = renderedW * 0.056;
        const safeY = renderedH * 0.20;
        const safeW = renderedW * 0.888;
        const safeH = renderedH * 0.696;

        const canvas = await html2canvas(canvasRef.current, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          backgroundColor: '#ffffff',
          x: safeX,
          y: safeY,
          width: safeW,
          height: safeH,
        });

        const snapshotBlob: Blob | null = await new Promise(resolve =>
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        );

        if (snapshotBlob) {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;
          if (userId) {
            const fileId = (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const path = `${userId}/${fileId}.jpg`;
            const { error: upErr } = await supabase.storage
              .from('snapshots')
              .upload(path, snapshotBlob, { contentType: 'image/jpeg', upsert: true });
            if (!upErr) {
              const { data } = supabase.storage.from('snapshots').getPublicUrl(path);
              snapshotUrl = data.publicUrl;
            } else {
              console.warn('snapshot upload failed:', upErr);
            }
          }
        }
      }
    } catch (e) {
      console.warn('snapshot capture failed:', e);
    }

    onSave(pieces.map(p => p.item), layoutData, name.trim(), snapshotUrl);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="p-4 pb-32 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onCancel} className="text-2xl" aria-label="Fermer">←</button>
          <h1 className="text-xl font-serif font-bold">Modifier la tenue ✨</h1>
        </div>

        {/* Canvas */}
        <div
          onClick={() => setSelectedId(null)}
          className="relative mx-auto bg-white rounded-2xl overflow-hidden"
          style={{
            width: '100%',
            maxWidth: CANVAS_W,
            aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {pieces.map(p => {
            const isDrag = dragId === p.itemId;
            const offX = isDrag ? (dragOffset.dx / CANVAS_W) * 100 : 0;
            const offY = isDrag ? (dragOffset.dy / CANVAS_H) * 100 : 0;
            const selected = selectedId === p.itemId;
            return (
              <div
                key={p.itemId}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); startDrag(p, e.clientX, e.clientY); }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (!e.touches[0]) return;
                  startDrag(p, e.touches[0].clientX, e.touches[0].clientY);
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedId(p.itemId); bringToFront(p.itemId); }}
                style={{
                  position: 'absolute',
                  left: `${p.x + offX}%`,
                  top: `${p.y + offY}%`,
                  width: `${p.w}%`,
                  height: `${p.h}%`,
                  zIndex: p.z,
                  cursor: isDrag ? 'grabbing' : 'grab',
                  outline: selected ? `2px solid ${ROSE_GOLD}` : 'none',
                  outlineOffset: 2,
                  borderRadius: 6,
                  touchAction: 'none',
                }}
              >
                <img
                  src={p.item.imageBase64}
                  alt={p.item.type}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            );
          })}
          {showSafeZone && (
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '5.6%',
                width: '88.8%',
                height: '69.6%',
                border: '2px dashed rgba(196, 168, 130, 0.5)',
                borderRadius: 8,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}
        </div>

        {/* Resize / delete controls */}
        {selectedId && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => resizeSelected(0.85)}
              className="w-10 h-10 rounded-full bg-card card-shadow text-lg active:scale-90 transition-transform"
            >−</button>
            <button
              onClick={() => resizeSelected(1.15)}
              className="w-10 h-10 rounded-full bg-card card-shadow text-lg active:scale-90 transition-transform"
            >+</button>
            <button
              onClick={removeSelected}
              className="px-4 h-10 rounded-full bg-destructive/15 text-destructive text-sm font-semibold active:scale-95 transition-transform"
            >🗑 Retirer</button>
          </div>
        )}

        {/* Add buttons */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {ADD_BUTTONS.map(btn => {
            const disabled = isAddDisabled(btn);
            return (
              <button
                key={btn.key}
                onClick={() => !disabled && setSheet(btn.key)}
                disabled={disabled}
                className="px-3 py-2 rounded-full text-xs font-medium transition-opacity disabled:opacity-40"
                style={{
                  border: `1px solid ${ROSE_GOLD}`,
                  color: ROSE_GOLD,
                  background: 'transparent',
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Name input (when no initial name) */}
        {needsName && (
          <div className="mt-6">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Nom de la tenue
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Look du weekend ✨"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Bottom action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={pieces.length < 1 || !nameValid}
            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ backgroundColor: ROSE_GOLD }}
          >
            Enregistrer
          </button>
        </div>

        {/* Bottom sheet — pick item */}
        {sheet && (
          <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setSheet(null)}>
            <style>{`
              .sheet-scroll::-webkit-scrollbar { width: 6px; }
              .sheet-scroll::-webkit-scrollbar-thumb { background: #C9956C; border-radius: 3px; }
            `}</style>
            <div
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onTouchMove={(e) => e.preventDefault()}
            />
            <div
              className="relative w-full bg-card rounded-t-3xl animate-slide-in-bottom flex flex-col"
              style={{
                maxHeight: '70vh',
                touchAction: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Fixed header */}
              <div className="p-5 pb-0 shrink-0">
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                <h3 className="font-serif font-bold text-lg mb-3">
                  {ADD_BUTTONS.find(b => b.key === sheet)?.label.replace('+ ', '')}
                </h3>
              </div>
              {/* Scrollable content */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="px-5 pb-5 sheet-scroll"
                style={{
                  overflowY: 'scroll',
                  touchAction: 'pan-y',
                  height: '50vh',
                  scrollbarWidth: 'thin',
                  overscrollBehavior: 'contain',
                }}
              >
                {sheetItems.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Aucune pièce dans cette catégorie
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {sheetItems.map(it => (
                      <button
                        key={it.id}
                        onClick={() => addPiece(it)}
                        className="aspect-square rounded-lg overflow-hidden bg-white active:scale-[0.96] transition-transform"
                      >
                        <img src={it.imageBase64} alt={it.type} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
                {showScrollHint && sheetItems.length > 6 && (
                  <p className="text-center text-xs text-muted-foreground mt-2 pb-1">
                    ↓ Voir plus
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
