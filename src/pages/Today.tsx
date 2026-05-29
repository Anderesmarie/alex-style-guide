import { useState, useEffect, useCallback } from 'react';
import { WeatherData, fetchWeatherByGeolocation, fetchWeatherByCity, getSavedCity, saveCity } from '@/lib/weather';
import { getWardrobe, getDailyCounter, saveDailyCounter, getProfile, migrerTagCours } from '@/lib/storage';
import { generateRecommendations } from '@/lib/recommendations';
import { generateOutfits } from '@/lib/outfitEngine';
import { ClothingItem, OutfitLayoutData, UserProfile } from '@/lib/types';
import { loadBeautyProfile } from '@/lib/stylingTips';
import OutfitDailyFeed from '@/components/OutfitDailyFeed';
import OutfitTinderSwipe from '@/components/OutfitTinderSwipe';
import CustomOutfitCard from '@/components/CustomOutfitCard';
import ProgressMilestones from '@/components/ProgressMilestones';
import StreakCounter from '@/components/StreakCounter';
import EventBanner from '@/components/EventBanner';
import AvatarSVG, { AvatarData } from '@/components/AvatarSVG';
import { DEFAULT_AVATAR } from '@/components/AvatarCreator';
import { supabase } from '@/lib/supabase';
import type { Season } from '@/lib/colorimetry';

type WeatherState =
  | { status: 'loading' }
  | { status: 'done'; data: WeatherData }
  | { status: 'geo_denied' }
  | { status: 'city_input'; error?: string; searching?: boolean }
  | { status: 'error'; message: string };

const TODAY_STORAGE_KEY = 'mystyl_today';

interface StoredToday {
interface StoredSwipeResult {
  outfitIds: string[];
  liked: boolean | null;
  savedOutfitId?: string | null;
}

interface StoredToday {
  date: string;
  outfits: string[][]; // arrays of clothing item ids
  swipeComplete?: boolean;
  swipeResults?: StoredSwipeResult[];
}

function readStoredToday(): StoredToday | null {
  try {
    const raw = localStorage.getItem(TODAY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.date === 'string' && Array.isArray(parsed.outfits)) {
      return parsed as StoredToday;
    }
    return null;
  } catch { return null; }
}

function writeStoredToday(
  date: string,
  outfits: ClothingItem[][],
  extra?: { swipeComplete?: boolean; swipeResults?: StoredSwipeResult[] }
) {
  try {
    const data: StoredToday = {
      date,
      outfits: outfits.map(o => o.map(i => i.id)),
      ...(extra ?? {}),
    };
    localStorage.setItem(TODAY_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function updateStoredTodaySwipe(extra: { swipeComplete?: boolean; swipeResults?: StoredSwipeResult[] }) {
  try {
    const raw = localStorage.getItem(TODAY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const next = { ...parsed, ...extra };
    localStorage.setItem(TODAY_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function clearStoredToday() {
  try { localStorage.removeItem(TODAY_STORAGE_KEY); } catch {}
}

  try {
    const raw = localStorage.getItem('alex_avatar');
    return raw ? JSON.parse(raw) : DEFAULT_AVATAR;
  } catch { return DEFAULT_AVATAR; }

}

export default function Today() {
  const [ws, setWs] = useState<WeatherState>({ status: 'loading' });
  const [cityInput, setCityInput] = useState('');
  const [recommendations, setRecommendations] = useState<ClothingItem[][]>([]);
  const [swipeResults, setSwipeResults] = useState<{ outfit: ClothingItem[]; liked: boolean | null; layoutData?: OutfitLayoutData | null; savedOutfitId?: string | null }[] | null>(null);
  const [swipeComplete, setSwipeComplete] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState<ClothingItem[][] | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userSeason, setUserSeason] = useState<Season | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [lifestyle, setLifestyle] = useState<string | null>(null);
  

  const today = new Date().toISOString().split('T')[0];
  const enough = wardrobe.length >= 8;
  // TEMP: limite augmentée à 99 pour les tests (remettre à 3 ensuite)
  const canSuggest = dailyCount < 99;
  const weatherTemp = ws.status === 'done' ? ws.data.temperature : null;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.time('data-load');
        const [w, p, c] = await Promise.all([
          getWardrobe(),
          getProfile(),
          getDailyCounter(),
        ]);
        loadBeautyProfile();
        console.timeEnd('data-load');
        setWardrobe(w);
        setUserProfile(p);
        setDailyCount(c.date === today ? c.count : 0);

        // No cache — outfits are always generated fresh on each load


        // Fetch full profile (colorimetry, morpho, taille, corpulence, favorite_colors)
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            migrerTagCours(userData.user.id).catch(() => {});
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .maybeSingle();
            if (import.meta.env.DEV) console.log('Profil complet chargé:', prof);
            if (prof?.colorimetry_season) {
              setUserSeason(prof.colorimetry_season as Season);
            }
            if (prof?.pseudo) {
              setPseudo(prof.pseudo);
            }
            if (prof?.lifestyle) {
              setLifestyle(prof.lifestyle);
            }
            if (prof) {
              setUserProfile(prev => ({
                ...prev,
                morphologie: prof.morphologie ?? undefined,
                taille: prof.taille ?? undefined,
                corpulence: prof.corpulence ?? undefined,
                favorite_colors: prof.favorite_colors ?? [],
              } as UserProfile));
            }
          }
        } catch {}
      } catch (e) {
        console.error('Error loading data:', e);
      }
      setLoading(false);
    };
    loadData();
  }, []); // eslint-disable-line

  // Load weather
  useEffect(() => {
    const savedCity = getSavedCity();
    if (savedCity) {
      fetchWeatherByCity(savedCity)
        .then(data => setWs({ status: 'done', data }))
        .catch(() => setWs({ status: 'city_input' }));
    } else {
      fetchWeatherByGeolocation()
        .then(data => setWs({ status: 'done', data }))
        .catch(() => setWs({ status: 'geo_denied' }));
    }
  }, []);

  const retryGeo = () => {
    setWs({ status: 'loading' });
    fetchWeatherByGeolocation()
      .then(data => setWs({ status: 'done', data }))
      .catch(() => setWs({ status: 'geo_denied' }));
  };

  const searchCity = async () => {
    const name = cityInput.trim();
    if (!name) return;
    setWs({ status: 'city_input', searching: true });
    try {
      const data = await fetchWeatherByCity(name);
      saveCity(data.city || name);
      setWs({ status: 'done', data });
    } catch (e: any) {
      if (e.message === 'CITY_NOT_FOUND') {
        setWs({ status: 'city_input', error: 'Ville non trouvée, essaie avec un autre nom' });
      } else {
        setWs({ status: 'city_input', error: 'Météo temporairement indisponible' });
      }
    }
  };

  const buildEngineInput = useCallback(() => {
    const tempMin = ws.status === 'done' ? ws.data.tempMin : (weatherTemp ?? 18);
    const tempMax = ws.status === 'done' ? ws.data.tempMax : (weatherTemp ?? 18);
    const amplitude = ws.status === 'done' ? (ws.data.amplitude ?? Math.max(0, tempMax - tempMin)) : 0;
    const day = new Date().getDay(); // 0=Sun, 6=Sat
    const isWeekday = day >= 1 && day <= 5;
    const worksLifestyle = lifestyle === 'Premier job' || lifestyle === 'Je travaille';
    const occasion = isWeekday && worksLifestyle ? 'Travail' : 'Quotidien';
    return {
      wardrobe,
      tempMin,
      tempMax,
      amplitude,
      occasion,
      morphologie: userProfile?.morphologie ?? null,
      taille: userProfile?.taille ?? null,
      corpulence: userProfile?.corpulence ?? null,
      colorimetry: userSeason ?? undefined,
      favStyles: userProfile?.styles ?? [],
      favoriteColors: userProfile?.favorite_colors,
      wornItemIds: [],
    };
  }, [ws, weatherTemp, wardrobe, userProfile, userSeason, lifestyle]);

  const generate = useCallback(async () => {
    if (!enough || swipeComplete || pendingSwipe) return;
    if (!canSuggest) return;

    let recs: ClothingItem[][] = [];

    // Try to restore today's outfits from localStorage
    const stored = readStoredToday();
    if (stored && stored.date === today) {
      recs = stored.outfits
        .map(ids => ids
          .map(id => wardrobe.find(w => w.id === id))
          .filter((it): it is ClothingItem => !!it))
        .filter(o => o.length > 0);
    }

    // No valid cache for today → generate fresh and store
    if (recs.length === 0) {
      const candidates = generateOutfits(buildEngineInput());
      recs = candidates.map(c => c.items);
      writeStoredToday(today, recs);
    }

    setRecommendations(recs);
    if (recs.length > 0) {
      setPendingSwipe(recs);
    }
  }, [enough, swipeComplete, pendingSwipe, canSuggest, buildEngineInput, wardrobe, today]);


  const handleSwipeComplete = useCallback(async (likes: boolean[]) => {
    if (!pendingSwipe) return;
    const results = pendingSwipe.map((outfit, i) => ({
      outfit,
      liked: likes[i] ?? null,
      layoutData: null,
    }));
    setSwipeResults(results);
    setSwipeComplete(true);
    setPendingSwipe(null);
    // No cache — results live only in component state
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    await saveDailyCounter({ date: today, count: newCount });
  }, [pendingSwipe, today, dailyCount]);

  // Auto-generate only if no saved results for today and has quota
  useEffect(() => {
    if (!loading && ws.status !== 'loading' && enough && !swipeComplete && recommendations.length === 0 && canSuggest) {
      generate();
    }
  }, [loading, ws.status, enough, swipeComplete]); // eslint-disable-line

  const handleResultsChange = (next: { outfit: ClothingItem[]; liked: boolean | null; layoutData?: OutfitLayoutData | null; savedOutfitId?: string | null }[]) => {
    setSwipeResults(next);
    // No cache — state-only
  };

  const avatarData = getAvatarFromStorage();

  if (loading) {
    return (
      <div className="fade-enter pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="h-8 w-40 rounded bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-4 w-48 rounded bg-muted animate-pulse mt-2 mb-4" />
        <div className="bg-card rounded-xl p-5 card-shadow mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resetDailyForTest = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('daily_counter')
          .upsert({ user_id: userData.user.id, date: today, count: 0 }, { onConflict: 'user_id,date' });
      }

      await saveDailyCounter({ date: today, count: 0 });
      setDailyCount(0);
      setSwipeResults(null);
      setSwipeComplete(false);

      // Clear today's localStorage cache so outfits are regenerated fresh
      clearStoredToday();

      // Regenerate fresh outfits immediately and re-store them
      if (enough) {
        const candidates = generateOutfits(buildEngineInput());
        const recs = candidates.map(c => c.items);
        writeStoredToday(today, recs);
        setRecommendations(recs);
        setPendingSwipe(recs.length > 0 ? recs : null);
      } else {
        setRecommendations([]);
        setPendingSwipe(null);
      }


    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  return (
    <div className="fade-enter pb-4">
      {/* TEMP test button — remove before prod */}
      <div className="flex justify-end mb-2">
        <button
          onClick={resetDailyForTest}
          className="text-xs text-muted-foreground underline active:opacity-60"
        >
          🔄 Reset tenues (test)
        </button>
      </div>
      {(() => {
        const hour = new Date().getHours();
        const name = pseudo || 'toi';
        let greeting = '';
        let subGreeting = '';
        if (hour >= 6 && hour < 12) {
          greeting = `Bonjour ${name} ☀️`;
          subGreeting = 'Prête à être stylée ?';
        } else if (hour >= 12 && hour < 18) {
          greeting = `Coucou ${name} ✨`;
          subGreeting = 'On trouve ta tenue du jour ?';
        } else {
          greeting = `Bonsoir ${name} 🌙`;
          subGreeting = 'Une tenue pour ce soir ?';
        }
        return (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <AvatarSVG avatar={avatarData} size={40} />
                </div>
                <h1 className="text-2xl font-serif font-bold">{greeting}</h1>
              </div>
              <StreakCounter />
            </div>
            <p className="text-sm italic ml-[52px]" style={{ color: '#C9956C' }}>{subGreeting}</p>
            <p className="text-muted-foreground text-xs ml-[52px] mb-4">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </>
        );
      })()}

      <ProgressMilestones />

      {/* Weather */}
      <div className="bg-card rounded-xl p-5 card-shadow mb-6">
        {ws.status === 'loading' && (
          <div className="flex items-center gap-4">
            <div className="skeleton w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-24" />
              <div className="skeleton h-4 w-36" />
            </div>
          </div>
        )}

        {ws.status === 'done' && (
          <div className="flex items-center gap-4">
            <span className="text-5xl">{ws.data.emoji}</span>
            <div>
              <p className="text-2xl font-serif font-bold">{ws.data.tempMin}°C — {ws.data.tempMax}°C</p>
              <p className="text-xs text-muted-foreground">{(() => { const h = new Date().getHours(); if (h < 12) return 'Habillée pour ce matin ☀️'; if (h < 17) return 'Habillée pour cet après-midi 🌤️'; return 'Habillée pour ce soir 🌙'; })()}</p>
              <p className="text-muted-foreground">{ws.data.description}</p>
              {typeof ws.data.amplitude === 'number' && ws.data.amplitude >= 15 && (
                <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>Grande amplitude aujourd'hui 🧥</p>
              )}
              {typeof ws.data.amplitude === 'number' && ws.data.amplitude >= 8 && ws.data.amplitude < 15 && (
                <p className="text-xs mt-0.5" style={{ color: '#C9956C' }}>Pensez à une couche amovible 🧣</p>
              )}
              {ws.data.city && (
                <p className="text-xs text-muted-foreground mt-0.5">📍 {ws.data.city}</p>
              )}
            </div>
          </div>
        )}

        {ws.status === 'geo_denied' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">📍 Active la localisation pour la météo de ton quartier</p>
            <div className="flex gap-2 justify-center">
              <button onClick={retryGeo}
                className="py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm active:scale-[0.98] transition-transform">
                Réessayer
              </button>
              <button onClick={() => setWs({ status: 'city_input' })}
                className="py-2 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm active:scale-[0.98] transition-transform">
                Chercher ma ville
              </button>
            </div>
          </div>
        )}

        {ws.status === 'city_input' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Quelle est ta ville ?</p>
            <div className="flex gap-2">
              <input type="text" value={cityInput} onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchCity()} placeholder="Ex : Paris"
                className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={searchCity} disabled={ws.searching}
                className="py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-50">
                {ws.searching ? '...' : 'OK'}
              </button>
            </div>
            {ws.error && <p className="text-xs text-destructive text-center">{ws.error}</p>}
          </div>
        )}

        {ws.status === 'error' && (
          <p className="text-muted-foreground text-center text-sm">{ws.message}</p>
        )}
      </div>

      <EventBanner onViewOutfits={async () => {
        if (!enough) return;
        const candidates = generateOutfits(buildEngineInput());
        const recs = candidates.map(c => c.items);
        setRecommendations(recs);
        setSwipeComplete(false);
        setSwipeResults(null);
        setPendingSwipe(recs);
      }} />

      {!enough && (
        <div className="bg-card rounded-xl p-6 card-shadow text-center">
          <p className="text-lg font-serif mb-3">
            Ajoute encore {8 - wardrobe.length} pièce{8 - wardrobe.length > 1 ? 's' : ''} pour débloquer les recommandations du jour 👗
          </p>
          <div className="progress-bar mt-3">
            <div className="progress-bar-fill" style={{ width: `${(wardrobe.length / 8) * 100}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{wardrobe.length}/8 pièces</p>
        </div>
      )}

      {/* Phase 1 — swipe Tinder */}
      {pendingSwipe && !swipeComplete && (
        <OutfitTinderSwipe
          outfits={pendingSwipe}
          pseudo={pseudo}
          onComplete={handleSwipeComplete}
        />
      )}

      {/* Phase 2 — liste verticale des 3 tenues */}
      {swipeComplete && swipeResults && (
        <>
          <OutfitDailyFeed
            results={swipeResults}
            weatherCode={ws.status === 'done' ? ws.data.weathercode : null}
            temperature={weatherTemp}
            userSeason={userSeason}
            userProfile={userProfile}
            pseudo={pseudo}
            wardrobe={wardrobe}
            onResultsChange={handleResultsChange}
          />
          {/* Custom outfit card — always after auto results */}
          <div className="mt-4">
            <CustomOutfitCard
              wardrobe={wardrobe}
              temperature={weatherTemp}
              weatherCode={ws.status === 'done' ? ws.data.weathercode : null}
              userProfile={userProfile}
            />
          </div>
        </>
      )}

      {/* Limit message — always BELOW results, never replaces them */}
      {enough && !canSuggest && !swipeComplete && !swipeResults && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Tu as utilisé tes 3 suggestions du jour ✨ Reviens demain pour de nouvelles idées.
        </p>
      )}

      {enough && canSuggest && recommendations.length > 0 && recommendations.length < 3 && !swipeComplete && (
        <p className="text-sm text-muted-foreground text-center mt-2">Ajoute plus de pièces pour débloquer plus de suggestions 👗</p>
      )}

      {enough && canSuggest && recommendations.length === 0 && ws.status !== 'loading' && !swipeComplete && (
        <div className="bg-card rounded-xl p-6 card-shadow text-center">
          <p className="text-muted-foreground">Aucune suggestion disponible pour le moment.</p>
          <button onClick={generate}
            className="mt-3 py-2 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            Générer des suggestions
          </button>
        </div>
      )}
    </div>
  );
}
