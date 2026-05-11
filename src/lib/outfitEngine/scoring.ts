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

  // ---- Morphologie ----
  const fit = (it: ClothingItem) => norm(it.fit);
  const tex = (it: ClothingItem) => norm(it.matiere) + ' ' + norm(it.texture);
  const isHighHeel = (it: ClothingItem) =>
    ['Escarpins', 'Sandales à talons'].includes(it.type);

  if (input.morphologie === 'A') {
    for (const it of items) {
      if (it.type === 'Jean évasé') ({ score, reasons } = add(score, reasons, 2, 'Jean évasé flatteur (A)'));
      if (it.type === 'Jupe évasée') ({ score, reasons } = add(score, reasons, 2, 'Jupe évasée flatteuse (A)'));
      if (it.type === 'Blazer') ({ score, reasons } = add(score, reasons, 2, 'Blazer structurant (A)'));
      if (it.type === 'Jean skinny') ({ score, reasons } = add(score, reasons, -2, 'Jean skinny peu flatteur (A)'));
      if (it.type === 'Jupe crayon') ({ score, reasons } = add(score, reasons, -2, 'Jupe crayon peu flatteuse (A)'));
      if (it.type === 'Jupe moulante') ({ score, reasons } = add(score, reasons, -2, 'Jupe moulante peu flatteuse (A)'));
    }
  }
  if (input.morphologie === 'H') {
    for (const it of items) {
      if (it.type === 'Cardigan') ({ score, reasons } = add(score, reasons, 2, 'Cardigan structure (H)'));
      if (it.type === 'Pantalon droit') ({ score, reasons } = add(score, reasons, 2, 'Pantalon droit (H)'));
      if (it.type === 'Ceinture') ({ score, reasons } = add(score, reasons, 1, 'Ceinture marque la taille (H)'));
      if (fit(it).includes('oversize')) ({ score, reasons } = add(score, reasons, -1, 'Oversize peu flatteur (H)'));
    }
  }
  if (input.morphologie === 'X') {
    for (const it of items) {
      if (fit(it).includes('ajust')) ({ score, reasons } = add(score, reasons, 2, 'Coupe ajustée (X)'));
      if (['Robe midi', 'Robe longue', 'Robe habillée'].includes(it.type)) {
        ({ score, reasons } = add(score, reasons, 2, `${it.type} flatteuse (X)`));
      }
      if (fit(it).includes('oversize')) ({ score, reasons } = add(score, reasons, -1, 'Oversize cache la silhouette (X)'));
    }
  }
  if (input.morphologie === 'V') {
    for (const it of items) {
      if (['Jupe évasée', 'Jupe plissée'].includes(it.type)) {
        ({ score, reasons } = add(score, reasons, 2, `${it.type} équilibre (V)`));
      }
      if (it.type === 'Pantalon large') ({ score, reasons } = add(score, reasons, 2, 'Pantalon large (V)'));
      if (fit(it).includes('oversize')) ({ score, reasons } = add(score, reasons, -1, 'Oversize accentue les épaules (V)'));
    }
  }
  if (input.morphologie === 'O') {
    for (const it of items) {
      const t = tex(it);
      if (t.includes('satin') || t.includes('lin')) ({ score, reasons } = add(score, reasons, 2, 'Texture fluide (O)'));
      const cs = colorTokens(it);
      if (cs.some(c => c.includes('noir') || c.includes('marine') || c.includes('bordeaux'))) {
        ({ score, reasons } = add(score, reasons, 1, 'Couleur affinante (O)'));
      }
      if (['Jupe moulante', 'Jupe crayon'].includes(it.type)) {
        ({ score, reasons } = add(score, reasons, -2, `${it.type} peu flatteuse (O)`));
      }
    }
  }
  if (input.morphologie === '8') {
    for (const it of items) {
      if (fit(it).includes('ajust')) ({ score, reasons } = add(score, reasons, 2, 'Coupe ajustée (8)'));
      if (it.type === 'Jean taille haute') ({ score, reasons } = add(score, reasons, 2, 'Jean taille haute (8)'));
      if (fit(it).includes('oversize')) ({ score, reasons } = add(score, reasons, -1, 'Oversize cache la silhouette (8)'));
    }
  }

  // ---- Taille ----
  if (input.taille === 'petite') {
    for (const it of items) {
      if (['Robe midi', 'Jupe mi-longue'].includes(it.type)) {
        ({ score, reasons } = add(score, reasons, 2, `${it.type} allongeante`));
      }
      if (isHighHeel(it)) ({ score, reasons } = add(score, reasons, 1, 'Talons allongent'));
      if (['Pantalon large', 'Pantalon cargo'].includes(it.type)) {
        ({ score, reasons } = add(score, reasons, -2, `${it.type} tasse la silhouette`));
      }
      if (it.type === 'Manteau long') ({ score, reasons } = add(score, reasons, -1, 'Manteau long écrasant'));
    }
  }
  if (input.taille === 'grande') {
    for (const it of items) {
      if (['Robe longue', 'Pantalon large'].includes(it.type)) {
        ({ score, reasons } = add(score, reasons, 2, `${it.type} met en valeur`));
      }
    }
  }

  // ---- Corpulence ----
  if (input.corpulence === 'ronde') {
    for (const it of items) {
      const t = tex(it);
      if (t.includes('satin') || t.includes('lin')) ({ score, reasons } = add(score, reasons, 2, 'Texture fluide flatteuse'));
      const cs = colorTokens(it);
      if (cs.some(c => c.includes('noir') || c.includes('marine') || c.includes('bordeaux') || c.includes('sombre'))) {
        ({ score, reasons } = add(score, reasons, 1, 'Couleur sombre affinante'));
      }
    }
  }
  if (input.corpulence === 'fine') {
    for (const it of items) {
      const t = tex(it);
      if (t.includes('denim') || t.includes('coton') || t.includes('maille')) {
        ({ score, reasons } = add(score, reasons, 1, 'Texture qui ajoute du volume'));
      }
      if (fit(it).includes('oversize')) ({ score, reasons } = add(score, reasons, 1, 'Oversize stylé'));
    }
  }

  // ---- Colorimétrie ----
  const colorimetryMap: Record<string, { good: string[]; bad: string[] }> = {
    'Printemps': {
      good: ['corail', 'rose', 'turquoise', 'bleu-ciel', 'bleu ciel', 'camel'],
      bad: ['noir', 'bordeaux', 'violet'],
    },
    'Été': {
      good: ['rose', 'lavande', 'bleu', 'gris', 'creme', 'crème'],
      bad: ['orange', 'rouge', 'marron'],
    },
    'Automne': {
      good: ['camel', 'terracotta', 'kaki', 'bordeaux', 'marron'],
      bad: ['rose', 'blanc'],
    },
    'Hiver': {
      good: ['noir', 'blanc', 'rouge', 'bleu', 'fuchsia', 'violet'],
      bad: ['beige', 'camel', 'orange'],
    },
  };
  const palette = input.colorimetry ? colorimetryMap[input.colorimetry] : null;
  if (palette) {
    for (const it of items) {
      const cs = colorTokens(it);
      if (cs.some(c => palette.good.some(g => c.includes(g)))) {
        ({ score, reasons } = add(score, reasons, 2, `Couleur ${input.colorimetry}`));
      }
      if (cs.some(c => palette.bad.some(b => c.includes(b)))) {
        ({ score, reasons } = add(score, reasons, -1, `Couleur peu adaptée ${input.colorimetry}`));
      }
    }
  }

  return { ...candidate, score, reasons };
}
