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
  // suite dans le prompt 2
];
