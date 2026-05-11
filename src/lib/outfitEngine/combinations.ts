import { ClothingItem } from '../types';

const MAX_COMBOS = 500;

export function generateCombinations(wardrobe: ClothingItem[]): ClothingItem[][] {
  const hauts = wardrobe.filter(i => i.category === 'Hauts');
  const bas = wardrobe.filter(i => i.category === 'Bas');
  const robes = wardrobe.filter(i => i.category === 'Robes');
  const pulls = wardrobe.filter(i => i.subcategory === 'Pulls & Mailles');
  const manteaux = wardrobe.filter(i => i.category === 'Manteaux');

  const combos: ClothingItem[][] = [];

  // Path A: Haut + Bas (+ pull?) (+ manteau?)
  const pullOptions: (ClothingItem | null)[] = [null, ...pulls];
  const manteauOptions: (ClothingItem | null)[] = [null, ...manteaux];

  outerA: for (const h of hauts) {
    for (const b of bas) {
      for (const p of pullOptions) {
        if (p && p.id === h.id) continue;
        for (const m of manteauOptions) {
          const combo: ClothingItem[] = [h, b];
          if (p) combo.push(p);
          if (m) combo.push(m);
          combos.push(combo);
          if (combos.length >= MAX_COMBOS) break outerA;
        }
      }
    }
  }

  // Path B: Robe (+ manteau?)
  if (combos.length < MAX_COMBOS) {
    outerB: for (const r of robes) {
      for (const m of manteauOptions) {
        const combo: ClothingItem[] = [r];
        if (m) combo.push(m);
        combos.push(combo);
        if (combos.length >= MAX_COMBOS) break outerB;
      }
    }
  }

  return combos;
}
