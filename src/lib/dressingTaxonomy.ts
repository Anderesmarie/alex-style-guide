// Taxonomie à 3 niveaux — MyStyl Juin 2026
// Niveau 1 : Catégorie (chips horizontaux)
// Niveau 2 : Sous-catégorie (dropdown) — optionnelle
// Niveau 3 : Type précis (dropdown) — toujours présent

export type Subcategory = {
  key: string;
  label: string;
  allLabel: string;
  types: string[];
  layer?: number;
};

export type CategoryGroup = {
  key: string;
  label: string;
  allLabel: string;
  layer: number;
  subcategories?: Subcategory[];
  types?: string[];
};

export const DRESSING_CATEGORIES: CategoryGroup[] = [
  {
    key: "Hauts",
    label: "Hauts",
    allLabel: "Tous les hauts",
    layer: 1,
    subcategories: [
      {
        key: "Tops & T-shirts",
        label: "Tops & T-shirts",
        allLabel: "Tous les tops",
        types: [
          "T-shirt basique",
          "T-shirt graphique / imprimé",
          "T-shirt oversize",
          "Crop top",
          "Débardeur",
          "Top dos nu",
          "Top épaules dénudées",
          "Top corset / Bralette",
          "Top bain de soleil",
          "Body",
          "Col roulé fin",
          "Polo",
          "Tunique",
        ],
      },
      {
        key: "Chemises & Blouses",
        label: "Chemises & Blouses",
        allLabel: "Toutes les chemises",
        types: ["Chemise classique", "Chemise oversize", "Chemise à carreaux", "Blouse romantique", "Blouse fluide"],
      },
      {
        key: "Pulls & Mailles légers",
        label: "Pulls légers (Printemps/Été)",
        allLabel: "Pulls légers",
        types: ["Pull col rond coton", "Pull col V coton", "Cardigan léger", "Sweat coton léger"],
        layer: 2,
      },
      {
        key: "Pulls & Mailles chauds",
        label: "Pulls chauds (Automne/Hiver)",
        allLabel: "Pulls chauds",
        types: [
          "Pull col rond laine",
          "Pull col roulé laine",
          "Pull col V laine",
          "Cardigan épais",
          "Hoodie",
          "Sweat molletonné",
        ],
        layer: 2,
      },
    ],
  },
  {
    key: "Bas",
    label: "Bas",
    allLabel: "Tous les bas",
    layer: 0,
    subcategories: [
      {
        key: "Jeans",
        label: "Jeans",
        allLabel: "Tous les jeans",
        types: [
          "Jean droit",
          "Jean skinny",
          "Jean boyfriend",
          "Jean baggy / large",
          "Jean évasé",
          "Jean taille haute",
          "Jean court",
          "Jean troué",
        ],
      },
      {
        key: "Pantalons",
        label: "Pantalons",
        allLabel: "Tous les pantalons",
        types: [
          "Pantalon droit",
          "Pantalon large / palazzo",
          "Pantalon cargo",
          "Pantalon tailleur",
          "Pantalon en cuir / simili",
          "Pantalon de jogging habillé",
          "Legging",
        ],
      },
      {
        key: "Jupes courtes",
        label: "Jupes courtes",
        allLabel: "Jupes courtes",
        types: [
          "Jupe mini droite",
          "Jupe mini trapèze",
          "Jupe mini patineuse",
          "Jupe mini plissée",
          "Jupe mini en jean",
        ],
      },
      {
        key: "Jupes midi",
        label: "Jupes midi",
        allLabel: "Jupes midi",
        types: [
          "Jupe midi droite",
          "Jupe midi plissée",
          "Jupe midi crayon",
          "Jupe midi portefeuille",
          "Jupe midi évasée",
        ],
      },
      {
        key: "Jupes longues",
        label: "Jupes longues",
        allLabel: "Jupes longues",
        types: ["Jupe longue droite", "Jupe longue évasée", "Juke longue bohème", "Jupe longue en jean"],
      },
      {
        key: "Jupes spéciales",
        label: "Jupes spéciales",
        allLabel: "Jupes spéciales",
        types: ["Jupe-culotte", "Jupe asymétrique", "Jupe en cuir / simili"],
      },
      {
        key: "Shorts",
        label: "Shorts",
        allLabel: "Tous les shorts",
        types: ["Short en jean taille haute", "Short en jean taille basse", "Short cargo", "Bermuda", "Short habillé"],
      },
      {
        key: "Salopettes",
        label: "Salopettes",
        allLabel: "Toutes les salopettes",
        types: ["Salopette pantalon", "Salopette short"],
      },
    ],
  },
  {
    key: "Robes",
    label: "Robes",
    allLabel: "Toutes les robes",
    layer: 0,
    subcategories: [
      {
        key: "Robes courtes",
        label: "Robes courtes",
        allLabel: "Robes courtes",
        types: [
          "Robe courte droite",
          "Robe courte évasée / patineuse",
          "Robe courte portefeuille",
          "Robe courte sans bretelles",
          "Robe courte en jean",
        ],
      },
      {
        key: "Robes midi",
        label: "Robes midi",
        allLabel: "Robes midi",
        types: [
          "Robe midi droite",
          "Robe midi évasée",
          "Robe midi portefeuille",
          "Robe midi fourreau",
          "Robe midi romantique",
        ],
      },
      {
        key: "Robes longues",
        label: "Robes longues",
        allLabel: "Robes longues",
        types: ["Robe longue droite", "Robe longue évasée", "Robe longue bohème", "Robe longue de soirée"],
      },
      {
        key: "Combinaisons",
        label: "Combinaisons",
        allLabel: "Toutes les combinaisons",
        types: ["Combinaison pantalon", "Combishort"],
      },
    ],
  },
  {
    key: "Ensembles",
    label: "Ensembles 2 pièces",
    allLabel: "Tous les ensembles",
    layer: 0,
    subcategories: [
      {
        key: "Ensembles Hauts + Bas",
        label: "Crop top + bas",
        allLabel: "Ensembles crop top",
        types: [
          "Ensemble crop top + jupe courte",
          "Ensemble crop top + jupe midi",
          "Ensemble crop top + pantalon",
          "Ensemble top + short",
        ],
      },
      {
        key: "Ensembles Tailleurs",
        label: "Tailleurs",
        allLabel: "Tailleurs",
        types: [
          "Ensemble blazer + pantalon tailleur",
          "Ensemble blazer + jupe courte",
          "Ensemble blazer + jupe midi",
          "Ensemble veste + short",
          "Ensemble veste + pantalon",
        ],
      },
      {
        key: "Ensembles Sportswear",
        label: "Sportswear coordonné",
        allLabel: "Ensembles sport",
        types: [
          "Ensemble brassière + legging",
          "Ensemble brassière + short de sport",
          "Ensemble jogging (sweat + pantalon)",
        ],
      },
      {
        key: "Ensembles Loungewear",
        label: "Loungewear",
        allLabel: "Ensembles loungewear",
        types: ["Ensemble loungewear (haut + bas assortis)"],
      },
      {
        key: "Ensembles Y2K",
        label: "Y2K / Coordonnés",
        allLabel: "Ensembles Y2K",
        types: ["Ensemble corset + jupe assortie", "Ensemble imprimé coordonné"],
      },
    ],
  },
  {
    key: "Manteaux",
    label: "Manteaux & Vestes",
    allLabel: "Tous les manteaux",
    layer: 3,
    subcategories: [
      {
        key: "Manteaux chauds",
        label: "Manteaux chauds",
        allLabel: "Manteaux chauds",
        types: [
          "Manteau long classique",
          "Manteau court",
          "Doudoune longue",
          "Doudoune courte",
          "Parka",
          "Duffle-coat",
          "Cape / Poncho",
        ],
      },
      {
        key: "Manteaux légers",
        label: "Manteaux légers",
        allLabel: "Manteaux légers",
        types: ["Trench", "Imperméable / Ciré", "Manteau en laine mi-saison"],
      },
      {
        key: "Vestes casual",
        label: "Vestes casual",
        allLabel: "Vestes casual",
        types: [
          "Veste en jean",
          "Bomber",
          "Perfecto / Veste en cuir",
          "Veste militaire",
          "Veste coupe-vent",
          "Gilet sans manches",
          "Veste de sport technique",
        ],
      },
      {
        key: "Blazers",
        label: "Blazers & Tailleurs",
        allLabel: "Blazers",
        types: ["Blazer structuré", "Blazer oversize", "Veste de tailleur"],
      },
    ],
  },
  {
    key: "Sport & Loungewear",
    label: "Sport & Loungewear",
    allLabel: "Sport & Loungewear",
    layer: 0,
    subcategories: [
      {
        key: "Sport",
        label: "Sport",
        allLabel: "Vêtements de sport",
        types: [
          "Brassière de sport",
          "Legging de sport",
          "Jogging",
          "Short de sport",
          "T-shirt de sport",
          "Sweat de sport",
        ],
      },
      {
        key: "Loungewear & Nuit",
        label: "Loungewear & Nuit",
        allLabel: "Loungewear",
        types: ["Haut de pyjama", "Bas de pyjama", "Ensemble loungewear", "Peignoir"],
      },
    ],
  },
  {
    key: "Chaussures",
    label: "Chaussures",
    allLabel: "Toutes les chaussures",
    layer: 4,
    subcategories: [
      {
        key: "Baskets & Sneakers",
        label: "Baskets & Sneakers",
        allLabel: "Toutes les baskets",
        types: [
          "Sneaker fashion / lifestyle",
          "Sneaker plateforme",
          "Basket running",
          "Basket montante",
          "Converse / Toile",
          "Slip-on",
        ],
      },
      {
        key: "Chaussures plates",
        label: "Chaussures plates",
        allLabel: "Chaussures plates",
        types: [
          "Ballerine classique",
          "Ballerine bout pointu",
          "Mary Janes",
          "Mocassin / Loafer",
          "Sabot / Croc",
          "Chaussure Oxford",
        ],
      },
      {
        key: "Sandales & Mules plates",
        label: "Sandales & Mules plates",
        allLabel: "Sandales plates",
        types: ["Sandale plate classique", "Sandale à lanières", "Mule plate", "Claquette", "Tong"],
      },
      {
        key: "Talons",
        label: "Talons",
        allLabel: "Tous les talons",
        types: [
          "Escarpins classiques",
          "Escarpins bout pointu",
          "Mules à talons",
          "Sandales à talons",
          "Compensées",
          "Talons bloc / chunky",
        ],
      },
      {
        key: "Bottes & Bottines",
        label: "Bottes & Bottines",
        allLabel: "Toutes les bottes",
        types: [
          "Bottine à talon",
          "Bottine plate / Chelsea",
          "Bottine plateforme",
          "Botte haute classique",
          "Botte haute cuissarde",
          "Botte de pluie",
          "Doc Martens / Botte rock",
        ],
      },
      {
        key: "Chaussures de sport",
        label: "Chaussures de sport",
        allLabel: "Chaussures de sport",
        types: ["Chaussure de running", "Chaussure de fitness", "Chaussure de danse"],
      },
    ],
  },
  {
    key: "Sacs",
    label: "Sacs",
    allLabel: "Tous les sacs",
    layer: 5,
    subcategories: [
      {
        key: "Sacs du quotidien",
        label: "Quotidien",
        allLabel: "Sacs quotidien",
        types: ["Tote bag", "Sac à dos classique", "Sac à dos mini", "Sac cabas"],
      },
      {
        key: "Sacs à main",
        label: "Sacs à main",
        allLabel: "Sacs à main",
        types: [
          "Sac baguette",
          "Sac baguette mini",
          "Sac à main structuré",
          "Sac hobo / souple",
          "Sac trapèze",
          "Sac seau",
        ],
      },
      {
        key: "Petits sacs & Pochettes",
        label: "Pochettes & Mini",
        allLabel: "Pochettes",
        types: ["Pochette clutch", "Pochette zippée", "Mini sac", "Sac chaîne"],
      },
      {
        key: "Sacs tendance",
        label: "Tendance",
        allLabel: "Sacs tendance",
        types: ["Sac banane", "Sac filet / mesh", "Sac crochet / raphia", "Sac en fourrure / teddy"],
      },
      {
        key: "Sacs pratiques",
        label: "Pratiques",
        allLabel: "Sacs pratiques",
        types: ["Sac de sport / Gym bag", "Sac à dos technique", "Vanity / Trousse XXL"],
      },
    ],
  },
  {
    key: "Bijoux",
    label: "Bijoux",
    allLabel: "Tous les bijoux",
    layer: 6,
    subcategories: [
      {
        key: "Colliers",
        label: "Colliers",
        allLabel: "Colliers",
        types: ["Collier fin / chaîne", "Collier pendentif", "Collier chunky / statement"],
      },
      {
        key: "Boucles d'oreilles",
        label: "Boucles d'oreilles",
        allLabel: "Boucles d'oreilles",
        types: ["Boucles d'oreilles créoles", "Boucles d'oreilles pendantes", "Boucles d'oreilles puces"],
      },
      {
        key: "Bracelets",
        label: "Bracelets",
        allLabel: "Bracelets",
        types: ["Bracelet fin", "Bracelet manchette", "Bracelet de cheville"],
      },
      {
        key: "Bagues",
        label: "Bagues",
        allLabel: "Bagues",
        types: ["Bague simple", "Bague statement / stacking"],
      },
      {
        key: "Autres bijoux",
        label: "Autres",
        allLabel: "Autres bijoux",
        types: ["Montre", "Piercing"],
      },
    ],
  },
  {
    key: "Accessoires",
    label: "Accessoires",
    allLabel: "Tous les accessoires",
    layer: 6,
    subcategories: [
      {
        key: "Ceintures",
        label: "Ceintures",
        allLabel: "Ceintures",
        types: ["Ceinture fine classique", "Ceinture large", "Ceinture corset", "Ceinture chaîne", "Ceinture cargo"],
      },
      {
        key: "Couvre-chefs",
        label: "Couvre-chefs",
        allLabel: "Couvre-chefs",
        types: ["Casquette", "Bob / Bucket hat", "Bonnet", "Béret", "Chapeau de paille", "Bandana / Foulard cheveux"],
      },
      {
        key: "Écharpes & Foulards",
        label: "Écharpes & Foulards",
        allLabel: "Écharpes",
        types: ["Écharpe", "Foulard noué", "Châle"],
      },
      {
        key: "Lunettes",
        label: "Lunettes",
        allLabel: "Lunettes",
        types: ["Lunettes de soleil", "Lunettes de vue"],
      },
      {
        key: "Collants & Chaussettes",
        label: "Collants & Chaussettes",
        allLabel: "Collants",
        types: [
          "Collants opaques",
          "Collants résille",
          "Chaussettes hautes",
          "Chaussettes logo / colorées",
          "Socquettes",
        ],
      },
    ],
  },
  {
    key: "Maillots",
    label: "Maillots",
    allLabel: "Tous les maillots",
    layer: 0,
    types: ["Maillot 1 pièce", "Bikini", "Tankini", "Shorty de bain", "Paréo / Chemise de plage ouverte"],
  },
];

// Récupère tous les types d'une catégorie (à plat)
export function getAllTypesForCategory(categoryKey: string): string[] {
  const cat = DRESSING_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return [];
  if (cat.types) return cat.types;
  if (cat.subcategories) return cat.subcategories.flatMap((s) => s.types);
  return [];
}

// Récupère la catégorie à laquelle appartient un type
export function getCategoryForType(typeLabel: string): CategoryGroup | undefined {
  return DRESSING_CATEGORIES.find((cat) => getAllTypesForCategory(cat.key).includes(typeLabel));
}

// Récupère la sous-catégorie à laquelle appartient un type
export function getSubcategoryForType(
  typeLabel: string,
): { category: CategoryGroup; subcategory: Subcategory } | undefined {
  for (const cat of DRESSING_CATEGORIES) {
    if (!cat.subcategories) continue;
    const sub = cat.subcategories.find((s) => s.types.includes(typeLabel));
    if (sub) return { category: cat, subcategory: sub };
  }
  return undefined;
}
