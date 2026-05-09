import { ClothingItem } from '@/lib/types';
import { getCategoryByType } from '@/lib/categories';

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
type Cell = { x: number; y: number; w: number; h: number };

// Template HB (haut + bas)
const TEMPLATE_HB: Partial<Record<SlotName, Cell>> = {
  H1:   { x: 0,  y: 34, w: 16, h: 16 }, // Haut base
  H2:   { x: 21, y: 15, w: 15, h: 16 }, // Couche intermédiaire
  H3:   { x: 21, y: 34, w: 15, h: 16 }, // Couche externe
  B:    { x: 0,  y: 10, w: 16, h: 24 }, // Bas
  ACH:  { x: 0,  y: 0,  w: 11, h: 10 }, // Chaussures
  ASAC: { x: 25, y: 0,  w: 11, h: 10 }, // Sac
  A1:   { x: 13, y: 0,  w: 11, h: 10 }, // Accessoire
};

// Template RH (robe / combinaison)
const TEMPLATE_RH: Partial<Record<SlotName, Cell>> = {
  B:    { x: 0,  y: 13, w: 18, h: 34 }, // Robe / combinaison
  H3:   { x: 19, y: 34, w: 17, h: 16 }, // Couche externe
  H2:   { x: 19, y: 16, w: 17, h: 16 }, // Couche intermédiaire
  ACH:  { x: 0,  y: 0,  w: 12, h: 11 }, // Chaussures
  A1:   { x: 12, y: 0,  w: 12, h: 11 }, // Accessoire
  ASAC: { x: 24, y: 0,  w: 12, h: 11 }, // Sac
};

type TemplateKey = 'HB' | 'RH';

function categoryOf(item: ClothingItem): string {
  return getCategoryByType(item.type)?.name || item.category || '';
}

function pickTemplate(items: ClothingItem[]): TemplateKey {
  const hasDress = items.some(it => categoryOf(it) === 'Robes & combinaisons');
  return hasDress ? 'RH' : 'HB';
}

function mapToSlots(items: ClothingItem[], tpl: TemplateKey): Partial<Record<SlotName, ClothingItem>> {
  const slots: Partial<Record<SlotName, ClothingItem>> = {};
  let accessoryUsed = false;
  for (const item of items) {
    const cat = categoryOf(item);
    if (tpl === 'RH' && cat === 'Robes & combinaisons') {
      if (!slots.B) slots.B = item;
    } else if (tpl === 'HB' && (cat === 'Bas' || cat === 'Jupes')) {
      if (!slots.B) slots.B = item;
    } else if (cat === 'Hauts') {
      if (!slots.H1) slots.H1 = item;
    } else if (cat === 'Pulls & sweats') {
      if (!slots.H2) slots.H2 = item;
    } else if (cat === 'Manteaux & vestes') {
      if (!slots.H3) slots.H3 = item;
    } else if (cat === 'Chaussures') {
      if (!slots.ACH) slots.ACH = item;
    } else if (cat === 'Sacs') {
      if (!slots.ASAC) slots.ASAC = item;
    } else if (cat === 'Accessoires' && !accessoryUsed) {
      slots.A1 = item;
      accessoryUsed = true;
    }
  }
  return slots;
}

interface Props {
  items: ClothingItem[];
  /** readOnly = pas de drag, pas de resize, placement fixe via template. */
  readOnly?: boolean;
  /** Hauteur indicative — en réalité on suit l'aspect-ratio 36/50. */
  className?: string;
}

export default function OutfitLayout({ items, readOnly = true, className = '' }: Props) {
  const tpl = pickTemplate(items);
  const template = tpl === 'RH' ? TEMPLATE_RH : TEMPLATE_HB;
  const slots = mapToSlots(items, tpl);

  // Note: readOnly=false (drag & drop) sera géré séparément par la page Tenues
  // via OutfitFreeCanvas. Ici on rend toujours en placement fixe.
  void readOnly;

  const order: SlotName[] = tpl === 'RH'
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
