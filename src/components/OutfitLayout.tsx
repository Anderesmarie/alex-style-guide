import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDrag, usePinch } from '@use-gesture/react';
import { ClothingItem } from '@/lib/types';
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

type SlotId =
  | 'H1' | 'H2' | 'H3'
  | 'B'
  | 'ACH' | 'ASAC'
  | 'ACC'
  | 'A1' | 'A2' | 'A3';

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
  ACC: '🎩',
  A1: '🧣', A2: '💍', A3: '💍',
};

const TEMPLATES: Record<string, Partial<Record<SlotId, SlotDef>>> = {
  H1BTACC: {
    H1:   { id:'H1',   x:11, y:35, w:15, h:15 },
    B:    { id:'B',    x:12, y:10, w:13, h:25 },
    ACH:  { id:'ACH',  x:13, y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:17, w:11, h:10 },
    A1:   { id:'A1',   x:0,  y:32, w:9,  h:9  },
    ACC:  { id:'ACC',  x:0,  y:17, w:9,  h:8  },
    A2:   { id:'A2',   x:0,  y:9,  w:9,  h:8  },
    A3:   { id:'A3',   x:0,  y:1,  w:9,  h:8  },
  },
  H1H3BTAC: {
    H1:   { id:'H1',   x:0,  y:35, w:14, h:15 },
    H3:   { id:'H3',   x:22, y:35, w:14, h:15 },
    B:    { id:'B',    x:12, y:10, w:13, h:25 },
    ACH:  { id:'ACH',  x:13, y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:17, w:11, h:10 },
    A1:   { id:'A1',   x:0,  y:25, w:9,  h:9  },
    ACC:  { id:'ACC',  x:0,  y:17, w:9,  h:8  },
    A2:   { id:'A2',   x:0,  y:9,  w:9,  h:8  },
    A3:   { id:'A3',   x:0,  y:1,  w:9,  h:8  },
  },
  H1H2H3TACC: {
    H2:   { id:'H2',   x:0,  y:36, w:14, h:14 },
    H1:   { id:'H1',   x:11, y:22, w:14, h:14 },
    H3:   { id:'H3',   x:22, y:36, w:14, h:14 },
    B:    { id:'B',    x:11, y:0,  w:14, h:22 },
    ACH:  { id:'ACH',  x:25, y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:19, w:11, h:10 },
    A1:   { id:'A1',   x:0,  y:25, w:9,  h:9  },
    ACC:  { id:'ACC',  x:0,  y:17, w:9,  h:8  },
    A2:   { id:'A2',   x:0,  y:9,  w:9,  h:8  },
    A3:   { id:'A3',   x:0,  y:1,  w:9,  h:8  },
  },
  H3RTACC: {
    H3:   { id:'H3',   x:9,  y:34, w:16, h:16 },
    B:    { id:'B',    x:9,  y:0,  w:16, h:34 },
    ACH:  { id:'ACH',  x:25, y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:19, w:11, h:10 },
    A1:   { id:'A1',   x:0,  y:24, w:9,  h:9  },
    ACC:  { id:'ACC',  x:0,  y:16, w:9,  h:8  },
    A2:   { id:'A2',   x:0,  y:8,  w:9,  h:8  },
    A3:   { id:'A3',   x:0,  y:0,  w:9,  h:8  },
  },
  H2H3RTACC: {
    H2:   { id:'H2',   x:0,  y:33, w:17, h:17 },
    H3:   { id:'H3',   x:19, y:33, w:17, h:17 },
    B:    { id:'B',    x:9,  y:0,  w:16, h:33 },
    ACH:  { id:'ACH',  x:25, y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:19, w:11, h:10 },
    A1:   { id:'A1',   x:0,  y:16, w:9,  h:9  },
    ACC:  { id:'ACC',  x:0,  y:25, w:9,  h:8  },
    A2:   { id:'A2',   x:0,  y:8,  w:9,  h:8  },
    A3:   { id:'A3',   x:0,  y:0,  w:9,  h:8  },
  },
  RTACC: {
    B:    { id:'B',    x:9,  y:3,  w:16, h:38 },
    ACH:  { id:'ACH',  x:25, y:0,  w:11, h:10 },
    ASAC: { id:'ASAC', x:25, y:19, w:11, h:10 },
    A1:   { id:'A1',   x:0,  y:39, w:9,  h:9  },
    ACC:  { id:'ACC',  x:0,  y:16, w:9,  h:8  },
    A2:   { id:'A2',   x:0,  y:8,  w:9,  h:8  },
    A3:   { id:'A3',   x:0,  y:0,  w:9,  h:8  },
  },
};

function selectTemplate(props: OutfitLayoutPropsLike): Partial<Record<SlotId, SlotDef>> {
  const { h1, h2, h3, bas } = props;
  const hasTop = h1 || h2 || h3;
  const topCount = [h1, h2, h3].filter(Boolean).length;
  // Robe seule (pas de haut)
  if (!hasTop && bas) return TEMPLATES.RTACC;
  // 2 vestes + Robe : H2 + H3 sans H1
  if (!h1 && h2 && h3 && bas) return TEMPLATES.H2H3RTACC;
  // 1 veste + Robe : H3 sans H1 ni H2
  if (!h1 && !h2 && h3 && bas) return TEMPLATES.H3RTACC;
  // 3 hauts + bas
  if (topCount === 3 && bas) return TEMPLATES.H1H2H3TACC;
  // 2 hauts + bas
  if (topCount === 2 && bas) return TEMPLATES.H1H3BTAC;
  // 1 haut + bas (défaut)
  return TEMPLATES.H1BTACC;
}

interface OutfitLayoutPropsLike {
  h1?: ClothingItem; h2?: ClothingItem; h3?: ClothingItem; bas?: ClothingItem;
}

export interface OutfitLayoutProps {
  h1?: ClothingItem;
  h2?: ClothingItem;
  h3?: ClothingItem;
  bas?: ClothingItem;
  chaussures?: ClothingItem;
  sac?: ClothingItem;
  ceinture?: ClothingItem;
  echarpe?: ClothingItem;
  bijoux?: ClothingItem;
  couvre_chef?: ClothingItem;
  debugMode?: boolean;
}

const DEBUG_COLORS: Record<SlotId, string> = {
  H1: '#60a5fa', H2: '#60a5fa', H3: '#60a5fa',
  B: '#34d399',
  ACH: '#fb923c',
  ASAC: '#f472b6',
  ACC: '#a78bfa',
  A1: '#facc15', A2: '#facc15', A3: '#facc15',
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
}

function DraggablePiece({ config, state, onChange, onSelect, selected }: DraggablePieceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { def, item } = config;

  useDrag(
    ({ offset: [ox, oy], first }) => {
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
    }
  );

  usePinch(
    ({ offset: [scale], first }) => {
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
    }
  );

  // Desktop wheel resize when selected
  useEffect(() => {
    const el = ref.current;
    if (!el || !selected) return;
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
  }, [selected, state, onChange]);

  // Corner resize handle (desktop)
  const handleResize = useCallback(
    (e: React.PointerEvent) => {
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
    [state, onChange, onSelect]
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
      onPointerDown={onSelect}
      style={{
        position: 'absolute',
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
        touchAction: 'none',
        cursor: 'grab',
        border: selected ? '1.5px solid #C9956C' : '1.5px dashed #9ca3af',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {content}
      {selected && (
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
  bas,
  chaussures, sac,
  ceinture, echarpe, bijoux, couvre_chef,
  debugMode = false,
}: OutfitLayoutProps) {
  // Select template based on tops + bas
  const template = useMemo(
    () => selectTemplate({ h1, h2, h3, bas }),
    [h1, h2, h3, bas]
  );

  // Build the list of pieces to render based on template + provided items
  const pieces = useMemo<PieceConfig[]>(() => {
    const list: PieceConfig[] = [];
    const push = (key: string, slotId: SlotId, item?: ClothingItem) => {
      const def = template[slotId];
      if (!def || !item) return;
      list.push({ key, def, item });
    };

    push('H1', 'H1', h1);
    push('H2', 'H2', h2);
    push('H3', 'H3', h3);
    push('B', 'B', bas);
    push('ACH', 'ACH', chaussures);
    push('ASAC', 'ASAC', sac);

    // Couvre-chef → ACC (priorité)
    if (couvre_chef) push('ACC', 'ACC', couvre_chef);

    // Autres accessoires → A1, A2, A3 dans l'ordre
    const others = [echarpe, ceinture, bijoux].filter(Boolean) as ClothingItem[];
    const aSlots: SlotId[] = ['A1', 'A2', 'A3'];
    others.forEach((it, i) => {
      const sid = aSlots[i];
      if (sid) push(`ACC_${i}`, sid, it);
    });

    return list;
  }, [template, h1, h2, h3, bas, chaussures, sac, ceinture, echarpe, bijoux, couvre_chef]);

  const [states, setStates] = useState<Record<string, PieceState>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const zCounter = useRef(10);

  // Sync states when pieces list changes (add/remove items)
  useEffect(() => {
    setStates(prev => {
      const next: Record<string, PieceState> = {};
      for (const p of pieces) {
        next[p.key] = prev[p.key] ?? initialState(p.def);
      }
      return next;
    });
  }, [pieces]);

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
          if (e.target === e.currentTarget) setSelectedKey(null);
        }}
        style={{
          width: W,
          height: H,
          maxWidth: '100%',
          touchAction: 'none',
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
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Réinitialiser
      </button>

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
  const tops: ClothingItem[] = [];

  for (const item of items) {
    const catName = getCategoryByType(item.type)?.name || item.category || '';

    if (catName === 'Bas' || catName === 'Jupes' || catName === 'Robes & combinaisons') {
      if (!props.bas) props.bas = item;
      continue;
    }
    if (catName === 'Chaussures') {
      if (!props.chaussures) props.chaussures = item;
      continue;
    }
    if (catName === 'Sacs') {
      if (!props.sac) props.sac = item;
      continue;
    }
    if (catName === 'Hauts' || catName === 'Pulls & sweats' || catName === 'Manteaux & vestes') {
      tops.push(item);
      continue;
    }
    if (catName === 'Accessoires') {
      const t = (item.type || '').toLowerCase();
      if (t.includes('ceinture')) {
        if (!props.ceinture) props.ceinture = item;
      } else if (t.includes('écharpe') || t.includes('echarpe') || t.includes('foulard') || t.includes('châle') || t.includes('chale')) {
        if (!props.echarpe) props.echarpe = item;
      } else if (t.includes('chapeau') || t.includes('casquette') || t.includes('béret') || t.includes('beret') || t.includes('bonnet')) {
        if (!props.couvre_chef) props.couvre_chef = item;
      } else {
        if (!props.bijoux) props.bijoux = item;
      }
      continue;
    }
  }

  // Distribute tops into H1, H2, H3 (H1 is mandatory)
  if (tops[0]) props.h1 = tops[0];
  if (tops[1]) props.h2 = tops[1];
  if (tops[2]) props.h3 = tops[2];

  return props;
}
