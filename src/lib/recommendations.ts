import { ClothingItem, UserProfile } from './types';
import { getLastOutfit, getRejected } from './storage';
import { getCurrentSeason } from './weather';
import { supabase } from './supabase';

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
    if (item.color?.toLowerCase() === 'noir' || item.color?.toLowerCase() === 'blanc') score += 1;
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
    if (item.color?.toLowerCase() === 'noir' || item.color?.toLowerCase() === 'marron') score += 1;
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
    if (item.color === 'noir' && item.type?.includes('Haut')) score += 1;
    if (item.style?.includes('épaules')) score -= 2;
  }

  if (morphologie === 'O') {
    if (['viscose', 'soie', 'jersey'].some(m => item.matiere?.includes(m))) score += 2;
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
  const itemColor = item.color?.trim() ?? '';
  if (favoriteColors.some(c => c.toLowerCase() === itemColor.toLowerCase())) {
    return 2;
  }
  return 0;
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
  ctx: ScoringContext | null = null
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
    if (['blanc', 'noir', 'gris', 'beige'].includes(item.color?.toLowerCase())) score += 2;
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

  return score;
}

function collectOutfits(
  pool: ClothingItem[],
  targetCount: number,
  temperature: number | null,
  blockedKeys: Set<string>,
  seenKeys: Set<string>
): ClothingItem[][] {
  const results: ClothingItem[][] = [];
  let attempts = 0;
  const maxAttempts = Math.max(40, targetCount * 50);

  while (results.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const outfit = buildOneOutfit(pool, new Set<string>(), temperature);
    if (!outfit) continue;

    const key = outfit.map(i => i.id).sort().join(',');
    if (blockedKeys.has(key) || seenKeys.has(key)) continue;

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

export async function generateRecommendations(
  wardrobe: ClothingItem[],
  temperature: number | null,
  count = 2,
  userProfile: UserProfile | null = null
): Promise<ClothingItem[][]> {
  const season = getCurrentSeason();
  const lastOutfit = await getLastOutfit();
  const rejected = await getRejected();
  const lastKey = lastOutfit.sort().join(',');
  const blockedKeys = new Set(rejected.map(r => r.sort().join(',')));
  if (lastKey) blockedKeys.add(lastKey);

  // Load async scoring context
  let ctx: ScoringContext | null = null;
  try { ctx = await loadScoringContext(wardrobe); } catch {}

  const seasonPool = wardrobe.filter(
    i => i.season.includes(season) || i.season.includes('Toutes saisons')
  );

  const occasionFilter = isWeekday() ? ['Travail', 'Quotidien'] : ['Sortie', 'Quotidien'];
  const occasionPool = seasonPool.filter(i => i.occasion.some(o => occasionFilter.includes(o)));

  const rankPool = (pool: ClothingItem[]) => {
    if (!userProfile) return pool;
    return [...pool].sort((a, b) => {
      const sa = scoreByProfile(a, userProfile, ctx);
      const sb = scoreByProfile(b, userProfile, ctx);
      if (sb !== sa) return sb - sa;
      return Math.random() - 0.5;
    });
  };

  const results: ClothingItem[][] = [];
  const seenKeys = new Set<string>();
  const usedPoolKeys = new Set<string>();
  const candidatePools = [occasionPool, seasonPool, wardrobe];

  for (const pool of candidatePools) {
    if (results.length >= count || pool.length < 3) continue;

    const poolKey = pool.map(i => i.id).sort().join(',');
    if (usedPoolKeys.has(poolKey)) continue;
    usedPoolKeys.add(poolKey);

    const rankedPool = rankPool(pool);
    const missing = count - results.length;
    const generated = collectOutfits(rankedPool, missing, temperature, blockedKeys, seenKeys);
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

  const optionals: string[] = ['COUCHES', 'CHAUSSURES', 'ACCESSOIRES'];
  for (const groupKey of optionals) {
    if (filledGroups.has(groupKey) || outfit.length >= 5) continue;
    const pick = scored.find(s => getGroup(s.item) === groupKey && !usedIds.has(s.item.id));
    if (pick) { outfit.push(pick.item); usedIds.add(pick.item.id); filledGroups.add(groupKey); }
  }

  return outfit;
}
