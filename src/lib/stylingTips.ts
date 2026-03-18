import { ClothingItem } from './types';

interface BeautyProfile {
  hairLength?: string;
  makeupLevel?: string;
}

export interface StylingTips {
  beauty: string;
  hair: string;
  accessories: string;
}

function getBeautyProfile(): BeautyProfile {
  try {
    const raw = localStorage.getItem('alex_beauty_profile');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function detectOccasion(items: ClothingItem[]): string {
  const all = items.flatMap(i => i.occasion);
  if (all.includes('Sport')) return 'sport';
  if (all.includes('Événement')) return 'event';
  if (all.includes('Sortie')) return 'sortie';
  if (all.includes('Travail')) return 'bureau';
  return 'quotidien';
}

function detectStyle(items: ClothingItem[]): string {
  const all = items.flatMap(i => i.style);
  if (all.includes('Boho')) return 'boho';
  if (all.includes('Chic')) return 'chic';
  if (all.includes('Sport')) return 'sport';
  if (all.includes('Bureau')) return 'bureau';
  return 'casual';
}

type WeatherType = 'rain' | 'hot' | 'cold' | 'normal';

function getWeatherType(weatherCode: number | null, temperature: number | null): WeatherType {
  if (weatherCode !== null) {
    // Rain/storm codes
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) return 'rain';
  }
  if (temperature !== null) {
    if (temperature >= 25) return 'hot';
    if (temperature < 10) return 'cold';
  }
  return 'normal';
}

const BEAUTY_RULES: Record<string, string> = {
  quotidien: 'Mascara · Gloss · Naturel',
  bureau: 'Eye-liner fin · Blush doux · Vernis nude',
  sortie: 'Smoky eye · Highlighter · Rouge à lèvres',
  sport: 'No makeup · Baume à lèvres',
  event: 'Fond de teint · Contouring · Vernis coloré',
};

const HAIR_RULES: Record<WeatherType, Record<string, string>> = {
  rain: {
    long: 'Chignon · Tresse protectrice',
    medium: 'Chignon bas · Tresse',
    short: 'Bandeau · Coiffé-décoiffé',
    default: 'Chignon · Tresse · Attaché',
  },
  hot: {
    long: 'Demi-queue · Tresse lâche',
    medium: 'Cheveux lâchés · Demi-queue',
    short: 'Cheveux libres · Barrettes',
    default: 'Demi-queue · Tresse · Cheveux lâchés',
  },
  cold: {
    long: 'Chignon bas · Tresse collée',
    medium: 'Bonnet stylé · Chignon bas',
    short: 'Bonnet · Coiffé texturé',
    default: 'Chignon bas · Bonnet stylé · Tresse collée',
  },
  normal: {
    long: 'Ondulations · Queue basse',
    medium: 'Cheveux lâchés · Barrettes',
    short: 'Coiffé-décoiffé · Gel léger',
    default: 'Selon l\'occasion',
  },
};

const ACCESSORY_RULES: Record<string, string> = {
  casual: 'Sac à dos · Baskets blanches · Boucles discrètes',
  chic: 'Sac structuré · Bottines · Bijoux dorés',
  boho: 'Panier · Sandales · Collier long',
  sport: 'Sac de sport · Casquette · Montre',
  bureau: 'Sac cabas · Mocassins · Montre fine',
};

export function getStylingTips(
  items: ClothingItem[],
  weatherCode: number | null,
  temperature: number | null
): StylingTips {
  const profile = getBeautyProfile();
  const occasion = detectOccasion(items);
  const style = detectStyle(items);
  const weather = getWeatherType(weatherCode, temperature);

  // Beauty
  let beauty = BEAUTY_RULES[occasion] || BEAUTY_RULES.quotidien;
  if (profile.makeupLevel === 'minimal') {
    beauty = 'Mascara · Baume à lèvres';
  } else if (profile.makeupLevel === 'none') {
    beauty = 'Soin hydratant · Baume';
  }

  // Hair
  const hairLen = profile.hairLength || 'default';
  const hairMap = HAIR_RULES[weather];
  const hair = hairMap[hairLen] || hairMap.default;

  // Accessories
  const accessories = ACCESSORY_RULES[style] || ACCESSORY_RULES.casual;

  return { beauty, hair, accessories };
}
