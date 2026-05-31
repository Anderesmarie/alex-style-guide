import { ClothingItem, OutfitLayoutData, OutfitLayoutPiece, UserProfile } from './types';
import { getLastOutfit, getRejected } from './storage';
import { supabase } from './supabase';
import { getCategoryForType } from './dressingTaxonomy';

// Reference canvas (must match OutfitFreeCanvas CANVAS_W / CANVAS_H)
const DEFAULT_CANVAS_W = 360;
const DEFAULT_CANVAS_H = 500;

// Default px positions per slot on a 360x500 canvas
type Slot = 'top' | 'jacket' | 'bottom' | 'dress' | 'shoes' | 'bag' | 'accessory';
const SLOT_DEFAULTS: Record<Slot, { x: number; y: number; width: number; z: number }> = {
  top:       { x: 20,  y: 20,  width: 150, z: 3 },
  jacket:    { x: 220, y: 20,  width: 150, z: 2 },
  bottom:    { x: 80,  y: 200, width: 160, z: 2 },
  dress:     { x: 80,  y: 60,  width: 200, z: 3 },
  shoes:     { x: 20,  y: 400, width: 120, z: 2 },
  bag:       { x: 250, y: 320, width: 110, z: 4 },
  accessory: { x: 270, y: 420, width: 80,  z: 5 },
};

function slotForItem(item: ClothingItem): Slot {
  const rawCat = getCategoryForType(item.type)?.key || item.category || '';
  // Compat anciens noms BDD
  const cat = rawCat === 'Robes & combinaisons' ? 'Robes'
            : rawCat === 'Manteaux & vestes' ? 'Manteaux'
            : rawCat === 'Pulls & sweats' ? 'Hauts'
            : rawCat === 'Jupes' ? 'Bas'
            : rawCat;
  if (cat === 'Manteaux') return 'jacket';
  if (cat === 'Robes') return 'dress';
  if (cat === 'Hauts') return 'top';
  if (cat === 'Bas') return 'bottom';
  if (cat === 'Chaussures') return 'shoes';
  if (cat === 'Sacs') return 'bag';
  if (cat === 'Accessoires' || cat === 'Bijoux') return 'accessory';
  return 'accessory';
}

export function buildDefaultLayoutData(items: ClothingItem[]): OutfitLayoutData {
  const pieces: OutfitLayoutPiece[] = items.map((item, i) => {
    const slot = slotForItem(item);
    const def = SLOT_DEFAULTS[slot];
    return {
      itemId: item.id,
      x: (def.x / DEFAULT_CANVAS_W) * 100,
      y: (def.y / DEFAULT_CANVAS_H) * 100,
      size: def.width,
      z: def.z + i, // unique z to avoid overlaps
    };
  });
  return {
    canvasW: DEFAULT_CANVAS_W,
    canvasH: DEFAULT_CANVAS_H,
    pieces,
  };
}

// ---------- Preference helpers (Supabase) ----------

async function getUserIdSafe(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}

export async function getRecentOutfitItemIds(): Promise<{ itemIds: string[]; createdAt: string }[]> {
  const uid = await getUserIdSafe();
  if (!uid) return [];
  const { data } = await supabase
    .from('user_preferences')
    .select('item_ids, created_at')
    .eq('user_id', uid)
    .eq('reaction', 'proposee')
    .order('created_at', { ascending: false })
    .limit(7);
  return (data || []).map(r => ({ itemIds: r.item_ids as string[], createdAt: r.created_at }));
}

export async function saveRecentOutfit(itemIds: string[]): Promise<void> {
  const uid = await getUserIdSafe();
  if (!uid) return;
  await supabase.from('user_preferences').insert({
    user_id: uid,
    item_ids: itemIds,
    reaction: 'proposee',
    nb_fois_portee: 0,
    derniere_utilisation: new Date().toISOString(),
  });
  // Keep only last 7
  const { data } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', uid)
    .eq('reaction', 'proposee')
    .order('created_at', { ascending: false });
  if (data && data.length > 7) {
    const toDelete = data.slice(7).map(r => r.id);
    await supabase.from('user_preferences').delete().in('id', toDelete);
  }
}

export async function getDislikedItemIds(): Promise<string[]> {
  const uid = await getUserIdSafe();
  if (!uid) return [];
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('user_preferences')
    .select('item_ids')
    .eq('user_id', uid)
    .eq('reaction', 'aime_pas')
    .gte('bloquee_jusqua', now);
  if (!data) return [];
  return data.flatMap(r => r.item_ids as string[]);
}

export async function saveDislikedOutfit(itemIds: string[]): Promise<void> {
  const uid = await getUserIdSafe();
  if (!uid) return;
  const bloquee = new Date();
  bloquee.setDate(bloquee.getDate() + 30);
  await supabase.from('user_preferences').insert({
    user_id: uid,
    item_ids: itemIds,
    reaction: 'aime_pas',
    bloquee_jusqua: bloquee.toISOString(),
  });
}

// Group items by their category field from the new category system
function getGroup(item: ClothingItem): string {
  const cat = (item.category || '').toLowerCase();
  const type = (item.type || '').toLowerCase();

  // Hauts: tops, chemises, pulls, sweats, etc.
  if (cat.includes('hauts') || cat.includes('tops')) return 'HAUTS';

  // Bas: pantalons, jeans, jupes, shorts
  if (cat.includes('bas') || cat.includes('pantalons') || cat.includes('jupes')) return 'BAS';

  // Robes & combinaisons
  if (cat.includes('robes') || cat.includes('combinaisons')) return 'ROBES';

  // Manteaux & vestes
  if (cat.includes('manteaux') || cat.includes('vestes')) return 'COUCHES';

  // Chaussures
  if (cat.includes('chaussures')) return 'CHAUSSURES';

  // Sacs
  if (cat.includes('sacs')) return 'ACCESSOIRES';

  // Accessoires
  if (cat.includes('accessoires')) return 'ACCESSOIRES';

  // Streetwear - classify by subcategory/type
  if (cat.includes('streetwear')) {
    if (type.includes('pantalon') || type.includes('short')) return 'BAS';
    return 'HAUTS';
  }

  // Y2K & Vintage
  if (cat.includes('y2k') || cat.includes('vintage')) {
    if (type.includes('jupe') || type.includes('pantalon')) return 'BAS';
    if (type.includes('robe')) return 'ROBES';
    return 'HAUTS';
  }

  // Sport & activewear
  if (cat.includes('sport') || cat.includes('activewear')) {
    if (type.includes('pantalon') || type.includes('legging') || type.includes('short') || type.includes('jupe')) return 'BAS';
    if (type.includes('robe')) return 'ROBES';
    if (type.includes('veste') || type.includes('extérieur')) return 'COUCHES';
    if (type.includes('chaussure')) return 'CHAUSSURES';
    return 'HAUTS';
  }

  // Loungewear & nuit
  if (cat.includes('loungewear') || cat.includes('nuit') || cat.includes('lingerie')) {
    if (type.includes('jogging') || type.includes('short') || type.includes('pantalon') || type.includes('culotte')) return 'BAS';
    return 'HAUTS';
  }

  // Maillots & beachwear
  if (cat.includes('maillot') || cat.includes('beachwear')) {
    if (type.includes('bas') || type.includes('short')) return 'BAS';
    return 'HAUTS';
  }

  // Legacy fallback: match old type names for items created before the category system
  const legacyHauts = ['t-shirt', 'chemise', 'pull'];
  const legacyBas = ['jean', 'pantalon', 'jupe'];
  const legacyRobes = ['robe'];
  const legacyCouches = ['veste', 'manteau'];
  const legacyChaussures = ['chaussures'];
  const legacyAcc = ['sac', 'accessoires'];

  if (legacyHauts.includes(type)) return 'HAUTS';
  if (legacyBas.includes(type)) return 'BAS';
  if (legacyRobes.includes(type)) return 'ROBES';
  if (legacyCouches.includes(type)) return 'COUCHES';
  if (legacyChaussures.includes(type)) return 'CHAUSSURES';
  if (legacyAcc.includes(type)) return 'ACCESSOIRES';

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

  const hauts = available.filter(i => getGroup(i) === 'HAUTS');
  const bas = available.filter(i => getGroup(i) === 'BAS');
  const robes = available.filter(i => getGroup(i) === 'ROBES');
  const couches = available.filter(i => getGroup(i) === 'COUCHES');
  const chaussures = available.filter(i => getGroup(i) === 'CHAUSSURES');
  const accessoires = available.filter(i => getGroup(i) === 'ACCESSOIRES');

  const outfit: ClothingItem[] = [];
  const usedIds = new Set<string>();

  // Decide path: haut+bas or robe
  const canHautBas = hauts.length > 0 && bas.length > 0;
  const canRobe = robes.length > 0;

  if (!canHautBas && !canRobe) return null;

  const useRobe = !canHautBas ? true : (!canRobe ? false : Math.random() < 0.3);

  if (useRobe) {
    const robe = pickRandom(robes, usedIds)!;
    outfit.push(robe);
    usedIds.add(robe.id);
  } else {
    // Pick haut with temperature preference
    let haut: ClothingItem | null = null;
    if (temperature !== null) {
      const type = (i: ClothingItem) => i.type.toLowerCase();
      if (temperature < 10) {
        haut = pickRandom(hauts.filter(i => type(i).includes('pull') || type(i).includes('sweat')), usedIds)
            || pickRandom(hauts.filter(i => type(i).includes('chemise')), usedIds);
      } else if (temperature <= 20) {
        haut = pickRandom(hauts.filter(i => type(i).includes('chemise') || type(i).includes('pull') || type(i).includes('sweat')), usedIds);
      } else {
        haut = pickRandom(hauts.filter(i => type(i).includes('t-shirt') || type(i).includes('débardeur') || type(i).includes('crop')), usedIds);
      }
    }
    if (!haut) haut = pickRandom(hauts, usedIds);
    if (!haut) return null;
    outfit.push(haut);
    usedIds.add(haut.id);

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

export function getSilhouetteScore(
  item: ClothingItem,
  taille: string | null,
  corpulence: string | null
): number {
  let score = 0;

  // Règles Taille
  if (taille === 'petite') {
    if (item.style?.some(s => s === 'Bureau') || item.type === 'Robe') score += 2;
    if ((item.color || []).some(c => c.toLowerCase() === 'noir' || c.toLowerCase() === 'blanc')) score += 1;
    if (item.type === 'Pantalon' && item.style?.some(s => s.toLowerCase().includes('large'))) score -= 2;
    if (item.type === 'Manteau' && item.occasion?.includes('Quotidien')) score -= 1;
  }

  if (taille === 'grande') {
    if (item.type === 'Robe' || item.type === 'Pantalon') score += 2;
    if (item.style?.some(s => s.toLowerCase().includes('large') || s === 'Boho')) score += 1;
  }

  // Règles Corpulence
  if (corpulence === 'ronde') {
    const itemDesc = `${item.type} ${item.category} ${item.subcategory}`.toLowerCase();
    if (['viscose', 'soie', 'jersey', 'modal'].some(m => itemDesc.includes(m))) score += 2;
    if ((item.color || []).some(c => c.toLowerCase() === 'noir' || c.toLowerCase() === 'marron')) score += 1;
    if (['tweed', 'rigide', 'structure'].some(m => itemDesc.includes(m))) score -= 2;
  }

  if (corpulence === 'fine') {
    const itemDesc = `${item.type} ${item.category} ${item.subcategory}`.toLowerCase();
    if (['tweed', 'coton', 'denim'].some(m => itemDesc.includes(m))) score += 1;
    if (item.style?.some(s => s.toLowerCase().includes('oversize') || s === 'Boho')) score += 1;
  }

  return score;
}

export function getMorphologyScore(
  item: ClothingItem,
  morphologie: string | null
): number {
  if (!morphologie) return 0;
  let score = 0;

  if (morphologie === 'A') {
    if (['Robe', 'Jupe'].includes(item.type) && item.style?.includes('Boho')) score += 2;
    if (item.type === 'Jean' && item.style?.includes('évasé')) score += 2;
    if (item.occasion?.includes('Travail')) score += 1;
    if (item.type === 'Jupe' && item.style?.includes('crayon')) score -= 2;
    if (item.style?.includes('moulant')) score -= 1;
  }

  if (morphologie === 'H') {
    if (item.style?.includes('cintré') || item.style?.includes('cache-coeur')) score += 2;
    if (item.type === 'Pantalon' && item.style?.includes('cigarette')) score += 2;
    if (item.style?.includes('oversize')) score -= 1;
  }

  if (morphologie === 'X') {
    if (item.style?.includes('cintré') || item.style?.includes('ajusté')) score += 2;
    if (['Robe', 'Jupe'].includes(item.type) && item.style?.includes('taille haute')) score += 2;
    if (item.style?.includes('oversize')) score -= 1;
  }

  if (morphologie === 'V') {
    if (item.type === 'Jupe' && item.style?.includes('trapèze')) score += 2;
    if (item.type === 'Pantalon' && item.style?.includes('large')) score += 2;
    if ((item.color || []).map(c => c.toLowerCase()).includes('noir') && item.type?.includes('Haut')) score += 1;
    if (item.style?.includes('épaules')) score -= 2;
  }

  if (morphologie === 'O') {
    if (['viscose', 'soie', 'jersey'].some(m => item.texture?.includes(m))) score += 2;
    if (item.style?.includes('col V')) score += 1;
    if (item.style?.includes('moulant')) score -= 2;
    if (item.style?.includes('taille basse')) score -= 1;
  }

  if (morphologie === '8') {
    if (item.style?.includes('cintré') || item.style?.includes('cache-coeur')) score += 2;
    if (item.type === 'Pantalon' && item.style?.includes('taille haute')) score += 2;
    if (item.style?.includes('oversize')) score -= 1;
  }

  return score;
}

export function getFavoriteColorScore(
  item: ClothingItem,
  favoriteColors: string[]
): number {
  if (!favoriteColors || favoriteColors.length === 0) return 0;
  const itemColors = (item.color || []).map(c => c.trim().toLowerCase());
  if (favoriteColors.some(c => itemColors.includes(c.toLowerCase()))) {
    return 2;
  }
  return 0;
}

function scoreSac(type: string, style: string[], occasion: string[]): number {
  let score = 0;
  const t = type.toLowerCase();
  const hasStyle = (s: string) => style.map(x => x.toLowerCase()).includes(s.toLowerCase());
  const hasOcc = (o: string) => occasion.map(x => x.toLowerCase()).includes(o.toLowerCase());

  // Sac à main
  if (t.includes('sac à main') || t.includes('bandoulière')) {
    if (hasStyle('Old Money') || hasStyle('Casual chic')) score += 2;
    if (hasStyle('Romantique')) score += 1;
    if (hasStyle('Streetwear')) score -= 1;
    if (hasStyle('Sportswear')) score -= 2;
    if (hasOcc('Travail')) score += 2;
  }
  // Tote bag
  if (t.includes('tote') || t.includes('fourre-tout')) {
    if (hasStyle('Casual chic') || hasStyle('Bohème') || hasStyle('Minimaliste') || hasStyle('Preppy')) score += 1;
    if (hasOcc('Campus') || hasOcc('Cours lycée')) score += 2;
    if (hasOcc('Soirée')) score -= 1;
  }
  // Sac à dos
  if (t.includes('sac à dos') || t.includes('cartable')) {
    if (hasStyle('Streetwear')) score += 2;
    if (hasStyle('Casual chic') || hasStyle('Preppy')) score += 1;
    if (hasStyle('Old Money')) score -= 2;
    if (hasOcc('Campus') || hasOcc('Cours lycée')) score += 2;
    if (hasOcc('Soirée')) score -= 2;
  }
  // Pochette
  if (t.includes('pochette')) {
    if (hasStyle('Y2K') || hasStyle('Romantique') || hasStyle('Dark')) score += 1;
    if (hasOcc('Événement') || hasOcc('Evenement')) score += 3;
    if (hasOcc('Travail')) score -= 1;
  }
  // Sac banane
  if (t.includes('banane')) {
    if (hasStyle('Streetwear')) score += 2;
    if (hasStyle('Y2K') || hasStyle('Casual chic')) score += 1;
    if (hasStyle('Old Money') || hasStyle('Romantique')) score -= 2;
    if (hasOcc('Événement') || hasOcc('Evenement')) score -= 2;
  }
  // Sac baguette
  if (t.includes('baguette')) {
    if (hasStyle('Casual chic')) score += 2;
    if (hasStyle('Old Money') || hasStyle('Y2K') || hasStyle('Romantique')) score += 1;
    if (hasOcc('Travail')) score += 1;
  }
  // Mini sac
  if (t.includes('mini sac') || t.includes('mini bag')) {
    if (hasStyle('Y2K')) score += 2;
    if (hasStyle('Romantique') || hasStyle('Dark')) score += 1;
    if (hasOcc('Sport')) score -= 2;
    if (hasOcc('Travail')) score -= 1;
  }
  return score;
}

// Context for advanced scoring (loaded async before generation)
interface ScoringContext {
  recentOutfits: { itemIds: string[]; createdAt: string }[];
  dislikedIds: Set<string>;
  wardrobeCreatedAt: Record<string, string>; // itemId → created_at ISO
  allProposedIds: Set<string>; // all item IDs proposed in last 14 days
  lastProposedIds: Set<string>; // item IDs from yesterday
  recent3Ids: Set<string>; // item IDs from last 3 suggestions
}

function scoreByProfile(
  item: ClothingItem,
  profile: UserProfile | null,
  ctx: ScoringContext | null = null,
  currentOccasion: string | null = null
): number {
  if (!profile) return 0;
  let score = 0;
  const styles = profile.styles.map(s => s.toLowerCase());

  // 1. Style profil (+3)
  if (styles.includes('élégant') || styles.includes('casual chic')) {
    if (item.style.some(s => ['Chic', 'Bureau'].includes(s))) score += 3;
  }
  if (styles.includes('sportswear')) {
    if (item.style.some(s => s === 'Sport')) score += 3;
  }
  if (styles.includes('bohème')) {
    if (item.style.some(s => s === 'Boho')) score += 3;
  }
  if (styles.includes('minimaliste')) {
    if ((item.color || []).some(c => ['blanc', 'noir', 'gris', 'beige'].includes(c.toLowerCase()))) score += 2;
  }

  // 2. Occasion du jour (+2)
  const occasionFilter = isWeekday() ? ['Travail', 'Quotidien'] : ['Sortie', 'Quotidien'];
  if (item.occasion?.some(o => occasionFilter.includes(o))) score += 2;

  // Silhouette, morphology, favorite color scores
  score += getSilhouetteScore(item, profile.taille, profile.corpulence);
  score += getMorphologyScore(item, profile.morphologie ?? null);
  score += getFavoriteColorScore(item, profile.favorite_colors ?? []);

  // Context-based scoring
  if (ctx) {
    // 3. Anti-répétition
    if (ctx.lastProposedIds.has(item.id)) score -= 5;
    else if (ctx.recent3Ids.has(item.id)) score -= 3;

    // 4. Dislike (-10)
    if (ctx.dislikedIds.has(item.id)) score -= 10;

    // 5. Nouveauté (+1 if added < 30 days)
    const createdAt = ctx.wardrobeCreatedAt[item.id];
    if (createdAt) {
      const age = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (age < 30) score += 1;
    }

    // 6. Fraîcheur (+1 if not proposed in 14+ days)
    if (!ctx.allProposedIds.has(item.id)) score += 1;
  }

  // Scoring spécifique soirée étudiante
  if (currentOccasion === 'soiree_etudiante') {
    if (item.style?.some((s: string) =>
      ['y2k', 'streetwear', 'casual chic', 'casual_chic', 'romantique'].includes(s.toLowerCase())
    )) score += 2;
    if (item.occasion?.some((o: string) =>
      ['soiree', 'sortie', 'evenement'].includes(o.toLowerCase())
    )) score += 2;
    if (item.occasion?.some((o: string) =>
      ['travail', 'bureau'].includes(o.toLowerCase())
    )) score -= 2;
  }

  // Scoring spécifique sacs par type
  if (item.category === 'Sacs') {
    score += scoreSac(item.type, item.style ?? [], item.occasion ?? []);
  }

  return score;
}

/**
 * Validate that an outfit contains the required pieces:
 * - At least 1 top OR 1 dress/combinaison
 * - At least 1 bottom (if no dress)
 * - At least 1 pair of shoes
 */
export function isValidOutfit(outfit: ClothingItem[]): boolean {
  if (!outfit || outfit.length === 0) return false;
  const groups = outfit.map(getGroup);
  const hasTop = groups.includes('HAUTS');
  const hasBottom = groups.includes('BAS');
  const hasDress = groups.includes('ROBES');
  const hasShoes = groups.includes('CHAUSSURES');

  if (!hasShoes) return false;
  if (hasDress) return true;
  return hasTop && hasBottom;
}

/**
 * Compute layering coherence score for an outfit given the day's temperature range.
 * Same rules used both for daily auto-suggestions and "Crée ta tenue du moment".
 */
export function computeAmpScore(
  outfit: ClothingItem[],
  tempMin?: number,
  tempMax?: number,
  amplitude = 0,
): number {
  const hasCouche = outfit.some(p => {
    const c = (p.category || '').toLowerCase();
    return c.includes('manteaux') || c.includes('vestes');
  });
  const hasPull = outfit.some(p => {
    const t = (p.type || '').toLowerCase();
    return t.includes('pull') || t.includes('sweat') || t.includes('gilet');
  });
  const hasTshirt = outfit.some(p => {
    const t = (p.type || '').toLowerCase();
    return t.includes('t-shirt') || t.includes('crop') || t.includes('débardeur') || t.includes('body');
  });

  let s = 0;
  if (amplitude >= 15 && hasCouche) s += 3;
  if (amplitude >= 10 && hasCouche) s += 2;
  if (amplitude >= 10 && !hasCouche) s -= 2;
  if (hasTshirt && hasPull && tempMin !== undefined && tempMin < 15) s += 3;
  if (hasTshirt && hasCouche && tempMin !== undefined && tempMin < 15 && tempMax !== undefined && tempMax >= 17) s += 3;
  if (hasTshirt && hasPull && hasCouche && amplitude >= 10) s += 4;
  if (hasPull && !hasTshirt && !hasCouche && tempMin !== undefined && tempMin < 15) s -= 3;
  if (hasTshirt && !hasPull && !hasCouche && tempMin !== undefined && tempMin < 12) s -= 3;
  if (!hasCouche && !hasPull && tempMin !== undefined && tempMin < 13) s -= 2;
  return s;
}

function collectOutfits(
  pool: ClothingItem[],
  targetCount: number,
  temperature: number | null,
  blockedKeys: Set<string>,
  seenKeys: Set<string>,
  tempMin?: number,
  tempMax?: number,
  amplitude = 0
): ClothingItem[][] {
  const results: ClothingItem[][] = [];
  let attempts = 0;
  const maxAttempts = Math.max(40, targetCount * 50);

  while (results.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const outfit = buildOneOutfit(pool, new Set<string>(), temperature);
    if (!outfit) continue;
    if (!isValidOutfit(outfit)) continue;

    const key = outfit.map(i => i.id).sort().join(',');
    if (blockedKeys.has(key) || seenKeys.has(key)) continue;

    if (computeAmpScore(outfit, tempMin, tempMax, amplitude) < -3) continue;

    seenKeys.add(key);
    results.push(outfit);
  }

  return results;
}

export async function loadScoringContext(wardrobe: ClothingItem[]): Promise<ScoringContext> {
  const [recentOutfits, dislikedIds] = await Promise.all([
    getRecentOutfitItemIds(),
    getDislikedItemIds(),
  ]);

  // Build wardrobeCreatedAt from supabase (wardrobe items have created_at)
  const wardrobeCreatedAt: Record<string, string> = {};
  const uid = await getUserIdSafe();
  if (uid) {
    const { data } = await supabase.from('wardrobe').select('id, created_at').eq('user_id', uid);
    (data || []).forEach(r => { wardrobeCreatedAt[r.id] = r.created_at; });
  }

  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  const lastProposedIds = new Set<string>();
  const recent3Ids = new Set<string>();
  const allProposedIds = new Set<string>();

  recentOutfits.forEach((o, i) => {
    const age = (now - new Date(o.createdAt).getTime()) / day;
    if (age < 14) o.itemIds.forEach(id => allProposedIds.add(id));
    if (i === 0 && age < 2) o.itemIds.forEach(id => lastProposedIds.add(id));
    if (i < 3) o.itemIds.forEach(id => recent3Ids.add(id));
  });

  return {
    recentOutfits,
    dislikedIds: new Set(dislikedIds),
    wardrobeCreatedAt,
    allProposedIds,
    lastProposedIds,
    recent3Ids,
  };
}

function getCompatibleSeasons(temperature: number | null): string[] {
  if (temperature === null) return ['Printemps', 'Été', 'Automne', 'Hiver', 'Toutes saisons'];
  if (temperature >= 25) return ['Été', 'Toutes saisons'];
  if (temperature >= 15 && temperature < 25) return ['Printemps', 'Été', 'Automne', 'Toutes saisons'];
  if (temperature >= 5 && temperature < 15) return ['Automne', 'Hiver', 'Printemps', 'Toutes saisons'];
  return ['Hiver', 'Toutes saisons'];
}

function getOccasionFromLifestyle(lifestyle: string | null | undefined, dayOfWeek: number): string {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  switch (lifestyle) {
    case 'lycee':
      return isWeekend ? 'sortie' : 'cours_lycee';
    case 'etudes_sup':
      return isWeekend ? 'soiree_etudiante' : 'campus';
    case 'premier_job':
    case 'travail':
      return isWeekend ? 'sortie' : 'travail';
    default:
      return isWeekend ? 'sortie' : 'quotidien';
  }
}

function getWeatherScore(
  item: ClothingItem,
  tempMin: number | undefined,
  tempMax: number | undefined,
  tAvg: number | null,
  isRainy: boolean,
  isWindy: boolean
): number {
  let score = 0;
  const type = (item.type || '').toLowerCase();
  const category = (item.category || '').toLowerCase();

  if (/t-shirt|crop|débardeur|body|bralette/.test(type)) {
    if (tempMin !== undefined && tempMin < 8) score -= 2;
    if (tempMin !== undefined && tempMin < 12) score -= 1;
    if (tAvg !== null && tAvg > 28) score += 1;
  }
  if (/pull|sweat|gilet|cardigan/.test(type)) {
    if (tAvg !== null && tAvg > 25) score -= 2;
    if (tAvg !== null && tAvg < 12) score += 2;
  }
  if (category.includes('manteaux') && type.includes('doudoune')) {
    if (tempMin !== undefined && tempMin < 10) score += 3;
    if (tAvg !== null && tAvg > 20) score -= 3;
    if (tempMin !== undefined && tempMin < 5) score += 3;
  } else if (category.includes('manteaux') && type.includes('parka')) {
    if (tempMin !== undefined && tempMin < 10) score += 3;
    if (tAvg !== null && tAvg > 20) score -= 3;
    if (tempMin !== undefined && tempMin < 5) score += 2;
  } else if (category.includes('manteaux')) {
    if (tempMin !== undefined && tempMin < 10) score += 3;
    if (tAvg !== null && tAvg > 20) score -= 3;
  }
  if (/blazer|trench|bomber/.test(type)) {
    if (tAvg !== null && tAvg >= 12 && tAvg <= 22) score += 1;
  }
  if (type.includes('imperméable')) {
    if (tempMin !== undefined && tempMin < 15 && isRainy) score += 3;
    if (tempMax !== undefined && tempMax > 28) score -= 1;
  }
  if (type.includes('coupe-vent')) {
    if (tempMin !== undefined && tempMin < 15 && isWindy) score += 2;
  }
  if (/short|mini|combishort/.test(type)) {
    if (tAvg !== null && tAvg > 22) score += 1;
    if (tAvg !== null && tAvg > 28) score += 1;
    if (tAvg !== null && tAvg < 15) score -= 2;
  }
  if (category.includes('robes')) {
    if (tAvg !== null && tAvg > 20) score += 1;
    if (tAvg !== null && tAvg > 28) score += 1;
    if (tAvg !== null && tAvg < 15) score -= 1;
  }
  if (type.includes('sandale')) {
    if (tAvg !== null && tAvg > 22) score += 1;
    if (tAvg !== null && tAvg > 28) score += 1;
    if (tAvg !== null && tAvg < 18) score -= 2;
  }
  if (type.includes('botte')) {
    if (tAvg !== null && tAvg < 15) score += 1;
    if (tAvg !== null && tAvg > 25) score -= 2;
  }

  // Season bonus
  if (tAvg !== null && item.season && item.season.length > 0) {
    const month = new Date().getMonth();
    let active = 'Hiver';
    if (tAvg >= 25) active = 'Été';
    else if (tAvg >= 15 && month >= 8) active = 'Automne';
    else if (tAvg >= 15 && month < 8) active = 'Printemps';
    if (item.season.includes(active)) score += 1;
  }

  return score;
}

export async function generateRecommendations(
  wardrobe: ClothingItem[],
  temperature: number | null,
  count = 2,
  userProfile: UserProfile | null = null,
  tempMin?: number,
  tempMax?: number,
  isRainy = false,
  isWindy = false
): Promise<ClothingItem[][]> {
  const tAvg = (tempMin !== undefined && tempMax !== undefined) ? (tempMin + tempMax) / 2 : null;
  const amplitude = (tempMin !== undefined && tempMax !== undefined) ? tempMax - tempMin : 0;
  const lastOutfit = await getLastOutfit();
  const rejected = await getRejected();
  const lastKey = lastOutfit.sort().join(',');
  const blockedKeys = new Set(rejected.map(r => r.sort().join(',')));
  if (lastKey) blockedKeys.add(lastKey);

  // Load async scoring context
  let ctx: ScoringContext | null = null;
  try { ctx = await loadScoringContext(wardrobe); } catch {}

  const compatibleSeasons = getCompatibleSeasons(temperature);
  const seasonPool = wardrobe.filter(
    i => i.season.length === 0 || i.season.some(s => compatibleSeasons.includes(s))
  );
  const effectivePool = seasonPool.length >= 4 ? seasonPool : wardrobe;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const currentOccasion = getOccasionFromLifestyle(
    (userProfile as unknown as { lifestyle?: string | null })?.lifestyle,
    dayOfWeek
  );
  const occasionTagMap: Record<string, string[]> = {
    cours_lycee:      ['quotidien', 'sortie', 'cours', 'cours/campus'],
    campus:           ['quotidien', 'sortie', 'campus', 'cours', 'cours/campus'],
    travail:          ['travail', 'bureau', 'quotidien'],
    sortie:           ['sortie', 'quotidien'],
    soiree_etudiante: ['sortie', 'soiree', 'evenement', 'quotidien'],
    quotidien:        ['quotidien', 'sortie'],
  };
  const acceptedTags = occasionTagMap[currentOccasion] ?? ['quotidien'];
  let occasionPool = effectivePool.filter(item =>
    !item.occasion ||
    item.occasion.some((occ: string) => acceptedTags.includes(occ.toLowerCase()))
  );
  if (occasionPool.length < 4) occasionPool = effectivePool;

  // Exclusions bloquantes spécifiques à l'occasion
  const applyOccasionExclusions = (pool: ClothingItem[]): ClothingItem[] => {
    return pool.filter(item => {
      if (currentOccasion === 'soiree_etudiante') {
        if (item.category === 'loungewear' || item.category === 'beachwear') return false;
        if (item.occasion?.length && item.occasion.every((o: string) =>
          ['travail', 'bureau'].includes(o.toLowerCase())
        )) return false;
      }
      return true;
    });
  };
  const filteredOccasionPool = applyOccasionExclusions(occasionPool);
  if (filteredOccasionPool.length >= 4) occasionPool = filteredOccasionPool;

  const rankPool = (pool: ClothingItem[]) => {
    if (!userProfile) return pool;
    return [...pool].sort((a, b) => {
      const sa = scoreByProfile(a, userProfile, ctx, currentOccasion) + getWeatherScore(a, tempMin, tempMax, tAvg, isRainy, isWindy);
      const sb = scoreByProfile(b, userProfile, ctx, currentOccasion) + getWeatherScore(b, tempMin, tempMax, tAvg, isRainy, isWindy);
      if (sb !== sa) return sb - sa;
      return Math.random() - 0.5;
    });
  };

  const results: ClothingItem[][] = [];
  const seenKeys = new Set<string>();
  const usedPoolKeys = new Set<string>();
  const candidatePools = [occasionPool, effectivePool, wardrobe];

  for (const pool of candidatePools) {
    if (results.length >= count || pool.length < 3) continue;

    const poolKey = pool.map(i => i.id).sort().join(',');
    if (usedPoolKeys.has(poolKey)) continue;
    usedPoolKeys.add(poolKey);

    const rankedPool = rankPool(pool);
    const missing = count - results.length;
    const generated = collectOutfits(rankedPool, missing, temperature, blockedKeys, seenKeys, tempMin, tempMax, amplitude);
    results.push(...generated);
  }

  return results.slice(0, count);
}

export function buildCustomOutfit(
  wardrobe: ClothingItem[],
  centralPiece: ClothingItem,
  occasion: string,
  style: string,
  excludeIds: Set<string>
): ClothingItem[] {
  const available = wardrobe.filter(i => i.id !== centralPiece.id && !excludeIds.has(i.id));

  const scored = available.map(i => {
    let score = 0;
    if (i.occasion.some(o => o.toLowerCase().includes(occasion.toLowerCase()))) score += 2;
    if (i.style.some(s => s.toLowerCase().includes(style.toLowerCase()))) score += 2;
    score += Math.random();
    return { item: i, score };
  }).sort((a, b) => b.score - a.score);

  const outfit: ClothingItem[] = [centralPiece];
  const centralGroup = getGroup(centralPiece);
  const filledGroups = new Set([centralGroup]);
  const usedIds = new Set([centralPiece.id]);

  const isRobePath = centralGroup === 'ROBES';

  if (!isRobePath) {
    if (centralGroup !== 'HAUTS') {
      const pick = scored.find(s => getGroup(s.item) === 'HAUTS' && !usedIds.has(s.item.id));
      if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add('HAUTS'); }
    }
    if (centralGroup !== 'BAS') {
      const pick = scored.find(s => getGroup(s.item) === 'BAS' && !usedIds.has(s.item.id));
      if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add('BAS'); }
    }
  }

  // Always try to fill shoes (required for valid outfit)
  if (!filledGroups.has('CHAUSSURES')) {
    const pick = scored.find(s => getGroup(s.item) === 'CHAUSSURES' && !usedIds.has(s.item.id));
    if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add('CHAUSSURES'); }
  }

  const optionals: string[] = ['COUCHES', 'ACCESSOIRES'];
  for (const groupKey of optionals) {
    if (filledGroups.has(groupKey) || outfit.length >= 5) continue;
    const pick = scored.find(s => getGroup(s.item) === groupKey && !usedIds.has(s.item.id));
    if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add(groupKey); }
  }

  return outfit;
}

/**
 * Build a custom outfit and validate it. Retries up to 5 times
 * (varying the central piece if not provided) before giving up.
 * Returns null if no valid outfit can be built.
 */
export function buildValidCustomOutfit(
  wardrobe: ClothingItem[],
  centralPiece: ClothingItem | null,
  occasion: string,
  style: string,
  excludeIds: Set<string>,
  maxAttempts = 5,
): ClothingItem[] | null {
  const pickCentral = (): ClothingItem | null => {
    if (centralPiece) return centralPiece;
    let candidates = wardrobe.filter(i => !excludeIds.has(i.id));
    if (occasion) {
      const filtered = candidates.filter(i => i.occasion?.some(o => o === occasion));
      if (filtered.length > 0) candidates = filtered;
    }
    if (style) {
      const filtered = candidates.filter(i => i.style?.some(s => s === style));
      if (filtered.length > 0) candidates = filtered;
    }
    if (candidates.length === 0) candidates = wardrobe;
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  for (let i = 0; i < maxAttempts; i++) {
    const central = pickCentral();
    if (!central) return null;
    const outfit = buildCustomOutfit(wardrobe, central, occasion, style, excludeIds);
    if (isValidOutfit(outfit)) return outfit;
  }
  return null;
}
