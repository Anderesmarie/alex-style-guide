import { useEffect, useRef, useState, useCallback } from 'react';
import { useDrag, usePinch } from '@use-gesture/react';
import { ClothingItem, OutfitLayoutData } from '@/lib/types';
import { getCategoryByType } from '@/lib/categories';

/**
 * Grille de référence : 36 colonnes × 50 lignes.
 * Y inversé : Y=0 en bas, Y=50 en haut.
 *
 *  left   = x * U
 *  top    = (50 - y - h) * U
 *  width  = w * U
 *  height = h * U
 */
const U = 10;
const COLS = 36;
const ROWS = 50;
const W = COLS * U; // 360
const H = ROWS * U; // 500

type SlotId = 'H1' | 'H2' | 'H3' | 'B' | 'ACH' | 'ASAC' | 'A1';

interface SlotDef {
  id: SlotId;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SLOT_ICONS: Record<SlotId, string> = {
  H1: '👕', H2: '👕', H3: '👕',
  B: '👖',
  ACH: '👟', ASAC: '👜',
  A1: '💍',
};

const TEMPLATES: Record<string, Partial<Record<SlotId, SlotDef>>> = {
  // Template universel Haut + Bas
  HB: {
    H1:   { id:'H1',   x:0,  y:34, w:16, h:16 },
    H2:   { id:'H2',   x:21, y:15, w:15, h:16 },
    H3:   { id:'H3',   x:21, y:34, w:15, h:16 },
    B:    { id:'B',    x:0,  y:10, w:16, h:24 },
    ACH:  { id:'ACH',  x:0,  y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:0,  w:11, h:10 },
    A1:   { id:'A1',   x:13, y:0,  w:11, h:10 },
  },
  // Template universel Robe/Combinaison + couches
  RH: {
    H2:   { id:'H2',   x:20, y:34, w:16, h:16 },
    H3:   { id:'H3',   x:0,  y:34, w:17, h:16 },
    B:    { id:'B',    x:0,  y:2,  w:17, h:31 },
    ACH:  { id:'ACH',  x:24, y:0,  w:12, h:11 },
    ASAC: { id:'ASAC', x:24, y:11, w:12, h:11 },
    A1:   { id:'A1',   x:24, y:22, w:12, h:11 },
  },
};

function selectTemplate(props: OutfitLayoutPropsLike): Partial<Record<SlotId, SlotDef>> {
  if (props.isRobe) return TEMPLATES.RH;
  return TEMPLATES.HB;
}

interface OutfitLayoutPropsLike {
  h1?: ClothingItem;
  h2?: ClothingItem;
  h3?: ClothingItem;
  bas?: ClothingItem;
  isRobe?: boolean;
}

function buildPieces(
  template: Partial<Record<SlotId, SlotDef>>,
  items: {
    h1?: ClothingItem; h2?: ClothingItem; h3?: ClothingItem; bas?: ClothingItem;
    chaussures?: ClothingItem; sac?: ClothingItem;
    ceinture?: ClothingItem; echarpe?: ClothingItem; bijoux?: ClothingItem; couvre_chef?: ClothingItem;
  }
): PieceConfig[] {
  const list: PieceConfig[] = [];
  const push = (key: string, slotId: SlotId, item?: ClothingItem) => {
    const def = template[slotId];
    if (!def || !item) return;
    list.push({ key, def, item });
  };
  push('H1', 'H1', items.h1);
  push('H2', 'H2', items.h2);
  push('H3', 'H3', items.h3);
  push('B', 'B', items.bas);
  push('ACH', 'ACH', items.chaussures);
  push('ASAC', 'ASAC', items.sac);
  const firstAcc = items.couvre_chef || items.echarpe || items.ceinture || items.bijoux;
  if (firstAcc) push('A1', 'A1', firstAcc);
  return list;
}

export interface OutfitLayoutProps {
  h1?: ClothingItem;
  h2?: ClothingItem;
  h3?: ClothingItem;
  bas?: ClothingItem;
  isRobe?: boolean;
  chaussures?: ClothingItem;
  sac?: ClothingItem;
  ceinture?: ClothingItem;
  echarpe?: ClothingItem;
  bijoux?: ClothingItem;
  couvre_chef?: ClothingItem;
  debugMode?: boolean;
  readOnly?: boolean;
  initialLayoutData?: OutfitLayoutData | null;
  onLayoutChange?: (data: OutfitLayoutData) => void;
}

const DEBUG_COLORS: Record<SlotId, string> = {
  H1: '#60a5fa', H2: '#93c5fd', H3: '#bfdbfe',
  B: '#34d399',
  ACH: '#fb923c', ASAC: '#f472b6',
  A1: '#facc15',
};

function DebugSlot({ def }: { def: SlotDef }) {
  const left = def.x * U;
  const top = (ROWS - def.y - def.h) * U;
  const width = def.w * U;
  const height = def.h * U;
  const color = DEBUG_COLORS[def.id];
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left, top, width, height,
        background: color,
        opacity: 0.4,
        border: `1px solid ${color}`,
        borderRadius: 8,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: '#1f2937' }}>{def.id}</span>
    </div>
  );
}

interface PieceState {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface PieceConfig {
  key: string;
  def: SlotDef;
  item?: ClothingItem;
}

function initialState(def: SlotDef): PieceState {
  return {
    x: def.x * U,
    y: (ROWS - def.y - def.h) * U,
    width: def.w * U,
    height: def.h * U,
    zIndex: 1,
  };
}

const MIN_SIZE = 30;
const MAX_SIZE = 400;

interface DraggablePieceProps {
  config: PieceConfig;
  state: PieceState;
  onChange: (next: PieceState) => void;
  onSelect: () => void;
  selected: boolean;
  readOnly?: boolean;
}

function DraggablePiece({ config, state, onChange, onSelect, selected, readOnly }: DraggablePieceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { def, item } = config;

  useDrag(
    ({ offset: [ox, oy], first }) => {
      if (readOnly) return;
      if (first) onSelect();
      const x = Math.max(0, Math.min(W - state.width, ox));
      const y = Math.max(0, Math.min(H - state.height, oy));
      onChange({ ...state, x, y });
    },
    {
      target: ref,
      from: () => [state.x, state.y],
      eventOptions: { passive: false },
      pointer: { touch: true },
      enabled: !readOnly,
    }
  );

  usePinch(
    ({ offset: [scale], first }) => {
      if (readOnly) return;
      if (first) onSelect();
      const ratio = Math.max(0.3, Math.min(4, scale));
      const baseW = def.w * U;
      const baseH = def.h * U;
      const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, baseW * ratio));
      const newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, baseH * ratio));
      onChange({ ...state, width: newW, height: newH });
    },
    {
      target: ref,
      scaleBounds: { min: 0.3, max: 4 },
      from: () => [state.width / (def.w * U), 0],
      eventOptions: { passive: false },
      enabled: !readOnly,
    }
  );

  // Desktop wheel resize when selected
  useEffect(() => {
    const el = ref.current;
    if (!el || !selected || readOnly) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.5;
      const ratio = (state.width + delta) / state.width;
      const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, state.width * ratio));
      const newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, state.height * ratio));
      onChange({ ...state, width: newW, height: newH });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [selected, state, onChange, readOnly]);

  // Corner resize handle (desktop)
  const handleResize = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly) return;
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = state.width;
      const startH = state.height;
      onSelect();

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const delta = Math.max(dx, dy);
        const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, startW + delta));
        const newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, startH + delta * (startH / startW)));
        onChange({ ...state, width: newW, height: newH });
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [state, onChange, onSelect, readOnly]
  );

  const content = item ? (
    <img
      src={item.imageBase64}
      alt={item.type}
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center" style={{ opacity: 0.4 }}>
      <span style={{ fontSize: Math.min(state.width, state.height) * 0.4 }}>{SLOT_ICONS[def.id]}</span>
    </div>
  );

  return (
    <div
      ref={ref}
      onPointerDown={readOnly ? undefined : onSelect}
      style={{
        position: 'absolute',
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
        touchAction: readOnly ? 'auto' : 'none',
        cursor: readOnly ? 'default' : 'grab',
        border: readOnly ? 'none' : (selected ? '1.5px solid #C9956C' : '1.5px dashed #9ca3af'),
        borderRadius: 8,
        overflow: 'hidden',
        background: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {content}
      {!readOnly && selected && (
        <div
          onPointerDown={handleResize}
          style={{
            position: 'absolute',
            right: -6,
            bottom: -6,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: '#C9956C',
            cursor: 'nwse-resize',
            touchAction: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      )}
    </div>
  );
}

export default function OutfitLayout({
  h1, h2, h3,
  bas, isRobe,
  chaussures, sac,
  ceinture, echarpe, bijoux, couvre_chef,
  debugMode = false,
  readOnly = false,
  initialLayoutData = null,
  onLayoutChange,
}: OutfitLayoutProps) {
  // Calcul direct du template à chaque render (pas de useMemo)
  const template = selectTemplate({ h1, h2, h3, bas, isRobe });

  // Build the list of pieces to render based on template + provided items
  const pieces = buildPieces(template, { h1, h2, h3, bas, chaussures, sac, ceinture, echarpe, bijoux, couvre_chef });

  const [states, setStates] = useState<Record<string, PieceState>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const zCounter = useRef(10);

  // Signature basée sur les IDs des items (pas sur les références objets)
  const piecesSignature = [h1?.id, h2?.id, h3?.id, bas?.id, chaussures?.id, sac?.id, ceinture?.id, echarpe?.id, bijoux?.id, couvre_chef?.id].join('|');

  // Reset complet des positions quand la composition de la tenue change
  useEffect(() => {
    const next: Record<string, PieceState> = {};
    const tpl = selectTemplate({ h1, h2, h3, bas, isRobe });
    const newPieces = buildPieces(tpl, { h1, h2, h3, bas, chaussures, sac, ceinture, echarpe, bijoux, couvre_chef });
    for (const p of newPieces) next[p.key] = initialState(p.def);
    // Restore from initialLayoutData if provided (drag positions saved earlier)
    if (initialLayoutData?.pieces?.length) {
      const byItemId: Record<string, ClothingItem | undefined> = {
        [h1?.id ?? '__h1']: h1,
        [h2?.id ?? '__h2']: h2,
        [h3?.id ?? '__h3']: h3,
        [bas?.id ?? '__bas']: bas,
        [chaussures?.id ?? '__c']: chaussures,
        [sac?.id ?? '__s']: sac,
        [ceinture?.id ?? '__ce']: ceinture,
        [echarpe?.id ?? '__e']: echarpe,
        [bijoux?.id ?? '__b']: bijoux,
        [couvre_chef?.id ?? '__cc']: couvre_chef,
      };
      // map itemId -> piece key
      const itemKeyMap: Record<string, string> = {};
      for (const p of newPieces) if (p.item) itemKeyMap[p.item.id] = p.key;
      for (const saved of initialLayoutData.pieces) {
        const k = itemKeyMap[saved.itemId];
        if (!k || !next[k]) continue;
        next[k] = {
          x: saved.x,
          y: saved.y,
          width: saved.size,
          height: next[k].height * (saved.size / next[k].width),
          zIndex: saved.z || 1,
        };
      }
    }
    setStates(next);
    setSelectedKey(null);
    zCounter.current = 10;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piecesSignature]);

  // Notify parent on state change (debounced upstream if needed)
  const onLayoutChangeRef = useRef(onLayoutChange);
  onLayoutChangeRef.current = onLayoutChange;
  useEffect(() => {
    if (readOnly || !onLayoutChangeRef.current) return;
    if (Object.keys(states).length === 0) return;
    const piecesData = pieces
      .filter(p => p.item && states[p.key])
      .map(p => ({
        itemId: p.item!.id,
        x: states[p.key].x,
        y: states[p.key].y,
        size: states[p.key].width,
        z: states[p.key].zIndex,
      }));
    onLayoutChangeRef.current({ canvasW: W, canvasH: H, pieces: piecesData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, readOnly]);


  const updateState = useCallback((key: string, next: PieceState) => {
    setStates(prev => ({ ...prev, [key]: next }));
  }, []);

  const select = useCallback((key: string) => {
    setSelectedKey(key);
    zCounter.current += 1;
    const z = zCounter.current;
    setStates(prev => prev[key] ? { ...prev, [key]: { ...prev[key], zIndex: z } } : prev);
  }, []);

  const reset = useCallback(() => {
    const next: Record<string, PieceState> = {};
    for (const p of pieces) next[p.key] = initialState(p.def);
    setStates(next);
    setSelectedKey(null);
    zCounter.current = 10;
  }, [pieces]);

  // Suggestions text under the grid
  const suggestions: string[] = [];
  if (!chaussures) suggestions.push('💡 Pense à ajouter une paire de chaussures');
  if (!sac) suggestions.push('💡 Pense à ajouter un sac');

  if (debugMode) {
    return (
      <div className="flex flex-col items-center w-full">
        <div
          className="relative mx-auto"
          style={{ width: W, height: H, maxWidth: '100%' }}
        >
          {(Object.entries(template) as [SlotId, SlotDef][]).map(([id, def]) => (
            <DebugSlot key={id} def={def} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative mx-auto"
        onPointerDown={(e) => {
          if (readOnly) return;
          if (e.target === e.currentTarget) setSelectedKey(null);
        }}
        style={{
          width: W,
          height: H,
          maxWidth: '100%',
          touchAction: readOnly ? 'auto' : 'none',
          overflow: 'hidden',
        }}
      >
        {pieces.map(p => {
          const st = states[p.key];
          if (!st) return null;
          return (
            <DraggablePiece
              key={p.key}
              config={p}
              state={st}
              onChange={(next) => updateState(p.key, next)}
              onSelect={() => select(p.key)}
              selected={selectedKey === p.key}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={reset}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Réinitialiser
        </button>
      )}

      {suggestions.length > 0 && (
        <div className="mt-3 space-y-1 text-center">
          {suggestions.map((s, i) => (
            <p key={i} className="text-xs text-muted-foreground">{s}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Helper : map un tableau de ClothingItem vers les slots d'OutfitLayout
 * en se basant sur la catégorie / le type.
 */
export function mapItemsToLayout(items: ClothingItem[]): OutfitLayoutProps {
  const props: OutfitLayoutProps = {};

  for (const item of items) {
    const catName = getCategoryByType(item.type)?.name || item.category || '';
    const typeLower = (item.type || '').toLowerCase();

    // Pièce unique → bas avec flag isRobe
    if (catName === 'Robes & combinaisons') {
      if (!props.bas) { props.bas = item; props.isRobe = true; }
      continue;
    }
    // Bas classique
    if (catName === 'Bas' || catName === 'Jupes') {
      if (!props.bas) { props.bas = item; props.isRobe = false; }
      continue;
    }
    // Couche externe (veste, manteau)
    if (catName === 'Manteaux & vestes') {
      if (!props.h3) props.h3 = item;
      continue;
    }
    // Couche intermédiaire (pull, sweat)
    if (catName === 'Pulls & sweats') {
      if (!props.h2) props.h2 = item;
      continue;
    }
    // Couche de base (top, chemise, haut)
    if (catName === 'Hauts') {
      if (!props.h1) props.h1 = item;
      continue;
    }
    // Chaussures
    if (catName === 'Chaussures') {
      if (!props.chaussures) props.chaussures = item;
      continue;
    }
    // Sacs
    if (catName === 'Sacs') {
      if (!props.sac) props.sac = item;
      continue;
    }
    // Accessoires
    if (catName === 'Accessoires') {
      if (typeLower.includes('ceinture')) {
        if (!props.ceinture) props.ceinture = item;
      } else if (typeLower.includes('écharpe') || typeLower.includes('echarpe') || typeLower.includes('foulard') || typeLower.includes('châle') || typeLower.includes('chale')) {
        if (!props.echarpe) props.echarpe = item;
      } else if (typeLower.includes('chapeau') || typeLower.includes('casquette') || typeLower.includes('béret') || typeLower.includes('beret') || typeLower.includes('bonnet')) {
        if (!props.couvre_chef) props.couvre_chef = item;
      } else {
        if (!props.bijoux) props.bijoux = item;
      }
      continue;
    }
  }

  return props;
}
