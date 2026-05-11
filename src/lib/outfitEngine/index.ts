import { EngineInput, OutfitCandidate } from './types';
import { generateCombinations } from './combinations';
import { applyFilters } from './filters';
import { applyScoring } from './scoring';

export function generateOutfits(input: EngineInput): OutfitCandidate[] {
  const combos = generateCombinations(input.wardrobe);

  const valid: OutfitCandidate[] = [];
  for (const items of combos) {
    const base: OutfitCandidate = {
      items,
      score: 0,
      reasons: [],
      blocked: false,
    };
    const filtered = applyFilters(base, input);
    if (filtered.blocked) continue;
    const scored = applyScoring(filtered, input);
    valid.push(scored);
  }

  valid.sort((a, b) => b.score - a.score);
  return valid.slice(0, 3);
}

export * from './types';
