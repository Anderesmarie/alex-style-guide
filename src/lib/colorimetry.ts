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
  'blanc': ['hiver'],
  'blanc_casse': ['printemps', 'ete'],
  'noir': ['hiver'],
  'gris': ['ete', 'hiver'],
  'beige': ['printemps', 'automne'],
  'camel': ['automne'],
  'bleu': ['printemps', 'ete'],
  'rouge': ['hiver'],
  'bordeaux': ['automne', 'hiver'],
  'rose': ['ete', 'printemps'],
  'vert': ['printemps', 'automne'],
  'jaune': ['printemps', 'automne'],
  'marron': ['automne'],
  'terracotta': ['automne'],
  'corail': ['printemps'],
  'lavande': ['ete'],
  'violet': ['hiver'],
  'multicolore': [],
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
