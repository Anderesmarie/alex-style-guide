import { useState, useEffect } from 'react';
import { getWardrobe } from '@/lib/storage';
import { ClothingItem } from '@/lib/types';

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

const OCCASIONS = ['Travail', 'Sortie', 'Sport', 'Événement', 'Mariage', 'Voyage', 'Plage'] as const;
const SEASONS_LIST = ['Été', 'Automne', 'Hiver', 'Printemps'] as const;

function getCurrentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'Printemps';
  if (m >= 5 && m <= 7) return 'Été';
  if (m >= 8 && m <= 10) return 'Automne';
  return 'Hiver';
}

export default function Analysis() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currentSeason = getCurrentSeason();

  useEffect(() => {
    getWardrobe().then(w => { setWardrobe(w); setLoading(false); });
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

  // Occasion analysis
  const occasionStats = OCCASIONS.map(occ => {
    const count = wardrobe.filter(i => i.occasion?.includes(occ)).length;
    return { name: occ, count };
  });

  // Season analysis
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
        <p className="text-sm mb-6" style={{ color: '#9B9B9B' }}>
          Découvre ce qui manque pour compléter ton style
        </p>

        <div className="space-y-4">
          {/* Basiques */}
          <div
            className="rounded-2xl p-5 relative"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <span
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: '#FDF6EC', color: '#C9956C', border: '1px solid #C9956C30' }}
            >
              Premium ✨
            </span>
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
              <div className="space-y-3">
                {basicsStatus.filter(b => !b.owned).map(b => (
                  <div key={b.label} className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">🔴</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#2C2C2C' }}>
                        {b.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>
                        {b.impact}
                      </p>
                      <button
                        className="text-[11px] font-medium mt-1 underline underline-offset-2"
                        style={{ color: '#9B9B9B' }}
                      >
                        Voir des idées →
                      </button>
                    </div>
                  </div>
                ))}

                {basicsStatus.some(b => b.owned) && (
                  <div className="pt-2 mt-2" style={{ borderTop: '1px solid #F0EBE5' }}>
                    {basicsStatus.filter(b => b.owned).map(b => (
                      <div key={b.label} className="flex items-center gap-2 py-1">
                        <span className="text-sm">✅</span>
                        <span className="text-sm" style={{ color: '#BFBFBF' }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Occasion */}
          <div
            className="rounded-2xl p-5 relative"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: '#FDF6EC', color: '#C9956C', border: '1px solid #C9956C30' }}>
              Premium ✨
            </span>
            <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
              👔 Manques par occasion
            </p>
            {loading ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
            ) : (
              <div className="space-y-2.5">
                {occasionStats.map(o => {
                  const icon = o.count === 0 ? '🔴' : o.count <= 2 ? '🟡' : '✅';
                  const msg = o.count === 0
                    ? `Tu n'as rien à mettre pour ${o.name} !`
                    : o.count <= 2
                    ? 'Ajoute 1-2 pièces pour avoir plus d\'options'
                    : null;
                  return (
                    <div key={o.name} className="flex items-start gap-2.5">
                      <span className="text-sm mt-0.5">{icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: o.count >= 3 ? '#BFBFBF' : '#2C2C2C' }}>
                          {o.count === 0 ? `Aucune tenue pour ${o.name}` : o.count <= 2 ? `Peu de choix pour ${o.name}` : `${o.name} bien couverte`}
                        </p>
                        {msg && <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>{msg}</p>}
                      </div>
                      <span className="text-xs font-medium mt-0.5" style={{ color: '#9B9B9B' }}>{o.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saison */}
          <div
            className="rounded-2xl p-5 relative"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: '#FDF6EC', color: '#C9956C', border: '1px solid #C9956C30' }}>
              Premium ✨
            </span>
            <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
              🌦️ Manques par saison
            </p>
            {loading ? (
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
            ) : (
              <div className="space-y-2.5">
                {seasonStats.map(s => {
                  const icon = s.count <= 3 ? '🔴' : s.count <= 7 ? '🟡' : '✅';
                  const msg = s.count <= 3
                    ? `Il te manque des pièces pour ${s.name}`
                    : s.count <= 7
                    ? `${s.name} à compléter`
                    : null;
                  return (
                    <div
                      key={s.name}
                      className="flex items-start gap-2.5 rounded-xl px-3 py-2"
                      style={s.isCurrent ? { border: '1.5px solid #C9956C', backgroundColor: '#FDF6EC' } : {}}
                    >
                      <span className="text-sm mt-0.5">{icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: s.count > 7 ? '#BFBFBF' : '#2C2C2C' }}>
                          {s.count <= 3 ? `Dressing ${s.name} trop vide` : s.count <= 7 ? `${s.name} à compléter` : `${s.name} bien couverte`}
                          {s.isCurrent && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#C9956C', color: '#FFF' }}>Actuelle</span>}
                        </p>
                        {msg && <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>{msg}</p>}
                      </div>
                      <span className="text-xs font-medium mt-0.5" style={{ color: '#9B9B9B' }}>{s.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Style — placeholder */}
          <div
            className="rounded-2xl p-5 relative"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: '#FDF6EC', color: '#C9956C', border: '1px solid #C9956C30' }}>
              Premium ✨
            </span>
            <p className="font-serif font-semibold text-base mb-2" style={{ color: '#2C2C2C' }}>
              ✨ Manques par style
            </p>
            <p className="text-sm italic" style={{ color: '#9B9B9B' }}>Analyse en cours...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
