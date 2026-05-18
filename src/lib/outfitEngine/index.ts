import { EngineInput, OutfitCandidate } from './types';
import { ClothingItem } from '../types';
import { generateCombinations } from './combinations';
import { applyFilters } from './filters';
import { applyScoring } from './scoring';

const REMOVABLE_LAYERS = ['Blazer', 'Veste en jean', 'Trench', 'Bomber', 'Cardigan', 'Veste militaire', 'Veste coupe-vent', 'Veste en cuir', 'Perfecto'];
const DRESSY_STYLES = ['Old Money', 'Chic', 'Romantique', 'Preppy', 'Casual chic'];
const CASUAL_STYLES = ['Streetwear', 'Sportswear', 'Grunge', 'Y2K', 'Casual'];
const ACCESSORY_CATEGORIES = ['Sacs', 'Accessoires', 'Bijoux'];

function isAccessory(it: ClothingItem): boolean {
  return ACCESSORY_CATEGORIES.includes(it.category);
}

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
  const needLayer = input.amplitude >= 8 || input.tempMin < 14;

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

  // Règle "max 1 robe sur 3 tenues" — appliquée seulement si la garde-robe
  // contient assez de combos non-robe pour la respecter sans vider la liste.
  const hasRobe = (c: OutfitCandidate) => c.items.some(i => i.category === 'Robes');
  const nonRobeAvailable = sorted.filter(c => !hasRobe(c)).length;
  const canLimitRobes = nonRobeAvailable >= 2;

  // Tenue 2: aucune pièce non-accessoire en commun avec tenue 1
  // + si tenue 1 = robe, forcer non-robe (si possible)
  const nonAccIds1 = new Set(picked[0].items.filter(i => !isAccessory(i)).map(i => i.id));
  const forceNonRobe2 = canLimitRobes && hasRobe(picked[0]);
  tryPick(c => (!forceNonRobe2 || !hasRobe(c)) && !c.items.some(it => !isAccessory(it) && nonAccIds1.has(it.id)))
    || tryPick(c => (!forceNonRobe2 || !hasRobe(c)) && getMainPieceId(c) !== getMainPieceId(picked[0]))
    || tryPick(c => !c.items.some(it => !isAccessory(it) && nonAccIds1.has(it.id)))
    || tryPick(c => getMainPieceId(c) !== getMainPieceId(picked[0]));

  if (picked.length < 2) return picked;

  // Tenue 3:
  // - aucune pièce non-accessoire en commun avec tenue 1 OU tenue 2
  // - aucun accessoire présent dans LES DEUX tenues précédentes (max 2 sur 3)
  const nonAccIds2 = new Set(picked[1].items.filter(i => !isAccessory(i)).map(i => i.id));
  const accSharedByBoth = new Set(
    picked[0].items
      .filter(i => isAccessory(i) && picked[1].items.some(j => j.id === i.id))
      .map(i => i.id)
  );
  tryPick(c => {
    for (const it of c.items) {
      if (isAccessory(it)) {
        if (accSharedByBoth.has(it.id)) return false;
      } else {
        if (nonAccIds1.has(it.id) || nonAccIds2.has(it.id)) return false;
      }
    }
    return true;
  }) || tryPick(c => {
    // Fallback : au minimum aucune pièce dans les 3 tenues
    for (const it of c.items) {
      if (isAccessory(it)) {
        if (accSharedByBoth.has(it.id)) return false;
      } else if (nonAccIds1.has(it.id) && nonAccIds2.has(it.id)) {
        return false;
      }
    }
    return true;
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

function enrichWithAccessories(
  outfit: OutfitCandidate,
  input: EngineInput
): OutfitCandidate {
  const wardrobe = input.wardrobe;
  const usedIds = new Set(outfit.items.map(i => i.id));

  const tryAdd = (candidateItem: ClothingItem): OutfitCandidate | null => {
    const newItems = [...outfit.items, candidateItem];
    const base: OutfitCandidate = { items: newItems, score: 0, reasons: [], blocked: false };
    const filtered = applyFilters(base, input);
    if (filtered.blocked) return null;
    return applyScoring(filtered, input);
  };

  // 1) Best bag
  const sacs = wardrobe.filter(i => i.category === 'Sacs' && !usedIds.has(i.id));
  let best: OutfitCandidate = outfit;
  for (const s of sacs) {
    const next = tryAdd(s);
    if (next && next.score > best.score) best = next;
  }
  if (best !== outfit) {
    outfit = best;
    best.items.forEach(i => usedIds.add(i.id));
  }

  // 2) Best accessories / jewelry (up to 2, only if they improve score)
  const accs = wardrobe.filter(
    i => (i.category === 'Accessoires' || i.category === 'Bijoux') && !usedIds.has(i.id)
  );
  for (let n = 0; n < 2; n++) {
    let bestAcc: OutfitCandidate = outfit;
    let bestItemId: string | null = null;
    for (const a of accs) {
      if (usedIds.has(a.id)) continue;
      const next = tryAdd(a);
      if (next && next.score > bestAcc.score) {
        bestAcc = next;
        bestItemId = a.id;
      }
    }
    if (bestItemId) {
      outfit = bestAcc;
      usedIds.add(bestItemId);
    } else {
      break;
    }
  }

  return outfit;
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
  const picked = pickDiverse(valid, input);
  return picked.map(p => enrichWithAccessories(p, input));
}

export * from './types';
