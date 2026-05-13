import { ClothingItem } from '../types';

const MAX_COMBOS = 500;

export function generateCombinations(wardrobe: ClothingItem[]): ClothingItem[][] {
  const hauts = wardrobe.filter(i => i.category === 'Hauts');
  const bas = wardrobe.filter(i => i.category === 'Bas');
  const robes = wardrobe.filter(i => i.category === 'Robes');
  const pulls = wardrobe.filter(i => i.subcategory === 'Pulls & Mailles');
  const manteaux = wardrobe.filter(i => i.category === 'Manteaux' || i.category === 'Manteaux & vestes');
  const chaussures = wardrobe.filter(i => i.category === 'Chaussures');

  // Phase 1 : combos de base (haut+bas ou robe)
  const baseCombos: ClothingItem[][] = [];
  const maxBase = chaussures.length > 0 ? Math.ceil(MAX_COMBOS / chaussures.length) : MAX_COMBOS;

  const hautOptions: (ClothingItem | null)[] = [null, ...hauts];
  const pullOptions: (ClothingItem | null)[] = [null, ...pulls];
  const manteauOptions: (ClothingItem | null)[] = [null, ...manteaux];

  // Chemin A : (haut et/ou pull) + bas + manteau optionnel
  // Génère : haut+bas, pull+bas, haut+pull+bas, +manteau pour chaque
  outerA: for (const b of bas) {
    for (const h of hautOptions) {
      for (const p of pullOptions) {
        if (!h && !p) continue; // il faut au moins un top
        for (const m of manteauOptions) {
          const combo: ClothingItem[] = [b];
          if (h) combo.push(h);
          if (p) combo.push(p);
          if (m) combo.push(m);
          baseCombos.push(combo);
          if (baseCombos.length >= maxBase) break outerA;
        }
      }
    }
  }

  if (baseCombos.length < maxBase) {
    outerB: for (const r of robes) {
      for (const m of manteauOptions) {
        const combo: ClothingItem[] = [r];
        if (m) combo.push(m);
        baseCombos.push(combo);
        if (baseCombos.length >= maxBase) break outerB;
      }
    }
  }

  // Phase 2 : ajouter les chaussures à chaque combo de base
  const combos: ClothingItem[][] = [];

  for (const base of baseCombos) {
    if (chaussures.length > 0) {
      for (const c of chaussures) {
        combos.push([...base, c]);
        if (combos.length >= MAX_COMBOS) return combos;
      }
    } else {
      combos.push(base);
      if (combos.length >= MAX_COMBOS) return combos;
    }
  }

  return combos;
}
