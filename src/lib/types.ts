export interface ClothingItem {
  id: string;
  imageBase64: string;
  category: string;
  subcategory: string;
  layer: number;
  type: string;
  color: string;
  season: string[];
  style: string[];
  occasion: string[];
  brand?: string;
  price?: number;
  matiere?: string;
  pattern?: string;
  texture?: string;
  length?: string;
  fit?: string;
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
  taille: 'petite' | 'moyenne' | 'grande' | null;
  corpulence: 'fine' | 'medium' | 'ronde' | null;
  morphologie: 'A' | 'H' | 'X' | 'V' | 'O' | '8' | null;
  favorite_colors: string[];
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

export interface CalendarEvent {
  id: string;
  userId: string;
  date: string;
  outfitId: string | null;
  eventName: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface TripDay {
  id: string;
  tripId: string;
  date: string;
  outfitId: string | null;
  eventName: string | null;
  createdAt: string;
}

export interface DailyCounter {
  date: string;
  count: number;
}

export type TabId = 'today' | 'dressing' | 'outfits' | 'analysis' | 'profile';

export const TYPES = ['T-shirt', 'Chemise', 'Pull', 'Jean', 'Pantalon', 'Jupe', 'Robe', 'Veste', 'Manteau', 'Chaussures', 'Sac', 'Accessoires'] as const;
export const COLORS = ['Blanc', 'Noir', 'Gris', 'Beige', 'Bleu', 'Rouge', 'Rose', 'Vert', 'Jaune', 'Marron'] as const;
export const SEASONS = ['Été', 'Automne', 'Hiver', 'Printemps', 'Toutes saisons'] as const;
export const STYLES = ['Casual', 'Chic', 'Sport', 'Boho', 'Bureau'] as const;
export const OCCASIONS = ['Travail', 'Sortie', 'Sport', 'Événement', 'Quotidien'] as const;
const SILHOUETTE_BASE_URL = 'https://tseermbuwyrzcrulhxba.supabase.co/storage/v1/object/public/silhouettes/';

export const SILHOUETTES = [
  { label: 'Sablier', emoji: 'X', image: `${SILHOUETTE_BASE_URL}silhouette_X_sablier.png` },
  { label: 'Rectangle', emoji: 'H', image: `${SILHOUETTE_BASE_URL}silhouette_H_rectangle.png` },
  { label: 'Triangle', emoji: 'A', image: `${SILHOUETTE_BASE_URL}silhouette_A_triangle.png` },
  { label: 'Triangle inversé', emoji: 'V', image: `${SILHOUETTE_BASE_URL}silhouette_V_triangle_inverse.png` },
  { label: 'Ovale', emoji: 'O', image: `${SILHOUETTE_BASE_URL}silhouette_O_ovale.png` },
  { label: '8', emoji: '8', image: `${SILHOUETTE_BASE_URL}silhouette_8_autre.png` },
] as const;
export const STYLE_OPTIONS = [
  { label: 'Casual chic', emoji: '*' },
  { label: 'Streetwear', emoji: 'K' },
  { label: 'Y2K', emoji: 'Y' },
  { label: 'Vintage', emoji: 'V' },
  { label: 'Sportswear', emoji: 'S' },
  { label: 'Bohème', emoji: 'B' },
  { label: 'Minimaliste', emoji: 'M' },
  { label: 'Grunge', emoji: 'G' },
  { label: 'Dark', emoji: 'D' },
  { label: 'Romantique', emoji: 'R' },
  { label: 'Old Money', emoji: 'O' },
  { label: 'Preppy', emoji: 'P' },
] as const;
export const BRAND_SUGGESTIONS = ['Zara', 'H&M', 'Shein', 'Sézane', 'Vinted', 'Mango', 'Bershka'] as const;
