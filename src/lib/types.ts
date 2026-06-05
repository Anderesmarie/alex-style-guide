export interface ClothingItem {
  id: string;
  /** URL publique Storage si disponible, sinon dataURL base64 (fallback legacy). Les composants affichent ce champ tel quel. */
  imageBase64: string;
  /** URL publique Storage (présente si la pièce a été migrée vers wardrobe-images). */
  imageUrl?: string | null;
  category: string;
  subcategory: string;
  layer: number;
  type: string;
  color: string[];
  season: string[];
  style: string[];
  occasion: string[];
  brand?: string;
  price?: number;
  
  pattern?: string;
  texture?: string;
  length?: string;
  fit?: string;
}

/** Normalise un champ couleur (legacy string ou nouveau string[]) en tableau. */
export function toColorArray(c: unknown): string[] {
  if (Array.isArray(c)) return c.map(x => String(x)).filter(Boolean);
  if (typeof c === 'string') return c.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

/** Représentation texte d'un champ couleur, pour affichage. */
export function colorLabel(c: unknown): string {
  return toColorArray(c).join(', ');
}

export interface OutfitLayoutPiece {
  itemId: string;
  x: number; // percentage 0-100 of canvas width (top-left of piece)
  y: number; // percentage 0-100 of canvas height
  size: number; // legacy: width in px (height auto). Editor: kept for back-compat (set to width in px ref canvas).
  w?: number; // percentage 0-100 width (editor)
  h?: number; // percentage 0-100 height (editor)
  z: number;
}

export interface OutfitLayoutData {
  canvasW: number; // reference canvas width in px
  canvasH: number; // reference canvas height in px
  pieces: OutfitLayoutPiece[];
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
  liked?: boolean;
  layoutData?: OutfitLayoutData | null;
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
  lifestyle?: 'Lycée' | 'Études sup' | 'Premier job' | 'Je travaille' | 'Autre' | null;
  styles_semaine?: string[];
  styles_weekend?: string[];
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
  occasion?: string | null;
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
  occasion: string;
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

export const OCCASIONS = ['Travail', 'Sortie', 'Sport', 'Événement', 'Quotidien', 'Plage', 'Cérémonie', 'Soirée', 'Cours lycée', 'Campus'] as const;
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
