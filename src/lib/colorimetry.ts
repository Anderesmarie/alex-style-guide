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

// Map new skin keys to palette names
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

// Map clothing color names to palette color groups for matching
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

// Skin tone color hex values for avatar rendering
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
  'Noir': '#1C1C1C',
  'Brun foncé': '#3B2F2F',
  'Brun': '#5C4033',
  'Châtain': '#8B6914',
  'Châtain clair': '#B8860B',
  'Blond foncé': '#C4A35A',
  'Blond': '#E8D5B7',
  'Roux': '#B7410E',
  'Rose': '#DB7093',
  'Gris/Argenté': '#A9A9A9',
};

// Palette color circles for Profile display
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
