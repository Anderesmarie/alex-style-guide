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
  return it.category === 'Manteaux';
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

  // ---- Limite globale ----
  const nbVetements = items.filter(i =>
    ['Hauts', 'Bas', 'Jupes', 'Robes', 'Manteaux'].includes(i.category)
  ).length;
  if (nbVetements > 4) {
    return block(candidate, '🚫 Maximum 4 vêtements par tenue');
  }

  // ---- Bijoux ----
  const colliers = items.filter(i => i.type === 'Collier');
  if (colliers.length > 1) {
    return block(candidate, '🚫 Max 1 collier par tenue');
  }

  // ---- Maillots ----
  const maillots = items.filter(i => i.category === 'Maillots');
  if (maillots.length > 0) {
    if (bas.length > 0) {
      return block(candidate, '🚫 Maillot + bas incompatibles');
    }
    if (robes.length > 0) {
      return block(candidate, '🚫 Maillot + robe incompatibles');
    }
    const occ = (input.occasion || '').toLowerCase();
    if (occ !== 'sport' && occ !== 'plage') {
      return block(candidate, '🚫 Maillot uniquement pour Sport ou Plage');
    }
  }

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

  // Dès qu'il fait chaud (tempMax >= 25), on bloque les pulls/mailles
  // et les manteaux. Au-delà de 22°C en minimum, on bloque aussi les vestes.
  if (tempMax >= 25) {
    const hasSweater = items.some(it => it.subcategory === SWEATERS_SUB);
    if (hasSweater) {
      return block(candidate, '🚫 Trop chaud pour un pull');
    }
    const hasCoat = items.some(it => it.subcategory === 'Manteaux' || it.category === 'Manteaux');
    if (hasCoat) {
      return block(candidate, '🚫 Trop chaud pour un manteau');
    }
  }
  if (tempMin >= 22) {
    const hasJacket = items.some(it => it.subcategory === 'Vestes');
    if (hasJacket) {
      return block(candidate, '🚫 Trop chaud pour une veste');
    }
  }

  // Pull + veste/manteau ensemble : seulement quand il fait vraiment frais
  const hasSweaterLayer = items.some(it => it.subcategory === SWEATERS_SUB);
  const hasOuterLayer = items.some(
    it => COATS_AND_JACKETS_SUBS.includes(it.subcategory) || it.category === 'Manteaux'
  );
  if (hasSweaterLayer && hasOuterLayer && tempMin >= 15) {
    return block(candidate, '🚫 Pull + veste/manteau inutile à cette température');
  }

  if (tempMin < 5) {
    const hasCoat = items.some(it => it.subcategory === 'Manteaux');
    if (!hasCoat) {
      return block(candidate, '🚫 Trop froid sans manteau');
    }
  }

  if (tempMin < 14) {
    const hasShortOrMini = items.some(it => {
      const type = (it.type || '').toLowerCase();
      return type === 'short' || type.includes('short') || type.includes('mini');
    });
    if (hasShortOrMini) {
      return block(candidate, '🚫 Trop frais pour short/mini-jupe le matin');
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
        Array.isArray(it.temperatures) &&
        it.temperatures.length > 0 &&
        !it.temperatures.includes('Été') &&
        !it.temperatures.includes('Toutes saisons')
    );
    if (offSeason) {
      return block(candidate, `🚫 ${offSeason.type} hors saison (chaud)`);
    }
  }
  if (tempMax < 5) {
    const offSeason = items.find(
      it =>
        Array.isArray(it.temperatures) &&
        it.temperatures.length > 0 &&
        !it.temperatures.includes('Hiver') &&
        !it.temperatures.includes('Toutes saisons')
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

  // ---- Cardigan rules ----
  const hasCardigan = items.some(i => i.type === 'Cardigan');
  // Cardigan sans haut (layer 1) = BLOQUANT
  if (hasCardigan && hauts.length === 0) {
    return block(candidate, '🚫 Cardigan doit être porté avec un haut');
  }
  const VESTES_COURTES = [
    'Blazer', 'Bomber', 'Veste en jean',
    'Perfecto', 'Veste en cuir', 'Veste militaire',
    'Veste coupe-vent',
  ];
  const hasVesteCourte = items.some(i => VESTES_COURTES.includes(i.type));
  if (hasCardigan && hasVesteCourte) {
    return block(candidate, '🚫 Cardigan + veste courte incompatibles');
  }

  // ---- Trench rules ----
  const hasTrench = items.some(i => i.type === 'Trench');
  const COUCHES_EXTERIEURES = [
    'Manteau long', 'Manteau court', 'Parka',
    'Doudoune', 'Imperméable / Ciré',
    'Cape / Poncho', 'Blazer', 'Bomber',
    'Veste en jean', 'Perfecto', 'Veste en cuir',
    'Veste militaire', 'Veste coupe-vent',
  ];
  const hasCoucheExterieure = items.some(i => COUCHES_EXTERIEURES.includes(i.type));
  if (hasTrench && hasCoucheExterieure) {
    return block(candidate, '🚫 Trench = couche extérieure unique — incompatible avec autre veste/manteau');
  }

  // ---- Couleurs ----
  const colors = items.flatMap(it => (it.color || []).map(c => norm(c)));
  const hasRouge = colors.some(c => c.includes('rouge'));
  const hasCorail = colors.some(c => c.includes('corail'));
  if (hasRouge && hasCorail) {
    return block(candidate, '🚫 Rouge + corail');
  }

  // ---- Occasion : Cérémonie (exclusions bloquantes) ----
  const occLower = (input.occasion || '').toLowerCase();
  if (occLower === 'cérémonie' || occLower === 'ceremonie') {
    const DRESSY_STYLES_CER = ['casual chic', 'chic', 'old money', 'romantique', 'preppy', 'minimaliste'];
    for (const it of items) {
      const itStyles = (it.style || []).map(s => norm(s));
      const itType = norm(it.type);
      const itSubcat = norm(it.subcategory);
      const itOccs = (it.occasion || []).map(o => norm(o));
      const itPattern = norm(it.pattern);

      // Sport / loungewear
      const isSport = itOccs.includes('sport')
        || itStyles.includes('sportswear')
        || itStyles.includes('sport')
        || ['jogging', 'legging', 'sweat', 'hoodie'].includes(itType)
        || itSubcat === 'leggings & joggings';
      if (isSport) return block(candidate, '🚫 Sport hors cérémonie');

      // Beachwear
      if (it.category === 'Maillots' || itOccs.includes('plage')
        || ['shorty de bain', 'bikini', 'maillot 1 pièce', 'tankini'].includes(itType)) {
        return block(candidate, '🚫 Beachwear hors cérémonie');
      }

      // Tongs / claquettes
      if (['claquettes / mules', 'sandales plates'].includes(itType)) {
        return block(candidate, '🚫 Tongs/claquettes hors cérémonie');
      }

      // Streetwear exclusif (sans contrepartie habillée)
      const hasStreetOnly = (itStyles.includes('streetwear') || itStyles.includes('grunge'))
        && !itStyles.some(s => DRESSY_STYLES_CER.includes(s));
      if (hasStreetOnly) return block(candidate, '🚫 Streetwear exclusif hors cérémonie');

      // Jean déchiré
      if (itPattern.includes('déchir') || itPattern.includes('dechir')
        || itType.includes('déchir') || itType.includes('dechir')) {
        return block(candidate, '🚫 Jean déchiré hors cérémonie');
      }

      // Baskets : toutes interdites en cérémonie
      if (itType === 'baskets') return block(candidate, '🚫 Baskets hors cérémonie');
    }
  }

  return candidate;
}
