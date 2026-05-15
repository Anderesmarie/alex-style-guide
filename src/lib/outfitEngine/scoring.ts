import { ClothingItem } from '../types';
import { OutfitCandidate, EngineInput } from './types';

const REMOVABLE_LAYERS = [
  'Blazer',
  'Veste en jean',
  'Trench',
  'Bomber',
  'Cardigan',
  'Veste militaire',
  'Veste coupe-vent', 'Veste en cuir', 'Perfecto',
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

    if (t === 'Veste en cuir') {
      if (tempMin >= 12 && tempMin <= 22) ({ score, reasons } = add(score, reasons, 1, 'Veste en cuir idéale mi-saison'));
      if (tempMin < 5) ({ score, reasons } = add(score, reasons, -1, 'Veste en cuir trop légère'));
      if (tempMax > 25) ({ score, reasons } = add(score, reasons, -2, 'Veste en cuir trop chaude'));
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

  // ---- Empilement / layering (températures fraîches) ----
  const hasCoat = items.some(it => it.category === 'Manteaux' || it.category === 'Manteaux & vestes');
  const hasPullCat = items.some(it => it.subcategory === 'Pulls & Mailles');
  const hasNoLayer = !hasCoat && !hasPullCat;
  const TSHIRT_LIKE = ['T-shirt', 'Crop top', 'Débardeur', 'Body', 'Top dos nu', 'Top épaules dénudées'];
  const tshirtItem = items.find(it => TSHIRT_LIKE.includes(it.type));
  const pullItem = items.find(it => it.subcategory === 'Pulls & Mailles');
  const removableItem = items.find(it => REMOVABLE_LAYERS.includes(it.type));
  const hasTshirt = !!tshirtItem;
  const hasPull = !!pullItem;
  const hasRemovableLayer = !!removableItem;
  const hasMidCoat = items.some(it => ['Trench', 'Manteau court'].includes(it.type));

  if (hasPull && !hasTshirt && hasNoLayer && tempMin < 15) {
    ({ score, reasons } = add(score, reasons, -3, `Pull seul insuffisant à ${tempMin}°C`));
  }
  if (hasTshirt && !hasPull && hasNoLayer && tempMin < 12) {
    ({ score, reasons } = add(score, reasons, -3, `T-shirt seul insuffisant à ${tempMin}°C`));
  }
  if (hasTshirt && hasPull && tempMin < 15) {
    ({ score, reasons } = add(score, reasons, 3, 'T-shirt + pull bien adapté'));
  }
  if (hasTshirt && hasRemovableLayer && tempMin < 15 && tempMax >= 17) {
    ({ score, reasons } = add(score, reasons, 3, 'T-shirt + couche amovible idéal'));
  }
  if (hasPull && hasMidCoat && tempMin < 12) {
    ({ score, reasons } = add(score, reasons, 3, 'Pull + manteau au frais'));
  }
  if (hasTshirt && hasPull && hasRemovableLayer && amplitude >= 8) {
    ({ score, reasons } = add(score, reasons, 4, 'Triple couche pour forte amplitude'));
  }
  // Bonus couche amovible quand il fait frais le matin (mi-saison type 11-18°C)
  if (hasRemovableLayer && tempMin < 14 && tempMax <= 22) {
    ({ score, reasons } = add(score, reasons, 2, 'Couche amovible adaptée à la mi-saison'));
  }
  // Pénalité : ni couche ni pull en mi-saison fraîche
  if (hasNoLayer && tempMin < 13) {
    ({ score, reasons } = add(score, reasons, -2, `Pas de couche pour ${tempMin}°C`));
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

  // ---- Pièces par style favori ----
  const styleMap: Record<string, { plus: string[]; minus: string[]; minusDelta?: number }> = {
    'Old Money': {
      plus: ['Blazer', 'Manteau long', 'Manteau court', 'Trench', 'Pantalon droit', 'Pantalon large', 'Cardigan', 'Pull col roulé', 'Pull col V', 'Chemise', 'Robe midi', 'Robe longue', 'Mocassins / Loafers'],
      minus: ['Jogging', 'Hoodie', 'Baskets'],
    },
    'Streetwear': {
      plus: ['Hoodie', 'Sweat', 'Bomber', 'Jogging', 'Pantalon cargo', 'Short cargo', 'Baskets'],
      minus: ['Escarpins', 'Robe habillée'],
    },
    'Y2K': {
      plus: ['Crop top', 'Top corset / Bralette', 'Mini-jupe', 'Robe mini', 'Combishort', 'Top dos nu'],
      minus: ['Manteau long', 'Pantalon droit'],
    },
    'Casual chic': {
      plus: ['Blazer', 'Jean droit', 'Jean taille haute', 'Chemise', 'Blouse', 'Robe casual', 'Robe midi', 'Mocassins / Loafers', 'Baskets'],
      minus: ['Jogging', 'Hoodie'],
      minusDelta: -1,
    },
    'Romantique': {
      plus: ['Robe midi', 'Robe longue', 'Robe sans bretelles', 'Jupe plissée', 'Jupe évasée', 'Blouse', 'Top dos nu'],
      minus: ['Jogging', 'Veste militaire'],
    },
    'Bohème': {
      plus: ['Jupe longue', 'Robe longue', 'Blouse', 'Cardigan', 'Veste en jean', 'Sandales plates'],
      minus: ['Escarpins', 'Blazer'],
    },
    'Minimaliste': {
      plus: ['T-shirt', 'Pantalon droit', 'Robe casual', 'Manteau court', 'Jean droit'],
      minus: ['Top corset / Bralette', 'Jupe plissée'],
    },
    'Grunge': {
      plus: ['Veste en jean', 'Perfecto', 'Chemise', 'Boots / Bottines', 'Mini-jupe', 'Jean boyfriend'],
      minus: ['Robe habillée', 'Escarpins'],
    },
    'Dark': {
      plus: ['Perfecto', 'Manteau long', 'Robe habillée', 'Boots / Bottines', 'Bottes hautes', 'Jean skinny'],
      minus: ['Robe sans bretelles'],
    },
    'Vintage': {
      plus: ['Jean évasé', 'Jean boyfriend', 'Chemise', 'Veste en jean', 'Robe midi', 'Cardigan', 'Mocassins / Loafers'],
      minus: ['Jogging', 'Baskets'],
    },
    'Preppy': {
      plus: ['Blazer', 'Chemise', 'Jupe plissée', 'Pantalon droit', 'Pull col V', 'Pull col rond', 'Mocassins / Loafers', 'Robe midi'],
      minus: ['Jogging', 'Crop top'],
    },
    'Sportswear': {
      plus: ['Legging', 'Sweat', 'Hoodie', 'Short taille haute', 'Baskets', 'Jogging'],
      minus: ['Escarpins', 'Robe habillée', 'Blazer'],
    },
  };

  const favStyles = input.favStyles || [];
  for (const style of favStyles) {
    const rules = styleMap[style];
    if (!rules) continue;
    for (const it of items) {
      const itemStyles = it.style || [];
      if (!itemStyles.includes(style)) continue;
      if (rules.plus.includes(it.type)) {
        ({ score, reasons } = add(score, reasons, 2, `${it.type} parfait ${style}`));
      }
      if (rules.minus.includes(it.type)) {
        const delta = rules.minusDelta ?? -2;
        ({ score, reasons } = add(score, reasons, delta, `${it.type} hors style ${style}`));
      }
    }
  }

  // ---- Chaussures ----
  const shoes = items.find(i => i.category === 'Chaussures');
  if (shoes) {
    const ss = shoes.style || [];
    const has = (...names: string[]) => names.some(n => ss.includes(n));
    const occ = shoes.occasion || [];
    const hasOcc = (...names: string[]) => names.some(n => occ.includes(n));

    switch (shoes.type) {
      case 'Baskets':
        if (has('Casual chic', 'Streetwear', 'Y2K')) ({ score, reasons } = add(score, reasons, 1, 'Baskets dans le style'));
        if (tempMax > 15) ({ score, reasons } = add(score, reasons, 1, 'Baskets adaptées'));
        if (has('Old Money')) ({ score, reasons } = add(score, reasons, -1, 'Baskets vs Old Money'));
        break;
      case 'Escarpins':
        if (has('Old Money', 'Casual chic', 'Romantique')) ({ score, reasons } = add(score, reasons, 2, 'Escarpins parfaits'));
        if (tempMin < 5) ({ score, reasons } = add(score, reasons, -1, 'Escarpins par grand froid'));
        if (has('Streetwear', 'Sportswear')) ({ score, reasons } = add(score, reasons, -3, 'Escarpins hors style'));
        break;
      case 'Sandales plates':
        if (tempMax > 22) ({ score, reasons } = add(score, reasons, 1, 'Sandales plates pour la chaleur'));
        if (has('Bohème', 'Casual chic')) ({ score, reasons } = add(score, reasons, 1, 'Sandales plates dans le style'));
        if (tempMin < 18) ({ score, reasons } = add(score, reasons, -2, 'Sandales plates trop fraîches'));
        break;
      case 'Sandales à talons':
        if (has('Casual chic', 'Romantique', 'Old Money')) ({ score, reasons } = add(score, reasons, 1, 'Sandales à talons chic'));
        if (tempMin < 15) ({ score, reasons } = add(score, reasons, -1, 'Sandales à talons trop fraîches'));
        if (has('Streetwear', 'Sportswear')) ({ score, reasons } = add(score, reasons, -2, 'Sandales à talons hors style'));
        break;
      case 'Boots / Bottines':
        if (tempMin < 15) ({ score, reasons } = add(score, reasons, 1, 'Bottines au frais'));
        if (has('Grunge', 'Dark', 'Casual chic')) ({ score, reasons } = add(score, reasons, 1, 'Bottines dans le style'));
        if (tempMax > 25) ({ score, reasons } = add(score, reasons, -2, 'Bottines trop chaudes'));
        break;
      case 'Bottes hautes':
        if (tempMin < 10) ({ score, reasons } = add(score, reasons, 1, 'Bottes hautes au froid'));
        if (has('Dark', 'Grunge', 'Old Money')) ({ score, reasons } = add(score, reasons, 1, 'Bottes hautes dans le style'));
        if (tempMax > 20) ({ score, reasons } = add(score, reasons, -2, 'Bottes hautes trop chaudes'));
        break;
      case 'Mocassins / Loafers':
        if (has('Old Money', 'Preppy', 'Casual chic')) ({ score, reasons } = add(score, reasons, 2, 'Mocassins parfaits'));
        if (has('Streetwear', 'Sportswear')) ({ score, reasons } = add(score, reasons, -1, 'Mocassins hors style'));
        break;
      case 'Ballerines':
        if (has('Romantique', 'Casual chic', 'Preppy')) ({ score, reasons } = add(score, reasons, 1, 'Ballerines dans le style'));
        break;
      case 'Claquettes / Mules':
        if (tempMax > 22) ({ score, reasons } = add(score, reasons, 1, 'Mules pour la chaleur'));
        if (has('Streetwear', 'Y2K')) ({ score, reasons } = add(score, reasons, 1, 'Mules dans le style'));
        if (hasOcc('Cérémonie', 'Bureau')) ({ score, reasons } = add(score, reasons, -2, 'Mules inadaptées'));
        break;
    }
  }

  // ---- Styles mixables ----
  const allStyles = items.flatMap(i => i.style || []);
  const hasStyle = (...styles: string[]) => styles.every(s => allStyles.includes(s));

  if (hasStyle('Casual chic', 'Streetwear')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Casual chic + Streetwear'));
  }
  if (hasStyle('Casual chic', 'Old Money')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Casual chic + Old Money'));
  }
  if (hasStyle('Casual chic', 'Bohème')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Casual chic + Bohème'));
  }
  if (hasStyle('Old Money', 'Preppy')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Old Money + Preppy'));
  }
  if (hasStyle('Y2K', 'Streetwear')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Y2K + Streetwear'));
  }
  if (hasStyle('Bohème', 'Vintage')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Bohème + Vintage'));
  }
  if (hasStyle('Romantique', 'Y2K')) {
    ({ score, reasons } = add(score, reasons, 1, 'Mix Romantique + Y2K'));
  }

  if (hasStyle('Sportswear', 'Old Money')) {
    ({ score, reasons } = add(score, reasons, -2, 'Clash Sportswear + Old Money'));
  }
  if (hasStyle('Sportswear', 'Romantique')) {
    ({ score, reasons } = add(score, reasons, -2, 'Clash Sportswear + Romantique'));
  }
  if (hasStyle('Dark', 'Romantique')) {
    ({ score, reasons } = add(score, reasons, -1, 'Clash Dark + Romantique'));
  }
  if (hasStyle('Grunge', 'Old Money')) {
    ({ score, reasons } = add(score, reasons, -2, 'Clash Grunge + Old Money'));
  }
  if (hasStyle('Minimaliste', 'Y2K')) {
    ({ score, reasons } = add(score, reasons, -1, 'Clash Minimaliste + Y2K'));
  }

  // ---- Anti-répétition ----
  const currentIds = items.map(i => i.id).sort().join(',');
  if (input.recentOutfitIds && input.recentOutfitIds.length > 0) {
    for (let i = 0; i < input.recentOutfitIds.length; i++) {
      const pastIds = [...input.recentOutfitIds[i]].sort().join(',');
      if (pastIds !== currentIds) continue;
      if (i === 0) {
        ({ score, reasons } = add(score, reasons, -5, 'Tenue identique à hier'));
      } else if (i <= 2) {
        ({ score, reasons } = add(score, reasons, -3, 'Tenue portée récemment'));
      } else if (i <= 13) {
        ({ score, reasons } = add(score, reasons, -1, 'Tenue déjà portée'));
      }
      break;
    }
  }

  // ---- Pièces non aimées ----
  if (input.dislikedItemIds && input.dislikedItemIds.length > 0) {
    for (const it of items) {
      if (input.dislikedItemIds.includes(it.id)) {
        ({ score, reasons } = add(score, reasons, -10, 'Pièce non aimée'));
      }
    }
  }

  // ---- Bonus tenue sauvegardée ----
  if (input.savedOutfitItemIds && input.savedOutfitItemIds.length > 0) {
    const isSaved = input.savedOutfitItemIds.some(
      ids => [...ids].sort().join(',') === currentIds
    );
    if (isSaved) {
      ({ score, reasons } = add(score, reasons, 3, 'Tenue sauvegardée'));
    }
  }

  // ---- Bonus pièce non vue 14 jours ----
  if (input.recentItemIds) {
    const recentSet = new Set(input.recentItemIds);
    for (const it of items) {
      if (!recentSet.has(it.id)) {
        ({ score, reasons } = add(score, reasons, 1, `${it.type} pas vu récemment`));
      }
    }
  }

  // ---- Bonus fraîcheur ----
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  for (const it of items) {
    const createdAt = (it as any).createdAt;
    if (!createdAt) continue;
    const ts = typeof createdAt === 'string' ? Date.parse(createdAt) : Number(createdAt);
    if (!isFinite(ts)) continue;
    if (now - ts < THIRTY_DAYS) {
      ({ score, reasons } = add(score, reasons, 1, `${it.type} récemment ajouté`));
    }
  }

  return { ...candidate, score, reasons };
}
