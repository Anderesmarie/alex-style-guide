import { ClothingItem } from '../types';

export interface OutfitCandidate {
  items: ClothingItem[];
  score: number;
  reasons: string[];
  blocked: boolean;
  blockReason?: string;
}

export interface EngineInput {
  wardrobe: ClothingItem[];
  tempMin: number;
  tempMax: number;
  amplitude: number;
  occasion: string;
  moodOverride?: string | null;
  morphologie?: 'A' | 'H' | 'X' | 'V' | 'O' | '8' | null;
  taille?: 'petite' | 'moyenne' | 'grande' | null;
  corpulence?: 'fine' | 'medium' | 'ronde' | null;
  colorimetry?: string;
  favStyles?: string[];
  recentOutfitIds?: string[][];
  dislikedItemIds?: string[];
  savedOutfitItemIds?: string[][];
  recentItemIds?: string[];
  favoriteColors?: string[];
  wornItemIds?: string[];
}
