import { ClothingItem, OutfitLayoutData } from '@/lib/types';
import { getCategoryForType, getSubcategoryForType } from '@/lib/dressingTaxonomy';

type SlotCat = 'Hauts' | 'Pulls' | 'Bas' | 'Robes' | 'Manteaux' | 'Chaussures' | 'Sacs' | 'Bijoux' | 'Accessoires' | 'Autre';

function slotCategoryOf(item: ClothingItem): SlotCat {
  const cat = getCategoryForType(item.type)?.key || item.category || '';
  // Legacy compat (anciens noms BDD)
  if (cat === 'Robes' || cat === 'Robes & combinaisons') return 'Robes';
  if (cat === 'Manteaux' || cat === 'Manteaux & vestes') return 'Manteaux';
  if (cat === 'Bas' || cat === 'Jupes') return 'Bas';
  if (cat === 'Chaussures') return 'Chaussures';
  if (cat === 'Sacs') return 'Sacs';
  if (cat === 'Bijoux') return 'Bijoux';
  if (cat === 'Accessoires') return 'Accessoires';
  if (cat === 'Hauts' || cat === 'Pulls & sweats') {
    // Distinguer pulls/mailles des autres hauts via la sous-catégorie
    const sub = getSubcategoryForType(item.type)?.subcategory.key || item.subcategory || '';
    if (sub === 'Pulls & Mailles' || cat === 'Pulls & sweats') return 'Pulls';
    return 'Hauts';
  }
  return 'Autre';
}

/**
 * Grille 36×50, U=10px, Y inversé (Y=0 en bas).
 * left = x * U
 * top  = (50 - y - h) * U
 * width = w * U
 * height = h * U
 *
 * Rendu en pourcentages dans un conteneur d'aspect-ratio 36/50,
 * max-width 360px, pour rester responsive tout en respectant la grille.
 */

const GRID_W = 36;
const GRID_H = 50;

export type SlotName = 'H1' | 'H2' | 'H3' | 'B' | 'ACH' | 'ASAC' | 'A1';
type Cell = { id: string; x: number; y: number; w: number; h: number };

const TEMPLATES = {
  // Template H/B — Haut + Bas (pantalon, jupe)
  HB: {
    H1:   { id:'H1',   x:2,  y:33, w:16, h:15 },
    H2:   { id:'H2',   x:19, y:16, w:15, h:15 },
    H3:   { id:'H3',   x:19, y:32, w:15, h:16 },
    B:    { id:'B',    x:2,  y:12, w:16, h:22 },
    ACH:  { id:'ACH',  x:2,  y:1,  w:12, h:11 },
    ASAC: { id:'ASAC', x:23, y:1,  w:12, h:11 },
    A1:   { id:'A1',   x:14, y:2,  w:9,  h:8  },
  },
  // Template R/C — Robe ou Combinaison (pièce unique)
  RC: {
    B:    { id:'B',    x:2,  y:13, w:16, h:35 },
    H3:   { id:'H3',   x:18, y:32, w:16, h:15 },
    H2:   { id:'H2',   x:18, y:17, w:16, h:15 },
    ACH:  { id:'ACH',  x:2,  y:2,  w:12, h:11 },
    A1:   { id:'A1',   x:14, y:2,  w:9,  h:8  },
    ASAC: { id:'ASAC', x:23, y:2,  w:12, h:11 },
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

function categoryOf(item: ClothingItem): SlotCat {
  return slotCategoryOf(item);
}

function selectTemplate(items: ClothingItem[]): TemplateKey {
  const isRobe = items.some(it => categoryOf(it) === 'Robes');
  return isRobe ? 'RC' : 'HB';
}

function mapItemsToLayout(items: ClothingItem[], tpl: TemplateKey): Partial<Record<SlotName, ClothingItem>> {
  const slots: Partial<Record<SlotName, ClothingItem>> = {};
  let accessoryUsed = false;
  for (const item of items) {
    const cat = categoryOf(item);
    if (tpl === 'RC' && cat === 'Robes') {
      if (!slots.B) slots.B = item;
    } else if (tpl === 'HB' && cat === 'Bas') {
      if (!slots.B) slots.B = item;
    } else if (cat === 'Hauts') {
      if (!slots.H1) slots.H1 = item;
    } else if (cat === 'Pulls') {
      if (!slots.H2) slots.H2 = item;
    } else if (cat === 'Manteaux') {
      if (!slots.H3) slots.H3 = item;
    } else if (cat === 'Chaussures') {
      if (!slots.ACH) slots.ACH = item;
    } else if (cat === 'Sacs') {
      if (!slots.ASAC) slots.ASAC = item;
    } else if ((cat === 'Accessoires' || cat === 'Bijoux') && !accessoryUsed) {
      slots.A1 = item;
      accessoryUsed = true;
    }
  }
  return slots;
}

interface Props {
  items: ClothingItem[];
  /** Si fourni, prime sur le template (positions libres x%/y%/w%/h%/z). */
  layoutData?: OutfitLayoutData | null;
  /** readOnly = pas de drag, pas de resize, placement fixe via template. */
  readOnly?: boolean;
  className?: string;
}

export default function OutfitLayout({ items, layoutData, readOnly = true, className = '' }: Props) {
  void readOnly;

  // ---------- Render depuis layoutData ----------
  if (layoutData && layoutData.pieces && layoutData.pieces.length > 0) {
    const byId = new Map(items.map(it => [it.id, it]));
    const sorted = [...layoutData.pieces].sort((a, b) => a.z - b.z);
    const cw = layoutData.canvasW || 360;
    const ch = layoutData.canvasH || 500;
    return (
      <div
        className={`relative mx-auto rounded-2xl overflow-hidden ${className}`}
        style={{
          width: '100%',
          maxWidth: 360,
          aspectRatio: `${cw} / ${ch}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {sorted.map((p, i) => {
          const item = byId.get(p.itemId);
          if (!item) return null;
          const wPct = p.w ?? (p.size ? (p.size / cw) * 100 : 30);
          const hPct = p.h ?? wPct * (cw / ch);
          return (
            <div
              key={p.itemId + i}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${wPct}%`,
                height: `${hPct}%`,
                zIndex: p.z + 1,
              }}
            >
              <img
                src={item.imageBase64}
                alt={item.type}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // ---------- Render depuis template ----------
  const tpl = selectTemplate(items);
  const template = TEMPLATES[tpl];
  const slots = mapItemsToLayout(items, tpl);

  const order: SlotName[] = tpl === 'RC'
    ? ['B', 'H2', 'H3', 'ACH', 'A1', 'ASAC']
    : ['B', 'H1', 'H2', 'H3', 'ACH', 'A1', 'ASAC'];

  return (
    <div
      className={`relative mx-auto bg-white rounded-2xl overflow-hidden ${className}`}
      style={{
        width: '100%',
        maxWidth: 360,
        aspectRatio: `${GRID_W} / ${GRID_H}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {order.map((k, i) => {
        const item = slots[k];
        const cell = template[k];
        if (!item || !cell) return null;
        const leftPct = (cell.x / GRID_W) * 100;
        const topPct = ((GRID_H - cell.y - cell.h) / GRID_H) * 100;
        const widthPct = (cell.w / GRID_W) * 100;
        const heightPct = (cell.h / GRID_H) * 100;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              zIndex: i + 1,
            }}
          >
            <img
              src={item.imageBase64}
              alt={item.type}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ---------- Helpers exportés pour l'éditeur ----------
export const LAYOUT_GRID = { W: GRID_W, H: GRID_H };
export const LAYOUT_TEMPLATES = TEMPLATES;
export function selectTemplateForItems(items: ClothingItem[]): TemplateKey {
  return selectTemplate(items);
}
export function categoryOfItem(item: ClothingItem): string {
  return categoryOf(item);
}
