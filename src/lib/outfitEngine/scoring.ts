import { ClothingItem } from '../types';
import { OutfitCandidate, EngineInput } from './types';

const REMOVABLE_LAYERS = [
  'Blazer',
  'Veste en jean',
  'Trench',
  'Bomber',
  'Cardigan',
  'Veste militaire',
  'Veste coupe-vent',
];

const NEUTRALS = ['blanc', 'noir', 'gris', 'beige', 'camel', 'marine', 'creme', 'crème', 'nude'];

const norm = (s?: string) => (s || '').toLowerCase().trim();

function colorTokens(it: ClothingItem): string[] {
  const raw: any = (it as any).color;
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((x: any) => norm(String(x))).filter(Boolean);
}

function isNeutral(c: string): boolean {
  return NEUTRALS.some(n => c.includes(n));
}

function add(score: number, reasons: string[], delta: number, reason: string) {
  return { score: score + delta, reasons: [...reasons, `${delta > 0 ? '+' : ''}${delta} ${reason}`] };
}

export function applyScoring(
  candidate: OutfitCandidate,
  input: EngineInput
): OutfitCandidate {
  let score = candidate.score;
  let reasons = [...candidate.reasons];
  const items = candidate.items;
  const { tempMin, tempMax, amplitude } = input;
  const tAvg = (tempMin + tempMax) / 2;

  // ---- Météo : par pièce ----
  for (const it of items) {
    const t = it.type;

    if (['T-shirt', 'Crop top', 'Débardeur', 'Body'].includes(t) && tempMin < 10) {
      ({ score, reasons } = add(score, reasons, -2, `${t} trop léger pour ${tempMin}°C`));
    }

    const isPull = ['Sweat', 'Hoodie', 'Cardigan'].includes(t) || t.startsWith('Pull');
    if (isPull) {
      if (tAvg > 25) ({ score, reasons } = add(score, reasons, -2, `${t} trop chaud`));
      if (tAvg < 12) ({ score, reasons } = add(score, reasons, 2, `${t} adapté au froid`));
    }

    const isHeavyCoat = ['Manteau long', 'Manteau court', 'Parka', 'Doudoune'].includes(t);
    if (isHeavyCoat) {
      if (tempMin < 10) ({ score, reasons } = add(score, reasons, 3, `${t} parfait pour ${tempMin}°C`));
      if (tAvg > 20) ({ score, reasons } = add(score, reasons, -3, `${t} trop chaud`));
    }

    if (['Blazer', 'Veste en jean', 'Trench'].includes(t) && tAvg >= 12 && tAvg <= 22) {
      ({ score, reasons } = add(score, reasons, 1, `${t} idéal mi-saison`));
    }

    const isMiniBottom = t === 'Mini-jupe' || it.subcategory === 'Shorts';
    if (isMiniBottom) {
      if (tAvg > 22) ({ score, reasons } = add(score, reasons, 1, `${t} parfait pour la chaleur`));
      if (tAvg < 15) ({ score, reasons } = add(score, reasons, -2, `${t} trop léger`));
    }

    const isSandal = it.subcategory === 'Sandales & Mules' || t.toLowerCase().includes('sandale');
    if (isSandal) {
      if (tAvg > 22) ({ score, reasons } = add(score, reasons, 1, `${t} parfait pour l'été`));
      if (tAvg < 18) ({ score, reasons } = add(score, reasons, -2, `${t} trop frais`));
    }

    if (['Boots / Bottines', 'Bottes hautes'].includes(t)) {
      if (tAvg < 15) ({ score, reasons } = add(score, reasons, 1, `${t} adapté au froid`));
      if (tAvg > 25) ({ score, reasons } = add(score, reasons, -2, `${t} trop chaud`));
    }
  }

  // ---- Météo : amplitude / couches ----
  const hasRemovable = items.some(it => REMOVABLE_LAYERS.includes(it.type));
  if (amplitude >= 15 && hasRemovable) {
    ({ score, reasons } = add(score, reasons, 3, 'Couche amovible pour forte amplitude'));
  } else if (amplitude >= 8 && hasRemovable) {
    ({ score, reasons } = add(score, reasons, 2, 'Couche amovible pratique'));
  } else if (amplitude >= 8 && !hasRemovable) {
    ({ score, reasons } = add(score, reasons, -2, 'Pas de couche amovible'));
  }

  // ---- Couleurs ----
  const allColors = items.flatMap(colorTokens);
  let neutralCount = 0;
  let vividCount = 0;
  for (const c of allColors) {
    if (isNeutral(c)) neutralCount++;
    else vividCount++;
  }

  if (neutralCount >= 2 && vividCount === 0) {
    ({ score, reasons } = add(score, reasons, 2, 'Palette neutre harmonieuse'));
  } else if (vividCount === 1 && neutralCount >= 1) {
    ({ score, reasons } = add(score, reasons, 1, 'Touche de couleur équilibrée'));
  } else if (vividCount >= 3 && neutralCount === 0) {
    ({ score, reasons } = add(score, reasons, -2, 'Trop de couleurs vives'));
  }

  return { ...candidate, score, reasons };
}
