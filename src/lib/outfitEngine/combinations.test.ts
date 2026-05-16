import { describe, it, expect } from 'vitest';
import { generateCombinations } from './combinations';
import { ClothingItem } from '../types';

let idSeq = 0;
function item(category: string, type: string, subcategory = ''): ClothingItem {
  return {
    id: `i${++idSeq}`,
    imageBase64: '',
    category,
    subcategory,
    layer: 0,
    type,
    color: ['noir'],
    season: ['Toutes saisons'],
    style: [],
    occasion: [],
  };
}

function makeMany(category: string, type: string, n: number, subcategory = ''): ClothingItem[] {
  return Array.from({ length: n }, () => item(category, type, subcategory));
}

describe('generateCombinations - dresses representation', () => {
  it('inclut des combos avec robe même quand le dressing contient beaucoup de hauts/pulls/bas', () => {
    const wardrobe: ClothingItem[] = [
      ...makeMany('Hauts', 'T-shirt', 20),
      ...makeMany('Pulls & Mailles', 'Pull col rond', 10, 'Pulls & Mailles'),
      ...makeMany('Bas', 'Jean droit', 15),
      ...makeMany('Manteaux & vestes', 'Blazer', 5, 'Vestes'),
      ...makeMany('Chaussures', 'Baskets', 3),
      ...makeMany('Robes', 'Robe midi', 4),
    ];

    const combos = generateCombinations(wardrobe);
    const robeCombos = combos.filter(c => c.some(it => it.category === 'Robes'));

    expect(combos.length).toBeGreaterThan(0);
    expect(robeCombos.length).toBeGreaterThan(0);
  });

  it("propose chaque robe dans au moins une combinaison", () => {
    const wardrobe: ClothingItem[] = [
      ...makeMany('Hauts', 'T-shirt', 30),
      ...makeMany('Pulls & Mailles', 'Pull col rond', 8, 'Pulls & Mailles'),
      ...makeMany('Bas', 'Jean droit', 10),
      ...makeMany('Chaussures', 'Baskets', 2),
      ...makeMany('Robes', 'Robe midi', 3),
    ];
    const robeIds = wardrobe.filter(i => i.category === 'Robes').map(i => i.id);

    const combos = generateCombinations(wardrobe);
    const seen = new Set<string>();
    for (const c of combos) {
      for (const it of c) if (it.category === 'Robes') seen.add(it.id);
    }

    for (const id of robeIds) {
      expect(seen.has(id)).toBe(true);
    }
  });

  it('fonctionne sans hauts/bas (uniquement robes + chaussures)', () => {
    const wardrobe: ClothingItem[] = [
      ...makeMany('Robes', 'Robe midi', 3),
      ...makeMany('Chaussures', 'Baskets', 2),
    ];
    const combos = generateCombinations(wardrobe);
    expect(combos.length).toBeGreaterThan(0);
    expect(combos.every(c => c.some(it => it.category === 'Robes'))).toBe(true);
  });
});
