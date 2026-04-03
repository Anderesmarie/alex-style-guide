import { useState, useEffect } from 'react';
import { getWardrobe } from '@/lib/storage';
import { ClothingItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { updateStreak } from '@/lib/streak';

const BASICS = [
  { type: 'Jean', color: 'noir', label: 'Jean noir', impact: 'Crée 5+ tenues casual et chic' },
  { type: 'Jean', color: 'bleu', label: 'Jean brut', impact: 'La base de tout dressing' },
  { type: 'T-shirt', color: 'blanc', label: 'T-shirt blanc', impact: 'Se porte avec absolument tout' },
  { type: 'T-shirt', color: 'noir', label: 'T-shirt noir', impact: 'Indispensable au quotidien' },
  { type: 'Blazer', color: null, label: 'Blazer', impact: 'Transforme 3+ tenues en look chic instantané' },
  { type: 'Manteau', color: null, label: 'Manteau classique', impact: "Indispensable pour l'hiver" },
  { type: 'Robe', color: 'noir', label: 'Petite robe noire', impact: 'Parfaite pour tous les événements' },
  { type: 'Chaussures', color: 'blanc', label: 'Baskets blanches', impact: "S'associe avec 80% de ton dressing" },
  { type: 'Chaussures', color: 'noir', label: 'Chaussures noires', impact: "Habille n'importe quelle tenue" },
  { type: 'Sac', color: null, label: 'Sac neutre', impact: 'Va avec toutes tes tenues' },
] as const;

const OCCASIONS = ['Travail', 'Sortie', 'Sport', 'Événement', 'Cérémonie', 'Voyage', 'Plage'] as const;
const SEASONS_LIST = ['Été', 'Automne', 'Hiver', 'Printemps'] as const;

const OCCASION_SEARCH: Record<string, string> = {
  'Travail': 'tenue travail bureau',
  'Sortie': 'tenue sortie soirée',
  'Sport': 'tenue sport femme',
  'Événement': 'tenue événement femme',
  'Cérémonie': 'tenue cérémonie femme',
  'Voyage': 'tenue voyage confortable',
  'Plage': 'tenue plage été',
};

const SEASON_SEARCH: Record<string, string> = {
  'Été': 'tenue été femme',
  'Automne': 'tenue automne femme',
  'Hiver': 'tenue hiver femme',
  'Printemps': 'tenue printemps femme',
};

function getCurrentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'Printemps';
  if (m >= 5 && m <= 7) return 'Été';
  if (m >= 8 && m <= 10) return 'Automne';
  return 'Hiver';
}

export default function Analysis() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [profileStyles, setProfileStyles] = useState<string[]>([]);
  const [userBrands, setUserBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const BRAND_URLS: Record<string, string> = {
    'Zara': 'https://www.zara.com/fr/fr/search?searchTerm=',
    'H&M': 'https://www2.hm.com/fr_fr/recherche.html?q=',
    'Shein': 'https://fr.shein.com/search?q=',
    'Vinted': 'https://www.vinted.fr/catalog?search_text=',
    'Sézane': 'https://www.sezane.com/fr/result?q=',
    'Mango': 'https://shop.mango.com/fr/fr/search?q=',
    'Bershka': 'https://www.bershka.com/fr/search?q=',
    'Zalando': 'https://www.zalando.fr/recherche/?q=',
    'Asos': 'https://www.asos.com/fr/recherche/?q=',
    'Primark': 'https://www.primark.com/fr-fr/search?q=',
  };

  const getShopLinks = (searchTerm: string) => {
    const matched = userBrands.filter(b => BRAND_URLS[b]);
    if (matched.length === 0) {
      return [{ name: 'Zalando', url: BRAND_URLS['Zalando'] + encodeURIComponent(searchTerm) }];
    }
    return matched.slice(0, 2).map(b => ({ name: b, url: BRAND_URLS[b] + encodeURIComponent(searchTerm) }));
  };

  const currentSeason = getCurrentSeason();

  useEffect(() => {
    const load = async () => {
      const [w, o] = await Promise.all([getWardrobe(), getOutfits()]);
      setWardrobe(w);
      setOutfits(o);
      updateStreak();
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: p } = await supabase.from('profiles').select('styles, brands').eq('id', userData.user.id).single();
          if (p?.styles) setProfileStyles(p.styles as string[]);
          if (p?.brands) setUserBrands(p.brands as string[]);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const checkBasic = (basic: typeof BASICS[number]) => {
    return wardrobe.some(item => {
      const typeMatch = item.type.toLowerCase().includes(basic.type.toLowerCase())
        || item.category?.toLowerCase().includes(basic.type.toLowerCase());
      if (!typeMatch) return false;
      if (basic.color) return item.color.toLowerCase().includes(basic.color);
      return true;
    });
  };

  const basicsStatus = BASICS.map(b => ({ ...b, owned: checkBasic(b) }));
  const missingCount = basicsStatus.filter(b => !b.owned).length;
  const allPresent = missingCount === 0;

  const occasionStats = OCCASIONS.map(occ => {
    const count = wardrobe.filter(i => i.occasion?.includes(occ)).length;
    return { name: occ, count };
  });

  const seasonStats = SEASONS_LIST.map(s => {
    const count = wardrobe.filter(i => i.season?.includes(s) || i.season?.includes('Toutes saisons')).length;
    return { name: s, count, isCurrent: s === currentSeason };
  });

  return (
    <div className="fade-enter pb-6" style={{ backgroundColor: '#F5F0EB', minHeight: '100vh' }}>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-serif font-bold mb-1" style={{ color: '#2C2C2C' }}>
          Mon analyse de garde-robe 🔍
        </h1>
        <p className="text-sm mb-4" style={{ color: '#9B9B9B' }}>
          Découvre ce qui manque pour compléter ton style
        </p>

        {/* Premium banner */}
        <div
          className="text-center text-white text-xs font-semibold mb-6"
          style={{ backgroundColor: '#C9956C', borderRadius: 12, padding: '8px 16px' }}
        >
          ✨ Fonctionnalités Premium — Abonnement à venir
        </div>

        <div className="space-y-4">
          {/* Basiques */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
              🧺 Pièces basiques manquantes
            </p>

            {loading ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
            ) : allPresent ? (
              <p className="text-sm font-medium" style={{ color: '#4CAF50' }}>
                Ton dressing est bien équipé en basiques ! 🎉
              </p>
            ) : (
              <div className="space-y-3" style={{ gap: 12 }}>
                {basicsStatus.filter(b => !b.owned).map(b => (
                  <div key={b.label} className="flex items-start gap-2.5" style={{ paddingBottom: 12 }}>
                    <span className="text-sm mt-0.5">🔴</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#2C2C2C' }}>
                        Il te manque {b.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>
                        {b.impact}
                      </p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {getShopLinks(b.label).map(link => (
                          <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium underline underline-offset-2"
                            style={{ color: '#C9956C' }}
                          >
                            🛍️ Voir sur {link.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {basicsStatus.some(b => b.owned) && (
                  <div className="pt-2 mt-2" style={{ borderTop: '1px solid #F0EBE5' }}>
                    {basicsStatus.filter(b => b.owned).map(b => (
                      <div key={b.label} className="flex items-center gap-2" style={{ paddingBottom: 12 }}>
                        <span className="text-sm">✅</span>
                        <span className="text-sm" style={{ color: '#888888' }}>{b.label} — Tu l'as déjà</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Occasion */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
              👔 Manques par occasion
            </p>
            {loading ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
            ) : (
              <div>
                {occasionStats.map(o => {
                  const icon = o.count === 0 ? '🔴' : o.count <= 2 ? '🟡' : '✅';
                  return (
                    <div key={o.name} className="flex items-start gap-2.5" style={{ paddingBottom: 12 }}>
                      <span className="text-sm mt-0.5">{icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: o.count >= 3 ? '#888888' : '#2C2C2C' }}>
                          {o.count === 0
                            ? `Zéro tenue pour ${o.name} 😬`
                            : o.count <= 2
                            ? `${o.name} — Peut mieux faire (${o.count} pièces)`
                            : `${o.name} — Tu gères ! (${o.count} pièces)`}
                        </p>
                        {o.count === 0 && (
                          <>
                            <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>On va remédier à ça !</p>
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {getShopLinks(OCCASION_SEARCH[o.name] || o.name).map(link => (
                                <a
                                  key={link.name}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-medium underline underline-offset-2"
                                  style={{ color: '#C9956C' }}
                                >
                                  🛍️ Voir sur {link.name}
                                </a>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saison */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
              🌦️ Manques par saison
            </p>
            {loading ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
            ) : (
              <div>
                {seasonStats.map(s => {
                  const icon = s.count <= 3 ? '🔴' : s.count <= 7 ? '🟡' : '✅';
                  const label = s.count <= 3
                    ? `${s.name} à compléter (${s.count} pièces)`
                    : s.count <= 7
                    ? `${s.name} un peu léger (${s.count} pièces)`
                    : `${s.name} au point (${s.count} pièces)`;
                  const sub = s.count <= 3
                    ? 'Ajoute des pièces pour cette saison'
                    : s.count <= 7
                    ? 'Quelques pièces de plus seraient utiles'
                    : null;

                  return (
                    <div key={s.name} className="flex items-start gap-2.5" style={{ paddingBottom: 12 }}>
                      <span className="text-sm mt-0.5">{icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: s.count > 7 ? '#888888' : '#2C2C2C' }}>
                            {label}
                          </p>
                          {s.isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#C9956C', color: '#FFF' }}>
                              Actuelle
                            </span>
                          )}
                        </div>
                        {sub && (
                          <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>{sub}</p>
                        )}
                        {s.count <= 3 && (
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {getShopLinks(SEASON_SEARCH[s.name] || s.name).map(link => (
                              <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-medium underline underline-offset-2"
                                style={{ color: '#C9956C' }}
                              >
                                🛍️ Voir des idées →
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Style */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
              ✨ Manques par style
            </p>
            {loading ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
            ) : profileStyles.length === 0 ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Définis tes styles dans ton profil pour voir l'analyse ✨</p>
            ) : (() => {
              const styleStats = profileStyles.map(s => {
                const count = wardrobe.filter(i => i.style?.includes(s)).length;
                return { name: s, count };
              });
              const matchingItems = wardrobe.filter(i => i.style?.some(s => profileStyles.includes(s))).length;
              const scorePercent = wardrobe.length > 0 ? Math.round((matchingItems / wardrobe.length) * 100) : 0;
              const SUGGESTIONS: Record<string, string> = {
                'Casual chic': 'un blazer ou un jean bien coupé',
                'Élégant': 'une robe midi ou un trench',
                'Sportswear': 'un jogging ou des sneakers',
                'Bohème': 'une robe fluide ou une jupe longue',
                'Minimaliste': 'un basique neutre en coton',
                'Streetwear': 'un hoodie ou des cargo pants',
                'Y2K': 'un crop top ou un pantalon taille basse',
                'Vintage': 'une pièce rétro en friperie',
                'Preppy': 'un polo ou une jupe plissée',
                'Cottagecore': 'une blouse fleurie ou une jupe midi',
                'Old Money': 'un pull en cachemire ou un pantalon droit',
                'Grunge': 'une chemise à carreaux ou des boots',
                'Chic parisien': 'une marinière ou un trench beige',
                'Dark': 'un total look noir structuré',
                'Kawaii': 'un accessoire pastel ou une jupe patineuse',
                'Business': 'un pantalon de tailleur ou une chemise',
                'Romantique': 'une blouse en dentelle ou une jupe fluide',
                'Athleisure': 'un legging ou une brassière stylée',
                'Tropical': 'une chemise à imprimé ou un short coloré',
                'Rock': 'un perfecto ou un t-shirt band',
              };
              return (
                <div>
                  {styleStats.map(s => {
                    const icon = s.count <= 2 ? '🔴' : s.count <= 5 ? '🟡' : '✅';
                    return (
                      <div key={s.name} className="flex items-start gap-2.5" style={{ paddingBottom: 12 }}>
                        <span className="text-sm mt-0.5">{icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: s.count > 5 ? '#888888' : '#2C2C2C' }}>
                            {s.count <= 2
                              ? `Style ${s.name} à développer (${s.count} pièces)`
                              : s.count <= 5
                              ? `Style ${s.name} un peu léger (${s.count} pièces)`
                              : `Style ${s.name} bien représenté ✨`}
                          </p>
                          {s.count <= 2 && (
                            <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>
                              Ajoute des pièces {s.name} pour l'affirmer
                            </p>
                          )}
                          {s.count > 2 && s.count <= 5 && (
                            <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>
                              Encore quelques pièces !
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-medium mt-0.5" style={{ color: '#9B9B9B' }}>{s.count}</span>
                      </div>
                    );
                  })}
                  <div className="pt-3 mt-2 text-center" style={{ borderTop: '1px solid #F0EBE5' }}>
                    <p className="text-sm font-semibold" style={{ color: '#C9956C' }}>
                      Ton dressing te ressemble à {scorePercent}% 🎯
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
