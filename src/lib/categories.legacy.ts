export type ClothingType = {
  label: string;
  layer: number;
};

export type Category = {
  icon: string;
  name: string;
  layer: number;
  maxPerOutfit: number;
  blocksLayers?: number[];
  types: ClothingType[];
};

export const CATEGORIES: Category[] = [
  {
    icon: '🧥',
    name: 'Manteaux & vestes',
    layer: 3,
    maxPerOutfit: 1,
    types: [
      { label: 'Manteau long', layer: 3 },
      { label: 'Manteau court', layer: 3 },
      { label: 'Parka', layer: 3 },
      { label: 'Trench', layer: 3 },
      { label: 'Bomber', layer: 3 },
      { label: 'Doudoune', layer: 3 },
      { label: 'Imperméable / Ciré', layer: 3 },
      { label: 'Veste en jean', layer: 3 },
      { label: 'Perfecto', layer: 3 },
      { label: 'Veste militaire', layer: 3 },
      { label: 'Veste coupe-vent', layer: 3 },
      { label: 'Blazer', layer: 3 },
      { label: 'Cape / Poncho', layer: 3 },
    ],
  },
  {
    icon: '🧶',
    name: 'Pulls & sweats',
    layer: 2,
    maxPerOutfit: 1,
    types: [
      { label: 'Pull col rond', layer: 2 },
      { label: 'Pull col V', layer: 2 },
      { label: 'Pull col roulé', layer: 2 },
      { label: 'Sweat', layer: 2 },
      { label: 'Hoodie', layer: 2 },
      { label: 'Cardigan', layer: 2 },
    ],
  },
  {
    icon: '👕',
    name: 'Hauts',
    layer: 1,
    maxPerOutfit: 1,
    types: [
      { label: 'T-shirt', layer: 1 },
      { label: 'Crop top', layer: 1 },
      { label: 'Body', layer: 1 },
      { label: 'Chemise', layer: 1 },
      { label: 'Blouse', layer: 1 },
      { label: 'Polo', layer: 1 },
      { label: 'Col roulé', layer: 1 },
      { label: 'Top dos nu', layer: 1 },
      { label: 'Top épaules dénudées', layer: 1 },
      { label: 'Pull sans manche', layer: 1 },
      { label: 'Débardeur', layer: 1 },
      { label: 'Tunique', layer: 1 },
      { label: 'Top corset / Bralette', layer: 1 },
    ],
  },
  {
    icon: '👖',
    name: 'Bas',
    layer: 0,
    maxPerOutfit: 1,
    types: [
      { label: 'Jean droit', layer: 0 },
      { label: 'Jean skinny', layer: 0 },
      { label: 'Jean boyfriend', layer: 0 },
      { label: 'Jean évasé', layer: 0 },
      { label: 'Jean taille haute', layer: 0 },
      { label: 'Jean court', layer: 0 },
      { label: 'Pantalon droit', layer: 0 },
      { label: 'Pantalon large', layer: 0 },
      { label: 'Pantalon cargo', layer: 0 },
      { label: 'Pantalon en cuir', layer: 0 },
      { label: 'Legging', layer: 0 },
      { label: 'Jogging', layer: 0 },
      { label: 'Short en jean', layer: 0 },
      { label: 'Short taille haute', layer: 0 },
      { label: 'Short cargo', layer: 0 },
      { label: 'Autres shorts', layer: 0 },
    ],
  },
  {
    icon: '👗',
    name: 'Robes & combinaisons',
    layer: 0,
    maxPerOutfit: 1,
    blocksLayers: [1, 2],
    types: [
      { label: 'Robe mini', layer: 0 },
      { label: 'Robe midi', layer: 0 },
      { label: 'Robe longue', layer: 0 },
      { label: 'Robe casual', layer: 0 },
      { label: 'Robe habillée', layer: 0 },
      { label: 'Robe sans bretelles', layer: 0 },
      { label: 'Robe en jean', layer: 0 },
      { label: 'Combinaison', layer: 0 },
      { label: 'Combishort', layer: 0 },
      { label: 'Salopette', layer: 0 },
    ],
  },
  {
    icon: '👗',
    name: 'Jupes',
    layer: 0,
    maxPerOutfit: 1,
    types: [
      { label: 'Mini-jupe', layer: 0 },
      { label: 'Jupe mi-longue', layer: 0 },
      { label: 'Jupe longue', layer: 0 },
      { label: 'Jupe évasée', layer: 0 },
      { label: 'Jupe moulante', layer: 0 },
      { label: 'Jupe en jean', layer: 0 },
      { label: 'Jupe plissée', layer: 0 },
      { label: 'Jupe crayon', layer: 0 },
    ],
  },
  {
    icon: '👟',
    name: 'Chaussures',
    layer: 4,
    maxPerOutfit: 1,
    types: [
      { label: 'Baskets', layer: 4 },
      { label: 'Boots / Bottines', layer: 4 },
      { label: 'Bottes hautes', layer: 4 },
      { label: 'Sandales plates', layer: 4 },
      { label: 'Sandales à talons', layer: 4 },
      { label: 'Escarpins', layer: 4 },
      { label: 'Mocassins / Loafers', layer: 4 },
      { label: 'Ballerines', layer: 4 },
      { label: 'Claquettes / Mules', layer: 4 },
    ],
  },
  {
    icon: '👜',
    name: 'Sacs',
    layer: 5,
    maxPerOutfit: 1,
    types: [
      { label: 'Sac à main', layer: 5 },
      { label: 'Tote bag', layer: 5 },
      { label: 'Sac à dos', layer: 5 },
      { label: 'Pochette', layer: 5 },
      { label: 'Sac banane', layer: 5 },
      { label: 'Sac baguette', layer: 5 },
      { label: 'Mini sac', layer: 5 },
    ],
  },
  {
    icon: '💍',
    name: 'Accessoires',
    layer: 6,
    maxPerOutfit: 99,
    types: [
      { label: 'Bijoux', layer: 6 },
      { label: 'Ceinture', layer: 6 },
      { label: 'Écharpe / Foulard', layer: 6 },
      { label: 'Casquette / Bob', layer: 6 },
      { label: 'Bonnet', layer: 6 },
      { label: 'Lunettes de soleil', layer: 6 },
      { label: 'Collants / Chaussettes', layer: 6 },
    ],
  },
];

export function getCategoryByType(typeLabel: string): Category | undefined {
  return CATEGORIES.find(cat => cat.types.some(t => t.label === typeLabel));
}

export function getLayerByType(typeLabel: string): number {
  for (const cat of CATEGORIES) {
    const found = cat.types.find(t => t.label === typeLabel);
    if (found) return found.layer;
  }
  return 1;
}
