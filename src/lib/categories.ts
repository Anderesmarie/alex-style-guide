export type CategoryItem = {
  label: string;
  trend?: boolean;
};

export type SubCategory = {
  name: string;
  items: CategoryItem[];
};

export type Category = {
  icon: string;
  name: string;
  isNew?: boolean;
  subcategories: SubCategory[];
};

export const CATEGORIES: Category[] = [
  {
    icon: "🧥", name: "Manteaux & vestes",
    subcategories: [
      { name: "Manteaux", items: [
        { label: "Manteaux longs" }, { label: "Manteau court" }, { label: "Parka" },
        { label: "Imperméable" }, { label: "Trench" }, { label: "Caban" },
        { label: "Duffle-coat" }, { label: "Bomber", trend: true },
      ]},
      { name: "Vestes", items: [
        { label: "Veste en jean" }, { label: "Perfecto", trend: true },
        { label: "Doudoune" }, { label: "Veste militaire" },
        { label: "Veste coupe-vent" }, { label: "Veste chic" },
        { label: "Blouson" }, { label: "Cape / Poncho" },
      ]},
      { name: "Vestes sans manches", items: [
        { label: "Gilet sans manches" }, { label: "Doudoune sans manches" },
      ]},
    ],
  },
  {
    icon: "👕", name: "Hauts",
    subcategories: [
      { name: "T-shirts & tops", items: [
        { label: "Blouses" }, { label: "T-shirts" }, { label: "Chemises" },
        { label: "Débardeurs" }, { label: "Crop top", trend: true },
        { label: "Top corset", trend: true }, { label: "Top à lacets", trend: true },
        { label: "Tops courts" }, { label: "Tuniques" },
        { label: "Blouses manches courtes" }, { label: "Blouses manches longues" },
        { label: "Tops épaules dénudées" }, { label: "Bodies" },
        { label: "Blouses ¾" }, { label: "Tops peplum" }, { label: "Cols roulés" },
        { label: "Tops dos nu" }, { label: "Polo" },
        { label: "T-shirt oversize", trend: true },
        { label: "T-shirt graphique", trend: true }, { label: "Autres hauts" },
      ]},
      { name: "Chemises & blouses", items: [
        { label: "Chemise classique" }, { label: "Chemise oversize", trend: true },
        { label: "Tunique" },
      ]},
      { name: "Pulls & sweats", items: [
        { label: "Sweat oversize", trend: true }, { label: "Pull col rond" },
        { label: "Pull col V" }, { label: "Pull col roulé" },
        { label: "Pull sans manche" }, { label: "Cardigan" },
        { label: "Hoodie", trend: true }, { label: "Veste en maille / tricot", trend: true },
      ]},
      { name: "Blazers & tailleurs", items: [
        { label: "Blazer classique" }, { label: "Blazer oversize", trend: true },
        { label: "Tailleurs pièces séparées" },
        { label: "Ensemble tailleur/pantalon" },
        { label: "Jupe et robe tailleur" },
        { label: "Autres ensembles et tailleurs" },
      ]},
    ],
  },
  {
    icon: "👖", name: "Bas",
    subcategories: [
      { name: "Jeans", items: [
        { label: "Jean baggy", trend: true }, { label: "Jean boyfriend", trend: true },
        { label: "Jean skinny" }, { label: "Jean droit" }, { label: "Jean évasé" },
        { label: "Jean taille haute", trend: true }, { label: "Jean court" },
        { label: "Jean troué" }, { label: "Autre jean" },
      ]},
      { name: "Pantalons", items: [
        { label: "Pantalons courts et chinos" }, { label: "Pantalons skinny" },
        { label: "Pantalons ajustés" },
        { label: "Pantalons à jambes larges", trend: true },
        { label: "Leggings" }, { label: "Pantalons en cuir" }, { label: "Sarouels" },
        { label: "Pantalons droits" }, { label: "Pantalons cargo", trend: true },
        { label: "Pantalon pyjama (ville)", trend: true }, { label: "Jogging" },
        { label: "Autres pantalons et leggings" },
      ]},
      { name: "Shorts", items: [
        { label: "Shorts taille basse" }, { label: "Shorts taille haute", trend: true },
        { label: "Shorts en jean" }, { label: "Shorts en dentelle" },
        { label: "Shorts longueur genou" }, { label: "Shorts en cuir" },
        { label: "Pantacourts" }, { label: "Shorts cargo", trend: true },
        { label: "Bermuda" }, { label: "Autres shorts" },
      ]},
      { name: "Jupes", items: [
        { label: "Mini-jupes" }, { label: "Jupes mi-longues", trend: true },
        { label: "Jupes longues" }, { label: "Jupes trapèze" },
        { label: "Jupes moulantes" }, { label: "Jupes patineuses" },
        { label: "Jupes en jean" }, { label: "Jupes plissées", trend: true },
        { label: "Jupes taille haute" }, { label: "Jupes crayon" },
        { label: "Jupes tulipe" }, { label: "Autres jupes" },
      ]},
    ],
  },
  {
    icon: "👗", name: "Robes & combinaisons",
    subcategories: [
      { name: "Robes", items: [
        { label: "Mini robe" }, { label: "Robe midi" }, { label: "Robes longues" },
        { label: "Robe casual" }, { label: "Robe chic" },
        { label: "Robe sans bretelles" }, { label: "Petite robe noire" },
        { label: "Robe de soirée (mariage, soirée)" }, { label: "Robe en jean" },
        { label: "Autres robes" },
      ]},
      { name: "Combinaisons", items: [
        { label: "Combinaisons" }, { label: "Combishorts" }, { label: "Salopette" },
        { label: "Autres combinaisons et combishorts" },
      ]},
    ],
  },
  {
    icon: "🛹", name: "Streetwear", isNew: true,
    subcategories: [
      { name: "Streetwear pur", items: [
        { label: "Sweat à capuche", trend: true },
        { label: "T-shirt graphique streetwear", trend: true },
        { label: "Pantalon de survêtement" }, { label: "Veste track", trend: true },
        { label: "Short de basket" }, { label: "Veste Varsity" },
      ]},
      { name: "Skate", items: [
        { label: "T-shirt skate" }, { label: "Pantalon skate large" },
        { label: "Casquette skate" },
      ]},
      { name: "Workwear urbain", items: [
        { label: "Veste cargo" }, { label: "Chemise à carreaux" },
        { label: "Denim brut" },
      ]},
    ],
  },
  {
    icon: "✨", name: "Y2K & Vintage", isNew: true,
    subcategories: [
      { name: "Y2K", items: [
        { label: "Corset / bralette", trend: true },
        { label: "Mini-jupe Y2K", trend: true },
        { label: "Pantalon taille basse" }, { label: "Veste velours" },
        { label: "Set assorti Y2K" },
      ]},
      { name: "Vintage", items: [
        { label: "Vintage 90s" }, { label: "Vintage 80s" },
        { label: "Seconde main / Vinted" }, { label: "Vintage luxe" },
      ]},
      { name: "Cottagecore / Boho", items: [
        { label: "Robe florale" }, { label: "Top brodé" },
        { label: "Jupe longue boho" }, { label: "Cardigan fleuri" },
      ]},
    ],
  },
  {
    icon: "🏃", name: "Sport & activewear",
    subcategories: [
      { name: "Vêtements de sport", items: [
        { label: "Vêtements d'extérieur" }, { label: "Survêtements" },
        { label: "Shorts sport" }, { label: "Pantalons et leggings sport" },
        { label: "Robes sport" }, { label: "Hauts et t-shirts de sport" },
        { label: "Sweats et sweats à capuche", trend: true },
        { label: "Jupes sport" }, { label: "Brassières", trend: true },
        { label: "Accessoires de sport" }, { label: "Autres vêtements de sport" },
      ]},
      { name: "Sports d'hiver", items: [
        { label: "Veste de ski" }, { label: "Pantalon de ski" },
        { label: "Combinaison de ski" }, { label: "Sous-couche thermique" },
      ]},
    ],
  },
  {
    icon: "🛋️", name: "Loungewear & nuit", isNew: true,
    subcategories: [
      { name: "Loungewear", items: [
        { label: "Set co-ord confort", trend: true }, { label: "Jogging doux" },
        { label: "Sweat loungewear" }, { label: "Short loungewear" },
        { label: "Débardeur confort" },
      ]},
      { name: "Nuit", items: [
        { label: "Pyjama" }, { label: "Chemise de nuit" }, { label: "Nuisette" },
        { label: "Peignoir" }, { label: "Chaussettes & chaussons" },
      ]},
      { name: "Lingerie", items: [
        { label: "Soutien-gorge" }, { label: "Culotte" }, { label: "Body lingerie" },
        { label: "Ensemble lingerie" }, { label: "Corset décoratif", trend: true },
      ]},
    ],
  },
  {
    icon: "🩱", name: "Maillots & beachwear",
    subcategories: [
      { name: "Maillots", items: [
        { label: "Bikini" }, { label: "Maillot 1 pièce" }, { label: "Tankini" },
        { label: "Haut de maillot" }, { label: "Bas de maillot" },
      ]},
      { name: "Plage", items: [
        { label: "Paréo" }, { label: "Robe de plage" },
        { label: "Short de plage" }, { label: "Blouse de plage" },
      ]},
    ],
  },
  // suite dans le prompt 3
];
