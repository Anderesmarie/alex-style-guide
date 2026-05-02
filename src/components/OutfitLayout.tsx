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
  | 'ACEN' | 'A1' | 'A2' | 'A3';

interface SlotDef {
  id: SlotId;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string;
  required?: boolean;
  suggestion?: boolean;
  suggestionText?: string;
}

const SLOTS: Record<SlotId, SlotDef> = {
  H1:   { id: 'H1',   x: 14, y: 39, w: 9,  h: 9,  icon: '👕', required: true },
  H2:   { id: 'H2',   x: 3,  y: 39, w: 9,  h: 9,  icon: '👕' },
  H3:   { id: 'H3',   x: 25, y: 39, w: 9,  h: 9,  icon: '👕' },
  B:    { id: 'B',    x: 14, y: 17, w: 9,  h: 18, icon: '👖', required: true },
  ACH:  { id: 'ACH',  x: 14, y: 4,  w: 9,  h: 9,  icon: '👟', suggestion: true, suggestionText: 'Pense à ajouter une paire de chaussures' },
  ASAC: { id: 'ASAC', x: 25, y: 21, w: 9,  h: 9,  icon: '👜', suggestion: true, suggestionText: 'Pense à ajouter un sac' },
  ACEN: { id: 'ACEN', x: 26, y: 10, w: 7,  h: 7,  icon: '〰️' },
  A1:   { id: 'A1',   x: 4,  y: 16, w: 7,  h: 7,  icon: '🧣' },
  A2:   { id: 'A2',   x: 2,  y: 27, w: 7,  h: 7,  icon: '💍' },
  A3:   { id: 'A3',   x: 2,  y: 5,  w: 7,  h: 7,  icon: '🎩' },
};

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
  ACEN: '#facc15', A1: '#facc15', A2: '#facc15', A3: '#facc15',
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

interface SlotBoxProps {
  def: SlotDef;
  item?: ClothingItem;
}

function SlotBox({ def, item }: SlotBoxProps) {
  const left = def.x * U;
  const top = (ROWS - def.y - def.h) * U;
  const width = def.w * U;
  const height = def.h * U;

  // Empty + not required + not suggestion → render nothing
  if (!item && !def.required && !def.suggestion) return null;

  // Filled
  if (item) {
    return (
      <div
        className="absolute flex flex-col items-center justify-center bg-white"
        style={{
          left,
          top,
          width,
          height,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 4,
          overflow: 'hidden',
        }}
      >
        {item.imageBase64 ? (
          <img
            src={item.imageBase64}
            alt={item.type}
            className="w-full h-full object-contain"
          />
        ) : (
          <span style={{ fontSize: Math.min(width, height) * 0.45 }}>
            {def.icon}
          </span>
        )}
      </div>
    );
  }

  // Empty required (H1, B) — dashed
  if (def.required) {
    return (
      <div
        className="absolute flex items-center justify-center"
        style={{
          left,
          top,
          width,
          height,
          border: '1.5px dashed #d1d5db',
          borderRadius: 8,
          background: 'transparent',
        }}
      >
        <span style={{ fontSize: Math.min(width, height) * 0.4, opacity: 0.4 }}>
          {def.icon}
        </span>
      </div>
    );
  }

  // Empty suggestion (ACH, ASAC) — dashed with "?"
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left,
        top,
        width,
        height,
        border: '1.5px dashed #d1d5db',
        borderRadius: 8,
        background: 'transparent',
        color: '#9ca3af',
        fontSize: 22,
        fontWeight: 500,
      }}
    >
      ?
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
  // Suggestions text under the grid
  const suggestions: string[] = [];
  if (!chaussures) suggestions.push('💡 ' + SLOTS.ACH.suggestionText);
  if (!sac) suggestions.push('💡 ' + SLOTS.ASAC.suggestionText);

  if (debugMode) {
    return (
      <div className="flex flex-col items-center w-full">
        <div
          className="relative mx-auto"
          style={{ width: W, height: H, maxWidth: '100%' }}
        >
          {(Object.keys(SLOTS) as SlotId[]).map(id => (
            <DebugSlot key={id} def={SLOTS[id]} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative mx-auto"
        style={{ width: W, height: H, maxWidth: '100%' }}
      >
        {/* Required + suggestion slots first (so filled overlap won't matter) */}
        <SlotBox def={SLOTS.H1} item={h1} />
        <SlotBox def={SLOTS.B} item={bas} />
        <SlotBox def={SLOTS.ACH} item={chaussures} />
        <SlotBox def={SLOTS.ASAC} item={sac} />

        {/* Optional tops — only if provided */}
        {h2 && <SlotBox def={SLOTS.H2} item={h2} />}
        {h3 && <SlotBox def={SLOTS.H3} item={h3} />}

        {/* Accessories — invisible if absent */}
        {ceinture && <SlotBox def={SLOTS.ACEN} item={ceinture} />}
        {echarpe && <SlotBox def={SLOTS.A1} item={echarpe} />}
        {bijoux && <SlotBox def={SLOTS.A2} item={bijoux} />}
        {couvre_chef && <SlotBox def={SLOTS.A3} item={couvre_chef} />}
      </div>

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
