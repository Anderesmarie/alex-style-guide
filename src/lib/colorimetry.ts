// ── New season-based colorimetry system ──

export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';

export type ColorimetryProfile = {
  season: Season;
  recommended: string[];
  avoid: string[];
  metal: string;
};

export const ARTIFICIAL_HAIR_COLORS = ['rose', 'gris_argente'];

export const SEASON_PALETTES: Record<Season, ColorimetryProfile> = {
  printemps: {
    season: 'printemps',
    recommended: ['corail', 'peche', 'vert_menthe', 'bleu_ciel', 'turquoise', 'rose_saumon', 'camel_clair', 'abricot', 'ivoire', 'beige', 'jaune'],
    avoid: ['noir', 'gris', 'bordeaux', 'violet'],
    metal: 'Or jaune · Or rose · Bronze doré',
  },
  ete: {
    season: 'ete',
    recommended: ['rose', 'mauve', 'lavande', 'bleu', 'gris', 'blanc_casse', 'vert'],
    avoid: ['orange_vif', 'jaune', 'rouge', 'marron', 'noir'],
    metal: 'Argent · Or blanc · Platine · Acier',
  },
  automne: {
    season: 'automne',
    recommended: ['camel', 'terracotta', 'vert', 'bordeaux', 'marron', 'jaune', 'beige'],
    avoid: ['rose', 'gris', 'noir', 'blanc'],
    metal: 'Or jaune · Bronze · Cuivre · Laiton doré',
  },
  hiver: {
    season: 'hiver',
    recommended: ['noir', 'blanc', 'rouge', 'bleu', 'rose', 'violet', 'vert'],
    avoid: ['beige', 'camel', 'orange', 'marron', 'jaune'],
    metal: 'Argent · Or blanc · Platine · Acier',
  },
};

export const COLOR_TO_SEASON: Record<string, Season[]> = {
  // Couleurs unies — minuscules ET majuscules
  'blanc': ['hiver'],
  'Blanc': ['hiver'],
  'noir': ['hiver'],
  'Noir': ['hiver'],
  'gris': ['ete', 'hiver'],
  'Gris': ['ete', 'hiver'],
  'beige': ['printemps', 'automne'],
  'Beige': ['printemps', 'automne'],
  'camel': ['automne'],
  'Camel': ['automne'],
  'bleu': ['printemps', 'ete'],
  'Bleu': ['printemps', 'ete'],
  'marine': ['hiver', 'ete'],
  'Marine': ['hiver', 'ete'],
  'rouge': ['hiver'],
  'Rouge': ['hiver'],
  'bordeaux': ['automne', 'hiver'],
  'Bordeaux': ['automne', 'hiver'],
  'rose': ['ete', 'printemps'],
  'Rose': ['ete', 'printemps'],
  'vert': ['printemps', 'automne'],
  'Vert': ['printemps', 'automne'],
  'kaki': ['automne'],
  'Kaki': ['automne'],
  'jaune': ['printemps', 'automne'],
  'Jaune': ['printemps', 'automne'],
  'marron': ['automne'],
  'Marron': ['automne'],
  'violet': ['hiver'],
  'Violet': ['hiver'],
  'corail': ['printemps'],
  'Corail': ['printemps'],
  'terracotta': ['automne'],
  'Terracotta': ['automne'],
  'lavande': ['ete'],
  'Lavande': ['ete'],
  'turquoise': ['printemps'],
  'Turquoise': ['printemps'],
  'rose_gold': ['printemps', 'ete'],
  'creme': ['printemps', 'ete'],
  'fuchsia': ['hiver'],
  'Fuchsia': ['hiver'],
  'multicolore': [],
  'Multicolore': [],
  // Motifs — score neutre pour tous
  'leopard': [],
  'fleuri': [],
  'raye': [],
  'carreaux': [],
  'geometrique': [],
};

// Hex values for season palette color names (for rendering circles)
export const SEASON_COLOR_HEX: Record<string, string> = {
  corail: '#FF7F50',
  peche: '#FFDAB9',
  vert_menthe: '#98FF98',
  bleu_ciel: '#87CEEB',
  turquoise: '#40E0D0',
  rose_saumon: '#FA8072',
  camel_clair: '#D2B48C',
  abricot: '#FBCEB1',
  ivoire: '#FFFFF0',
  beige: '#F5F5DC',
  jaune: '#FFD700',
  rose: '#FFB6C1',
  mauve: '#E0B0FF',
  lavande: '#E6E6FA',
  bleu: '#4682B4',
  gris: '#A9A9A9',
  blanc_casse: '#FAF0E6',
  vert: '#2E8B57',
  camel: '#C19A6B',
  terracotta: '#CC4E24',
  bordeaux: '#722F37',
  marron: '#8B4513',
  noir: '#1C1C1C',
  blanc: '#FFFFFF',
  rouge: '#DC143C',
  violet: '#8A2BE2',
};

export const SEASON_LABELS: Record<Season, { emoji: string; label: string; vibe: string }> = {
  printemps: { emoji: '🌸', label: 'Printemps', vibe: 'Les teintes chaudes te subliment ✨' },
  ete: { emoji: '🌊', label: 'Été', vibe: 'Les teintes douces te subliment ✨' },
  automne: { emoji: '🍂', label: 'Automne', vibe: 'Les teintes chaudes te subliment ✨' },
  hiver: { emoji: '❄️', label: 'Hiver', vibe: 'Les teintes intenses te subliment ✨' },
};

// ── Legacy exports (used by other components) ──

export interface ColorPalette {
  recommended: string[];
  avoid: string[];
}

const SKIN_PALETTES: Record<string, ColorPalette> = {
  'Très clair': {
    recommended: ['Marine', 'Bordeaux', 'Vert forêt', 'Gris', 'Blanc cassé', 'Rose poudré'],
    avoid: ['Orange vif', 'Jaune fluo', 'Beige'],
  },
  'Clair': {
    recommended: ['Marine', 'Bordeaux', 'Vert forêt', 'Gris', 'Blanc cassé', 'Rose poudré'],
    avoid: ['Orange vif', 'Jaune fluo', 'Beige'],
  },
  'Clair rosé': {
    recommended: ['Marine', 'Bordeaux', 'Vert forêt', 'Gris', 'Blanc cassé', 'Rose poudré'],
    avoid: ['Orange vif', 'Jaune fluo', 'Beige'],
  },
  'Beige doré': {
    recommended: ['Camel', 'Terracotta', 'Blanc', 'Vert olive', 'Bleu ciel', 'Corail'],
    avoid: ['Gris froid', 'Marron très foncé'],
  },
  'Miel': {
    recommended: ['Camel', 'Terracotta', 'Blanc', 'Vert olive', 'Bleu ciel', 'Corail'],
    avoid: ['Gris froid', 'Marron très foncé'],
  },
  'Caramel': {
    recommended: ['Blanc', 'Jaune', 'Orange', 'Fuchsia', 'Vert émeraude', 'Rouge'],
    avoid: ['Marron foncé', 'Gris sombre', 'Noir sur noir'],
  },
  'Brun': {
    recommended: ['Blanc', 'Jaune', 'Orange', 'Fuchsia', 'Vert émeraude', 'Rouge'],
    avoid: ['Marron foncé', 'Gris sombre', 'Noir sur noir'],
  },
  'Ébène': {
    recommended: ['Blanc', 'Jaune', 'Orange', 'Fuchsia', 'Vert émeraude', 'Rouge'],
    avoid: ['Marron foncé', 'Gris sombre', 'Noir sur noir'],
  },
};

const SKIN_KEY_TO_PALETTE: Record<string, string> = {
  'tres-clair': 'Très clair',
  'clair': 'Clair',
  'clair-rose': 'Clair rosé',
  'beige-dore': 'Beige doré',
  'miel': 'Miel',
  'caramel': 'Caramel',
  'brun': 'Brun',
  'ebene': 'Ébène',
};

export function getPaletteForSkin(skin: string): ColorPalette {
  const paletteName = SKIN_KEY_TO_PALETTE[skin] || skin;
  return SKIN_PALETTES[paletteName] || { recommended: [], avoid: [] };
}

const COLOR_TO_GROUP: Record<string, string[]> = {
  'Blanc': ['Blanc', 'Blanc cassé'],
  'Noir': ['Noir sur noir'],
  'Gris': ['Gris', 'Gris froid', 'Gris sombre'],
  'Beige': ['Beige', 'Camel'],
  'Bleu': ['Marine', 'Bleu ciel'],
  'Rouge': ['Rouge', 'Bordeaux'],
  'Rose': ['Rose poudré', 'Fuchsia', 'Corail'],
  'Vert': ['Vert forêt', 'Vert olive', 'Vert émeraude'],
  'Jaune': ['Jaune', 'Jaune fluo'],
  'Marron': ['Marron foncé', 'Marron très foncé', 'Camel', 'Terracotta'],
};

export function getColorMatch(clothingColor: string, palette: ColorPalette): 'recommended' | 'avoid' | 'neutral' {
  const groups = COLOR_TO_GROUP[clothingColor] || [clothingColor];
  if (groups.some(g => palette.recommended.includes(g))) return 'recommended';
  if (groups.some(g => palette.avoid.includes(g))) return 'avoid';
  return 'neutral';
}

export function getOutfitColorMatch(colors: string[], palette: ColorPalette): 'recommended' | 'avoid' | 'neutral' {
  const matches = colors.map(c => getColorMatch(c, palette));
  if (matches.some(m => m === 'recommended') && !matches.some(m => m === 'avoid')) return 'recommended';
  if (matches.some(m => m === 'avoid')) return 'avoid';
  return 'neutral';
}

export const SKIN_COLORS: Record<string, string> = {
  'Très clair': '#FDEBD0',
  'Clair': '#F5CBA7',
  'Clair rosé': '#F0B7A4',
  'Beige doré': '#D4A76A',
  'Miel': '#C8956C',
  'Caramel': '#A0724A',
  'Brun': '#7B5B3A',
  'Ébène': '#4A3728',
};

export const EYE_COLORS: Record<string, string> = {
  'Noisette': '#8B6914',
  'Marron': '#5C3317',
  'Vert': '#4E8B57',
  'Bleu': '#4682B4',
  'Gris': '#808080',
  'Noir': '#1C1C1C',
};

export const HAIR_COLORS: Record<string, string> = {
  'Noir': '#3B1F0A',
  'Brun foncé': '#5C2E00',
  'Brun': '#8B4513',
  'Châtain': '#A0784A',
  'Châtain clair': '#C8A87A',
  'Blond foncé': '#D4A95A',
  'Blond': '#F0D080',
  'Roux': '#C04A1A',
  'Rose': '#E875A0',
  'Violet': '#8A4FA8',
  'Bleu': '#1E90FF',
  'Gris/Argenté': '#C0C0C0',
};

export const PALETTE_COLORS: Record<string, string> = {
  'Marine': '#001F5B',
  'Bordeaux': '#722F37',
  'Vert forêt': '#228B22',
  'Gris': '#808080',
  'Blanc cassé': '#FAF0E6',
  'Rose poudré': '#E8C4C4',
  'Camel': '#C19A6B',
  'Terracotta': '#CC4E24',
  'Blanc': '#FFFFFF',
  'Vert olive': '#808000',
  'Bleu ciel': '#87CEEB',
  'Corail': '#FF7F50',
  'Jaune': '#FFD700',
  'Orange': '#FF8C00',
  'Fuchsia': '#FF00FF',
  'Vert émeraude': '#50C878',
  'Rouge': '#DC143C',
};

export function determineSeason(
  skin: string,
  eyeColor: string,
  hairColor: string
): Season {
  const artificialHair = ['rose', 'gris_argente'];
  const effectiveHair = artificialHair.includes(hairColor) ? null : hairColor;

  const lightSkins = ['tres_clair', 'clair', 'clair_rose'];
  const goldenSkins = ['beige_dore', 'miel'];
  const darkSkins = ['caramel', 'brun', 'ebene'];

  if (lightSkins.includes(skin)) {
    if (effectiveHair === null) {
      if (['bleu', 'vert', 'gris'].includes(eyeColor)) return 'ete';
      if (eyeColor === 'noisette') return 'printemps';
      return 'ete';
    }
    const warmHair = ['roux', 'blond', 'chatain_clair', 'blond_fonce'];
    if (warmHair.some(h => effectiveHair.includes(h)) &&
        ['bleu', 'vert', 'noisette'].includes(eyeColor)) return 'printemps';
    if (['chatain_clair', 'blond_cendre'].some(h => effectiveHair.includes(h))) return 'ete';
    if (['marron', 'noir'].includes(eyeColor)) return 'hiver';
    return 'ete';
  }

  if (goldenSkins.includes(skin)) {
    if (effectiveHair === null) {
      if (['vert', 'noisette'].includes(eyeColor)) return 'automne';
      return 'automne';
    }
    const warmDeep = ['roux', 'auburn', 'chatain_chaud', 'chatain', 'brun_chaud'];
    if (warmDeep.some(h => effectiveHair.includes(h))) return 'automne';
    if (effectiveHair.includes('blond_dore') &&
        ['bleu', 'vert', 'noisette'].includes(eyeColor)) return 'printemps';
    return 'automne';
  }

  if (darkSkins.includes(skin)) {
    if (effectiveHair === null) {
      if (eyeColor === 'noir') return 'hiver';
      return 'automne';
    }
    if (effectiveHair.includes('noir') && eyeColor === 'noir') return 'hiver';
    const warmDeep = ['roux', 'auburn', 'chatain_chaud'];
    if (warmDeep.some(h => effectiveHair.includes(h)) &&
        ['bleu', 'vert', 'noisette'].includes(eyeColor)) return 'printemps';
    return 'automne';
  }

  return 'ete';
}

export function getColorScore(itemColor: string, userSeason: Season): number {
  const normalized = itemColor?.trim().toLowerCase() ?? '';
  const seasons = COLOR_TO_SEASON[normalized] ??
                  COLOR_TO_SEASON[itemColor] ?? [];
  if (seasons.length === 0) return 0;
  if (seasons.includes(userSeason)) return 2;
  const palette = SEASON_PALETTES[userSeason];
  if (palette.avoid.some(a => normalized.includes(a))) return -1;
  return 0;
}
