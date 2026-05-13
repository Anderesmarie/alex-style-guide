import { EngineInput, OutfitCandidate } from './types';
import { ClothingItem } from '../types';
import { generateCombinations } from './combinations';
import { applyFilters } from './filters';
import { applyScoring } from './scoring';

const REMOVABLE_LAYERS = ['Blazer', 'Veste en jean', 'Trench', 'Bomber', 'Cardigan', 'Veste militaire', 'Veste coupe-vent'];
const DRESSY_STYLES = ['Old Money', 'Chic', 'Romantique', 'Preppy', 'Casual chic'];
const CASUAL_STYLES = ['Streetwear', 'Sportswear', 'Grunge', 'Y2K', 'Casual'];

function getMainPieceId(c: OutfitCandidate): string | null {
  const robe = c.items.find(i => i.category === 'Robes');
  if (robe) return robe.id;
  const haut = c.items.find(i => i.category === 'Hauts');
  return haut?.id ?? null;
}

function getBottomId(c: OutfitCandidate): string | null {
  const bas = c.items.find(i => i.category === 'Bas');
  return bas?.id ?? null;
}

function getShoesId(c: OutfitCandidate): string | null {
  const sh = c.items.find(i => i.category === 'Chaussures');
  return sh?.id ?? null;
}

function getCoatId(c: OutfitCandidate): string | null {
  const co = c.items.find(i => i.category === 'Manteaux' || i.category === 'Manteaux & vestes');
  return co?.id ?? null;
}

function getBagId(c: OutfitCandidate): string | null {
  const bag = c.items.find(i => i.category === 'Sacs' || i.category === 'Accessoires' && (i.subcategory || '').toLowerCase().includes('sac'));
  return bag?.id ?? null;
}

function hasRemovableLayer(c: OutfitCandidate): boolean {
  return c.items.some(i => REMOVABLE_LAYERS.includes(i.type));
}

function outfitVibe(c: OutfitCandidate): 'casual' | 'dressy' | 'mid' {
  let dressy = 0;
  let casual = 0;
  for (const it of c.items) {
    for (const s of it.style ?? []) {
      if (DRESSY_STYLES.includes(s)) dressy++;
      if (CASUAL_STYLES.includes(s)) casual++;
    }
  }
  if (dressy > casual + 1) return 'dressy';
  if (casual > dressy + 1) return 'casual';
  return 'mid';
}

function pickDiverse(sorted: OutfitCandidate[], input: EngineInput): OutfitCandidate[] {
  if (sorted.length === 0) return [];
  const picked: OutfitCandidate[] = [sorted[0]];
  const needLayer = input.amplitude >= 8;

  const tryPick = (predicate: (c: OutfitCandidate) => boolean) => {
    for (const c of sorted) {
      if (picked.includes(c)) continue;
      if (predicate(c)) {
        picked.push(c);
        return true;
      }
    }
    return false;
  };

  // Tenue 2: main piece + bottom différent de tenue 1
  tryPick(c => {
    const m1 = getMainPieceId(picked[0]);
    const b1 = getBottomId(picked[0]);
    return getMainPieceId(c) !== m1 && (b1 == null || getBottomId(c) !== b1);
  }) || tryPick(c => getMainPieceId(c) !== getMainPieceId(picked[0]));

  if (picked.length < 2) return picked;

  // Tenue 3: aucune pièce ne doit apparaître dans les 3 tenues simultanément
  const ids1 = new Set(picked[0].items.map(i => i.id));
  const ids2 = new Set(picked[1].items.map(i => i.id));
  const sharedByBoth = new Set([...ids1].filter(id => ids2.has(id)));
  const shoes1 = getShoesId(picked[0]);
  const shoes2 = getShoesId(picked[1]);
  const coat1 = getCoatId(picked[0]);
  const coat2 = getCoatId(picked[1]);
  const bag1 = getBagId(picked[0]);
  const bag2 = getBagId(picked[1]);
  tryPick(c => {
    const m = getMainPieceId(c);
    const b = getBottomId(c);
    const s = getShoesId(c);
    const co = getCoatId(c);
    const bg = getBagId(c);
    if (m === getMainPieceId(picked[0]) || m === getMainPieceId(picked[1])) return false;
    if (b && (b === getBottomId(picked[0]) || b === getBottomId(picked[1]))) return false;
    if (s && shoes1 === s && shoes2 === s) return false;
    if (co && coat1 === co && coat2 === co) return false;
    if (bg && bag1 === bg && bag2 === bg) return false;
    // Aucune pièce de la tenue ne doit déjà être dans les DEUX autres
    if (c.items.some(it => sharedByBoth.has(it.id))) return false;
    return true;
  }) || tryPick(c => {
    // Fallback : au minimum aucune pièce partagée par les 3
    return !c.items.some(it => sharedByBoth.has(it.id));
  }) || tryPick(c => {
    const m = getMainPieceId(c);
    return m !== getMainPieceId(picked[0]) && m !== getMainPieceId(picked[1]);
  }) || tryPick(() => true);

  // Garantir au moins une tenue avec couche amovible si amplitude >= 8
  if (needLayer && !picked.some(hasRemovableLayer)) {
    const layered = sorted.find(c => !picked.includes(c) && hasRemovableLayer(c));
    if (layered && picked.length === 3) {
      // remplacer la tenue 3 (la moins prioritaire) si pas de couche
      picked[2] = layered;
    } else if (layered) {
      picked.push(layered);
    }
  }

  // Préférer diversité de vibes (casual / dressy / mid) sans dégrader trop le score
  const vibes = picked.map(outfitVibe);
  const uniqueVibes = new Set(vibes).size;
  if (picked.length === 3 && uniqueVibes < 2) {
    const currentMains = picked.map(getMainPieceId);
    const targetVibe: 'casual' | 'dressy' | 'mid' = vibes[0] === 'casual' ? 'dressy' : 'casual';
    const swap = sorted.find(c =>
      !picked.includes(c) &&
      outfitVibe(c) === targetVibe &&
      !currentMains.slice(0, 2).includes(getMainPieceId(c))
    );
    if (swap) picked[2] = swap;
  }

  return picked;
}

export function generateOutfits(input: EngineInput): OutfitCandidate[] {
  const combos = generateCombinations(input.wardrobe);

  const valid: OutfitCandidate[] = [];
  for (const items of combos) {
    const base: OutfitCandidate = {
      items,
      score: 0,
      reasons: [],
      blocked: false,
    };
    const filtered = applyFilters(base, input);
    if (filtered.blocked) continue;
    const scored = applyScoring(filtered, input);
    valid.push(scored);
  }

  valid.sort((a, b) => b.score - a.score);
  return pickDiverse(valid, input);
}

export * from './types';
