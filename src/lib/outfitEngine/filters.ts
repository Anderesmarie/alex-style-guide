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

const COATS_AND_JACKETS_SUBS = ['Manteaux', 'Vestes'];
const SWEATERS_SUB = 'Pulls & Mailles';

function block(c: OutfitCandidate, reason: string): OutfitCandidate {
  return { ...c, blocked: true, blockReason: reason };
}

function isRobe(it: ClothingItem) {
  return it.category === 'Robes';
}
function isHaut(it: ClothingItem) {
  return it.category === 'Hauts';
}
function isBas(it: ClothingItem) {
  return it.category === 'Bas';
}
function isManteau(it: ClothingItem) {
  return it.category === 'Manteaux' || it.category === 'Manteaux & vestes';
}
function isChaussure(it: ClothingItem) {
  return it.category === 'Chaussures';
}
function isSac(it: ClothingItem) {
  return it.category === 'Sacs';
}

export function applyFilters(
  candidate: OutfitCandidate,
  input: EngineInput
): OutfitCandidate {
  const items = candidate.items;

  // ---- Structure ----
  const hauts = items.filter(isHaut);
  const robes = items.filter(isRobe);
  const bas = items.filter(isBas);
  const manteaux = items.filter(isManteau);
  const chaussures = items.filter(isChaussure);
  const sacs = items.filter(isSac);

  if (hauts.length === 0 && robes.length === 0) {
    return block(candidate, '🚫 Pas de vêtement principal (haut ou robe)');
  }
  if (robes.length > 0 && bas.length > 0) {
    return block(candidate, '🚫 Robe + bas incompatibles');
  }
  if (robes.length > 0 && hauts.length > 0) {
    return block(candidate, '🚫 Robe + haut incompatibles');
  }
  if (bas.length >= 2) return block(candidate, '🚫 Deux bas');
  if (robes.length >= 2) return block(candidate, '🚫 Deux robes');
  if (manteaux.length >= 2) return block(candidate, '🚫 Deux manteaux');
  if (chaussures.length >= 2) return block(candidate, '🚫 Deux paires de chaussures');
  if (sacs.length >= 2) return block(candidate, '🚫 Deux sacs');

  // ---- Météo ----
  const { tempMin, tempMax, amplitude } = input;

  if (tempMin >= 30) {
    const hasHeavy = items.some(
      it =>
        COATS_AND_JACKETS_SUBS.includes(it.subcategory) ||
        it.subcategory === SWEATERS_SUB
    );
    if (hasHeavy) {
      return block(candidate, '🚫 Trop chaud pour manteau/veste/pull');
    }
  }

  if (tempMin < 5) {
    const hasCoat = items.some(it => it.subcategory === 'Manteaux');
    if (!hasCoat) {
      return block(candidate, '🚫 Trop froid sans manteau');
    }
  }

  if (amplitude >= 15) {
    const hasRemovable = items.some(it => REMOVABLE_LAYERS.includes(it.type));
    if (!hasRemovable) {
      return block(candidate, '🚫 Amplitude forte sans couche amovible');
    }
  }

  // Pièce hors saison
  if (tempMax >= 25) {
    const offSeason = items.find(
      it =>
        Array.isArray(it.season) &&
        it.season.length > 0 &&
        !it.season.includes('Été') &&
        !it.season.includes('Toutes saisons')
    );
    if (offSeason) {
      return block(candidate, `🚫 ${offSeason.type} hors saison (chaud)`);
    }
  }
  if (tempMax < 5) {
    const offSeason = items.find(
      it =>
        Array.isArray(it.season) &&
        it.season.length > 0 &&
        !it.season.includes('Hiver') &&
        !it.season.includes('Toutes saisons')
    );
    if (offSeason) {
      return block(candidate, `🚫 ${offSeason.type} hors saison (froid)`);
    }
  }

  // ---- Style ----
  const norm = (s?: string) => (s || '').toLowerCase().trim();

  const hasSporty = items.some(it => ['Jogging', 'Legging'].includes(it.type));
  const hasHighHeels = items.some(it =>
    ['Escarpins', 'Sandales à talons'].includes(it.type)
  );
  if (hasSporty && hasHighHeels) {
    return block(candidate, '🚫 Jogging/Legging + talons');
  }

  const STRONG_PATTERNS = ['leopard', 'léopard', 'fleuri', 'tie-dye', 'tie dye', 'zebre', 'zébré', 'graphique'];
  const strongCount = items.filter(it => {
    const p = norm(it.pattern);
    return STRONG_PATTERNS.some(sp => p.includes(sp));
  }).length;
  if (strongCount >= 2) {
    return block(candidate, '🚫 Deux imprimés forts');
  }

  // ---- Couleurs ----
  const colors = items.map(it => norm(it.color));
  const hasRouge = colors.some(c => c.includes('rouge'));
  const hasCorail = colors.some(c => c.includes('corail'));
  if (hasRouge && hasCorail) {
    return block(candidate, '🚫 Rouge + corail');
  }

  return candidate;
}
