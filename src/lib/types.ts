export interface ClothingItem {
  id: string;
  imageBase64: string;
  category: string;
  subcategory: string;
  type: string;
  color: string;
  season: string[];
  style: string[];
  occasion: string[];
  brand?: string;
  price?: number;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
}

export interface UserProfile {
  silhouette: string;
  styles: string[];
  budget: number;
  brands: string[];
}

export interface AvatarConfig {
  skin: string;
  faceShape: string;
  eyeColor: string;
  eyeShape: string;
  browShape: string;
  browColor: string;
  noseShape: string;
  lipsShape: string;
  lipsColor: string;
  hairStyle: string;
  hairColor: string;
  extras: string[];
}

export interface AuthData {
  email: string;
  date: string;
}

export interface DailyCounter {
  date: string;
  count: number;
}

export type TabId = 'today' | 'dressing' | 'outfits' | 'profile';

export const TYPES = ['T-shirt', 'Chemise', 'Pull', 'Jean', 'Pantalon', 'Jupe', 'Robe', 'Veste', 'Manteau', 'Chaussures', 'Sac', 'Accessoires'] as const;
export const COLORS = ['Blanc', 'Noir', 'Gris', 'Beige', 'Bleu', 'Rouge', 'Rose', 'Vert', 'Jaune', 'Marron'] as const;
export const SEASONS = ['Été', 'Automne', 'Hiver', 'Printemps', 'Toutes saisons'] as const;
export const STYLES = ['Casual', 'Chic', 'Sport', 'Boho', 'Bureau'] as const;
export const OCCASIONS = ['Travail', 'Sortie', 'Sport', 'Événement', 'Quotidien'] as const;
export const SILHOUETTES = [
  { label: 'Sablier', emoji: '⏳' },
  { label: 'Rectangle', emoji: '▬' },
  { label: 'Triangle', emoji: '▽' },
  { label: 'Triangle inversé', emoji: '△' },
  { label: 'Ovale', emoji: '⬭' },
  { label: 'Autre', emoji: '✦' },
] as const;
export const STYLE_OPTIONS = ['Casual chic', 'Élégant', 'Sportswear', 'Bohème', 'Minimaliste'] as const;
export const BRAND_SUGGESTIONS = ['Zara', 'H&M', 'Shein', 'Sézane', 'Vinted', 'Mango', 'Bershka'] as const;
