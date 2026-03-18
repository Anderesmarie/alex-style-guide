import { ClothingItem, UserProfile } from './types';
import { getLastOutfit, getRejected } from './storage';
import { getCurrentSeason } from './weather';

const HAUTS = ['T-shirt', 'Chemise', 'Pull'];
const BAS = ['Jean', 'Pantalon', 'Jupe'];
const ROBES = ['Robe'];
const COUCHES = ['Veste', 'Manteau'];
const CHAUSSURES = ['Chaussures'];
const ACCESSOIRES = ['Sac', 'Accessoires'];

function getGroup(type: string): string {
  if (HAUTS.includes(type)) return 'HAUTS';
  if (BAS.includes(type)) return 'BAS';
  if (ROBES.includes(type)) return 'ROBES';
  if (COUCHES.includes(type)) return 'COUCHES';
  if (CHAUSSURES.includes(type)) return 'CHAUSSURES';
  if (ACCESSOIRES.includes(type)) return 'ACCESSOIRES';
  return 'OTHER';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isWeekday(): boolean {
  const d = new Date().getDay();
  return d >= 1 && d <= 5;
}

function pickRandom(items: ClothingItem[], excludeIds: Set<string>): ClothingItem | null {
  const filtered = items.filter(i => !excludeIds.has(i.id));
  if (filtered.length === 0) return null;
  return shuffle(filtered)[0];
}

function buildOneOutfit(pool: ClothingItem[], globalUsedIds: Set<string>, temperature: number | null): ClothingItem[] | null {
  const available = pool.filter(i => !globalUsedIds.has(i.id));

  const hauts = available.filter(i => HAUTS.includes(i.type));
  const bas = available.filter(i => BAS.includes(i.type));
  const robes = available.filter(i => ROBES.includes(i.type));
  const couches = available.filter(i => COUCHES.includes(i.type));
  const chaussures = available.filter(i => CHAUSSURES.includes(i.type));
  const accessoires = available.filter(i => ACCESSOIRES.includes(i.type));

  const outfit: ClothingItem[] = [];
  const usedIds = new Set<string>();

  // Decide path: haut+bas or robe
  const canHautBas = hauts.length > 0 && bas.length > 0;
  const canRobe = robes.length > 0;

  if (!canHautBas && !canRobe) return null;

  // Choose path randomly but prefer haut+bas if both available
  const useRobe = !canHautBas ? true : (!canRobe ? false : Math.random() < 0.3);

  if (useRobe) {
    const robe = pickRandom(robes, usedIds)!;
    outfit.push(robe);
    usedIds.add(robe.id);
  } else {
    // Pick haut with temperature preference
    let haut: ClothingItem | null = null;
    if (temperature !== null) {
      if (temperature < 10) {
        haut = pickRandom(hauts.filter(i => i.type === 'Pull'), usedIds)
            || pickRandom(hauts.filter(i => i.type === 'Chemise'), usedIds);
      } else if (temperature <= 20) {
        haut = pickRandom(hauts.filter(i => ['Chemise', 'Pull'].includes(i.type)), usedIds);
      } else {
        haut = pickRandom(hauts.filter(i => i.type === 'T-shirt'), usedIds);
      }
    }
    if (!haut) haut = pickRandom(hauts, usedIds);
    if (!haut) return null;
    outfit.push(haut);
    usedIds.add(haut.id);

    // Pick exactly 1 bas
    const b = pickRandom(bas, usedIds);
    if (!b) return null;
    outfit.push(b);
    usedIds.add(b.id);
  }

  // Optional: 1 couche (more likely when cold)
  const wantCouche = temperature !== null ? temperature < 15 : Math.random() < 0.3;
  if (wantCouche) {
    const c = pickRandom(couches, usedIds);
    if (c) { outfit.push(c); usedIds.add(c.id); }
  }

  // Optional: 1 chaussures
  const ch = pickRandom(chaussures, usedIds);
  if (ch) { outfit.push(ch); usedIds.add(ch.id); }

  // Optional: 1 accessoire
  const acc = pickRandom(accessoires, usedIds);
  if (acc) { outfit.push(acc); usedIds.add(acc.id); }

  return outfit;
}

function scoreByProfile(item: ClothingItem, profile: UserProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  const styles = profile.styles.map(s => s.toLowerCase());

  if (styles.includes('élégant') || styles.includes('casual chic')) {
    if (item.style.some(s => ['Chic', 'Bureau'].includes(s))) score += 2;
  }
  if (styles.includes('sportswear')) {
    if (item.style.some(s => s === 'Sport')) score += 2;
  }
  if (styles.includes('bohème')) {
    if (item.style.some(s => s === 'Boho')) score += 2;
  }
  if (styles.includes('minimaliste')) {
    if (['Blanc', 'Noir', 'Gris', 'Beige'].includes(item.color)) score += 1;
  }
  return score;
}

export function generateRecommendations(
  wardrobe: ClothingItem[],
  temperature: number | null,
  count = 2,
  userProfile: UserProfile | null = null
): ClothingItem[][] {
  const season = getCurrentSeason();
  const lastOutfit = getLastOutfit();
  const rejected = getRejected();
  const lastKey = lastOutfit.sort().join(',');
  const rejectedKeys = new Set(rejected.map(r => r.sort().join(',')));

  let pool = wardrobe.filter(
    i => i.season.includes(season) || i.season.includes('Toutes saisons')
  );

  const occasionFilter = isWeekday() ? ['Travail', 'Quotidien'] : ['Sortie', 'Quotidien'];
  pool = pool.filter(i => i.occasion.some(o => occasionFilter.includes(o)));

  if (pool.length < 3) pool = wardrobe;

  // Sort pool by profile preference (highest score first), with randomness to keep variety
  if (userProfile) {
    pool = [...pool].sort((a, b) => {
      const sa = scoreByProfile(a, userProfile);
      const sb = scoreByProfile(b, userProfile);
      if (sb !== sa) return sb - sa;
      return Math.random() - 0.5;
    });
  }

  const results: ClothingItem[][] = [];
  const globalUsedIds = new Set<string>();
  let attempts = 0;

  while (results.length < count && attempts < 80) {
    attempts++;
    const outfit = buildOneOutfit(pool, globalUsedIds, temperature);
    if (!outfit) break;

    const key = outfit.map(i => i.id).sort().join(',');
    if (key === lastKey || rejectedKeys.has(key)) continue;

    results.push(outfit);
    outfit.forEach(i => globalUsedIds.add(i.id));
  }

  return results;
}

export function buildCustomOutfit(
  wardrobe: ClothingItem[],
  centralPiece: ClothingItem,
  occasion: string,
  style: string,
  excludeIds: Set<string>
): ClothingItem[] {
  const available = wardrobe.filter(i => i.id !== centralPiece.id && !excludeIds.has(i.id));

  // Score by relevance
  const scored = available.map(i => {
    let score = 0;
    if (i.occasion.some(o => o.toLowerCase().includes(occasion.toLowerCase()))) score += 2;
    if (i.style.some(s => s.toLowerCase().includes(style.toLowerCase()))) score += 2;
    score += Math.random();
    return { item: i, score };
  }).sort((a, b) => b.score - a.score);

  const outfit: ClothingItem[] = [centralPiece];
  const centralGroup = getGroup(centralPiece.type);
  const filledGroups = new Set([centralGroup]);
  const usedIds = new Set([centralPiece.id]);

  const isRobePath = centralGroup === 'ROBES';

  // Fill required pieces
  if (!isRobePath) {
    if (centralGroup !== 'HAUTS') {
      const pick = scored.find(s => HAUTS.includes(s.item.type) && !usedIds.has(s.item.id));
      if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add('HAUTS'); }
    }
    if (centralGroup !== 'BAS') {
      const pick = scored.find(s => BAS.includes(s.item.type) && !usedIds.has(s.item.id));
      if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add('BAS'); }
    }
  }

  // Fill optional: COUCHES, CHAUSSURES, ACCESSOIRES
  const optionals: [string, readonly string[]][] = [['COUCHES', COUCHES], ['CHAUSSURES', CHAUSSURES], ['ACCESSOIRES', ACCESSOIRES]];
  for (const [groupKey, types] of optionals) {
    if (filledGroups.has(groupKey) || outfit.length >= 5) continue;
    const pick = scored.find(s => types.includes(s.item.type) && !usedIds.has(s.item.id));
    if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add(groupKey); }
  }

  return outfit;
}
