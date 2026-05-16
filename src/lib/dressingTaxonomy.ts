// Taxonomie à 3 niveaux pour le dressing
// Niveau 1 : Catégorie (chips horizontaux)
// Niveau 2 : Sous-catégorie (dropdown) — optionnelle
// Niveau 3 : Type précis (dropdown) — toujours présent

export type Subcategory = {
  key: string;
  label: string;
  allLabel: string;
  types: string[];
  layer?: number; // override la layer de la catégorie parent
};

export type CategoryGroup = {
  key: string;
  label: string;
  allLabel: string;
  layer: number;
  // Si subcategories est défini → niveau 2 actif
  subcategories?: Subcategory[];
  // Si types est défini directement → pas de niveau 2, on passe au niveau 3
  types?: string[];
};

export const DRESSING_CATEGORIES: CategoryGroup[] = [
  {
    key: 'Hauts',
    label: 'Hauts',
    allLabel: 'Tous les hauts',
    layer: 1,
    subcategories: [
      {
        key: 'Tops & T-shirts',
        label: 'Tops & T-shirts',
        allLabel: 'Tous les tops',
        types: ['T-shirt', 'Crop top', 'Body', 'Col roulé', 'Débardeur', 'Top dos nu', 'Top épaules dénudées', 'Pull sans manche', 'Tunique', 'Top corset / Bralette', 'Polo'],
      },
      {
        key: 'Pulls & Mailles',
        label: 'Pulls & Mailles',
        allLabel: 'Tous les pulls',
        types: ['Pull col rond', 'Pull col V', 'Pull col roulé', 'Sweat', 'Hoodie', 'Cardigan'],
        layer: 2,
      },
      {
        key: 'Chemises & Blouses',
        label: 'Chemises & Blouses',
        allLabel: 'Toutes les chemises',
        types: ['Chemise', 'Blouse'],
      },
    ],
  },
  {
    key: 'Bas',
    label: 'Bas',
    allLabel: 'Tous les bas',
    layer: 0,
    subcategories: [
      {
        key: 'Jeans',
        label: 'Jeans',
        allLabel: 'Tous les jeans',
        types: ['Jean droit', 'Jean skinny', 'Jean boyfriend', 'Jean évasé', 'Jean taille haute', 'Jean court'],
      },
      {
        key: 'Pantalons',
        label: 'Pantalons',
        allLabel: 'Tous les pantalons',
        types: ['Pantalon droit', 'Pantalon large', 'Pantalon cargo', 'Pantalon en cuir'],
      },
      {
        key: 'Jupes',
        label: 'Jupes',
        allLabel: 'Toutes les jupes',
        types: ['Mini-jupe', 'Jupe mi-longue', 'Jupe longue', 'Jupe évasée', 'Jupe moulante', 'Jupe en jean', 'Jupe plissée', 'Jupe crayon'],
      },
      {
        key: 'Shorts',
        label: 'Shorts',
        allLabel: 'Tous les shorts',
        types: ['Short en jean', 'Short taille haute', 'Short cargo', 'Autres shorts'],
      },
      {
        key: 'Leggings & Joggings',
        label: 'Leggings & Joggings',
        allLabel: 'Tous les leggings',
        types: ['Legging', 'Jogging'],
      },
    ],
  },
  {
    key: 'Robes',
    label: 'Robes',
    allLabel: 'Toutes les robes',
    layer: 0,
    subcategories: [
      {
        key: 'Robes',
        label: 'Robes',
        allLabel: 'Toutes les robes',
        types: ['Robe mini', 'Robe midi', 'Robe longue', 'Robe casual', 'Robe habillée', 'Robe sans bretelles', 'Robe en jean'],
      },
      {
        key: 'Combinaisons & Salopettes',
        label: 'Combinaisons & Salopettes',
        allLabel: 'Toutes les combinaisons',
        types: ['Combinaison', 'Combishort', 'Salopette'],
      },
    ],
  },
  {
    key: 'Manteaux',
    label: 'Manteaux',
    allLabel: 'Tous les manteaux',
    layer: 3,
    subcategories: [
      {
        key: 'Manteaux',
        label: 'Manteaux',
        allLabel: 'Tous les manteaux',
        types: ['Manteau long', 'Manteau court', 'Parka', 'Trench', 'Doudoune', 'Imperméable / Ciré', 'Cape / Poncho'],
      },
      {
        key: 'Vestes',
        label: 'Vestes',
        allLabel: 'Toutes les vestes',
        types: ['Bomber', 'Veste en jean', 'Perfecto', 'Veste en cuir', 'Veste militaire', 'Veste coupe-vent', 'Blazer'],
      },
    ],
  },
  {
    key: 'Chaussures',
    label: 'Chaussures',
    allLabel: 'Toutes les chaussures',
    layer: 4,
    subcategories: [
      {
        key: 'Baskets & Plates',
        label: 'Baskets & Plates',
        allLabel: 'Toutes les baskets',
        types: ['Baskets', 'Ballerines', 'Mocassins / Loafers'],
      },
      {
        key: 'Talons & Escarpins',
        label: 'Talons & Escarpins',
        allLabel: 'Tous les talons',
        types: ['Escarpins', 'Sandales à talons'],
      },
      {
        key: 'Bottes & Bottines',
        label: 'Bottes & Bottines',
        allLabel: 'Toutes les bottes',
        types: ['Boots / Bottines', 'Bottes hautes'],
      },
      {
        key: 'Sandales & Mules',
        label: 'Sandales & Mules',
        allLabel: 'Toutes les sandales',
        types: ['Sandales plates', 'Claquettes / Mules'],
      },
    ],
  },
  {
    key: 'Sacs',
    label: 'Sacs',
    allLabel: 'Tous les sacs',
    layer: 5,
    types: ['Sac à main', 'Tote bag', 'Sac à dos', 'Pochette', 'Sac banane', 'Sac baguette', 'Mini sac'],
  },
  {
    key: 'Bijoux',
    label: 'Bijoux',
    allLabel: 'Tous les bijoux',
    layer: 6,
    types: ['Collier', "Boucles d'oreilles", 'Bracelet', 'Bague', 'Montre'],
  },
  {
    key: 'Accessoires',
    label: 'Accessoires',
    allLabel: 'Tous les accessoires',
    layer: 6,
    types: ['Ceinture', 'Écharpe / Foulard', 'Casquette / Bob', 'Bonnet', 'Lunettes de soleil', 'Collants / Chaussettes'],
  },
  {
    key: 'Maillots',
    label: 'Maillots',
    allLabel: 'Tous les maillots',
    layer: 0,
    types: ['Maillot 1 pièce', 'Bikini', 'Tankini', 'Shorty de bain'],
  },
];

// Récupère tous les types d'une catégorie (à plat, en incluant ceux des sous-catégories)
export function getAllTypesForCategory(categoryKey: string): string[] {
  const cat = DRESSING_CATEGORIES.find(c => c.key === categoryKey);
  if (!cat) return [];
  if (cat.types) return cat.types;
  if (cat.subcategories) return cat.subcategories.flatMap(s => s.types);
  return [];
}

// Récupère la catégorie à laquelle appartient un type
export function getCategoryForType(typeLabel: string): CategoryGroup | undefined {
  return DRESSING_CATEGORIES.find(cat => getAllTypesForCategory(cat.key).includes(typeLabel));
}

// Récupère la sous-catégorie à laquelle appartient un type
export function getSubcategoryForType(typeLabel: string): { category: CategoryGroup; subcategory: Subcategory } | undefined {
  for (const cat of DRESSING_CATEGORIES) {
    if (!cat.subcategories) continue;
    const sub = cat.subcategories.find(s => s.types.includes(typeLabel));
    if (sub) return { category: cat, subcategory: sub };
  }
  return undefined;
}
