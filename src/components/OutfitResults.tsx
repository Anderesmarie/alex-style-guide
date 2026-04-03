import { useState, useEffect } from 'react';
import { ClothingItem, UserProfile } from '@/lib/types';
import { addOutfit, genId, saveLastOutfit } from '@/lib/storage';
import { getStylingTips } from '@/lib/stylingTips';
import { getColorScore } from '@/lib/colorimetry';
import { getSilhouetteScore, getMorphologyScore, getFavoriteColorScore } from '@/lib/recommendations';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { updateStreak } from '@/lib/streak';
import type { Season } from '@/lib/colorimetry';

interface OutfitResult {
  outfit: ClothingItem[];
  liked: boolean | null;
}

interface Props {
  results: OutfitResult[];
  weatherCode: number | null;
  temperature: number | null;
  userSeason?: Season | null;
  userProfile?: UserProfile | null;
}

const ROSE_GOLD = '#C9956C';

const SAVED_KEY = 'closify_saved_outfits';

function getSavedSet(today: string): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw);
    if (data.date !== today) return new Set();
    return new Set(data.keys as string[]);
  } catch { return new Set(); }
}

function persistSavedSet(today: string, keys: Set<string>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify({ date: today, keys: Array.from(keys) }));
}

export default function OutfitResults({ results, weatherCode, temperature, userSeason, userProfile }: Props) {
  const [wornTodayIdx, setWornTodayIdx] = useState<number | null>(null);
  const [loadingWorn, setLoadingWorn] = useState(true);
  const [savedIdxs, setSavedIdxs] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split('T')[0];

  // Check if an outfit was already marked as worn today
  useEffect(() => {
    const checkWornToday = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) { setLoadingWorn(false); return; }

        const { data } = await supabase
          .from('user_preferences')
          .select('item_ids')
          .eq('user_id', userData.user.id)
          .eq('reaction', 'portee')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .limit(1);

        if (data && data.length > 0) {
          const wornIds = data[0].item_ids as string[];
          const matchIdx = results.findIndex(r =>
            r.outfit.length === wornIds.length &&
            r.outfit.every(item => wornIds.includes(item.id))
          );
          if (matchIdx >= 0) setWornTodayIdx(matchIdx);
        }
      } catch {}
      setLoadingWorn(false);
    };
    checkWornToday();
  }, [today, results]);

  // Load saved state from localStorage
  useEffect(() => {
    setSavedIdxs(getSavedSet(today));
  }, [today]);

  const handleSave = (items: ClothingItem[], idx: number) => {
    const ids = items.map(i => i.id);
    saveLastOutfit(ids);
    addOutfit({
      id: genId(),
      name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
      itemIds: ids,
      createdAt: new Date().toISOString(),
    });
    const key = String(idx);
    setSavedIdxs(prev => {
      const next = new Set(prev);
      next.add(key);
      persistSavedSet(today, next);
      return next;
    });
    updateStreak();
  };

  const handleWearOutfit = async (items: ClothingItem[], idx: number) => {
    const hour = new Date().getHours();

    // Already worn today — check if can change
    if (wornTodayIdx !== null && wornTodayIdx !== idx) {
      if (hour >= 12) {
        toast.error("Tu as déjà choisi ta tenue du jour 😊", {
          description: "Après midi, la tenue est définitivement enregistrée.",
          duration: 3000,
        });
        return;
      }
      toast("Tu as déjà choisi ta tenue du jour 😊", {
        description: "Tu peux en changer jusqu'à midi.",
        duration: 3000,
      });
      // Delete old entry before inserting new one
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('reaction', 'portee')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        }
      } catch {}
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const itemIds = items.map(i => i.id);

      await supabase.from('user_preferences').insert({
        user_id: userData.user.id,
        item_ids: itemIds,
        reaction: 'portee',
        created_at: new Date().toISOString(),
      });

      setWornTodayIdx(idx);
      updateStreak();

      toast("Belle journée avec cette tenue ! 🌸", {
        duration: 3000,
        style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
      });
    } catch (e) {
      console.error('Error marking outfit as worn:', e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-4 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center">Tes tenues du jour</h2>
      <div className="grid grid-cols-3 gap-3">
        {results.map((r, idx) => {
          const isLiked = r.liked === true;
          const isWorn = wornTodayIdx === idx;
          const hasWornAny = wornTodayIdx !== null;
          const isOtherWorn = hasWornAny && !isWorn;
          const isSaved = savedIdxs.has(String(idx));
          const tips = getStylingTips(r.outfit, weatherCode, temperature);
          const normalizeColor = (color: string) =>
            color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").trim();

          let smartBadge: 'ideal' | 'color' | 'morpho' | null = null;

          const colorAvg = userSeason
            ? r.outfit.map(item => getColorScore(normalizeColor(item.color), userSeason)).reduce((a, b) => a + b, 0) / r.outfit.length
            : 0;

          const morphoAvg = userProfile?.morphologie
            ? r.outfit.map(item => getMorphologyScore(item, userProfile.morphologie)).reduce((a, b) => a + b, 0) / r.outfit.length
            : 0;

          const favoriteAvg = userProfile?.favorite_colors?.length
            ? r.outfit.map(item => getFavoriteColorScore(item, userProfile.favorite_colors)).reduce((a, b) => a + b, 0) / r.outfit.length
            : 0;

          const totalScore = colorAvg + morphoAvg + favoriteAvg;

          if (totalScore >= 3) smartBadge = 'ideal';
          else if (colorAvg >= 1 && totalScore < 3) smartBadge = 'color';
          else if (morphoAvg >= 1 && colorAvg < 1) smartBadge = 'morpho';

          return (
            <div
              key={idx}
              className={`relative bg-card rounded-xl overflow-hidden card-shadow transition-all ${
                isOtherWorn ? 'opacity-60 grayscale-[30%]' : !isLiked && !isWorn ? 'opacity-50 grayscale-[40%]' : ''
              }`}
              style={{
                border: isWorn
                  ? '2px solid #4CAF50'
                  : isLiked
                  ? `2px solid ${ROSE_GOLD}`
                  : '2px solid transparent',
              }}
            >
              {/* Smart badge top-right */}
              {smartBadge === 'ideal' && (
                <span className="absolute top-1.5 right-1.5 z-10 inline-block font-bold text-white rounded-[20px]" style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: '#C9956C' }}>
                  ⭐ Idéale
                </span>
              )}
              {smartBadge === 'color' && (
                <span className="absolute top-1.5 right-1.5 z-10 inline-block font-medium text-white rounded-[20px]" style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: '#C9956C' }}>
                  ✨ Teint
                </span>
              )}
              {smartBadge === 'morpho' && (
                <span className="absolute top-1.5 right-1.5 z-10 inline-block font-medium rounded-[20px]" style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: '#F5F0EB', color: '#C9956C', border: '1px solid #C9956C' }}>
                  📏 Morpho
                </span>
              )}

              {/* Like/Nope Badge */}
              <div className="flex justify-center pt-2">
                {isLiked ? (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${ROSE_GOLD}22`, color: ROSE_GOLD }}
                  >
                    ♥
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    ✗
                  </span>
                )}
              </div>

              {/* Images */}
              <div className="p-2 space-y-1.5">
                {r.outfit.map(item => (
                  <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.imageBase64}
                      alt={item.type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>


              {/* Styling tips */}
              <div className="border-t border-border px-2 py-2" style={{ backgroundColor: '#F5F0EB' }}>
                <p className="text-[10px] leading-tight mb-1">
                  <span className="text-muted-foreground">✨ </span>
                  <span style={{ color: '#C9956C' }}>{tips.beauty}</span>
                </p>
                <p className="text-[10px] leading-tight mb-1">
                  <span className="text-muted-foreground">💇 </span>
                  <span style={{ color: '#C9956C' }}>{tips.hair}</span>
                </p>
                <p className="text-[10px] leading-tight">
                  <span className="text-muted-foreground">👜 </span>
                  <span style={{ color: '#C9956C' }}>{tips.accessories}</span>
                </p>
              </div>

              <div className="px-2 pb-2 pt-1 space-y-1.5">
                {isSaved ? (
                  <div
                    className="w-full py-2 rounded-lg text-center font-medium text-xs text-white"
                    style={{ backgroundColor: '#4CAF50' }}
                  >
                    ✅ Sauvegardée !
                  </div>
                ) : (
                  <button
                    onClick={() => handleSave(r.outfit, idx)}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs active:scale-[0.98] transition-transform"
                  >
                    💾 Sauvegarder
                  </button>
                )}

                {isWorn ? (
                  <div
                    className="w-full py-2.5 rounded-xl text-center font-medium text-xs text-white"
                    style={{ backgroundColor: '#4CAF50' }}
                  >
                    Portée aujourd'hui 🌸
                  </div>
                ) : isOtherWorn ? (
                  <div
                    className="w-full py-2.5 rounded-xl text-center font-medium text-xs"
                    style={{ backgroundColor: '#F0F0F0', color: '#888888' }}
                  >
                    Réessayer demain 🔄
                  </div>
                ) : (
                  <button
                    onClick={() => handleWearOutfit(r.outfit, idx)}
                    disabled={loadingWorn}
                    className="w-full py-2.5 rounded-xl text-white font-medium text-xs active:scale-[0.98] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: '#4CAF50' }}
                  >
                    Je la mets ! ✅
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
