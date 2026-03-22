import { useState, useEffect, useCallback } from 'react';
import { WeatherData, fetchWeatherByGeolocation, fetchWeatherByCity, getSavedCity, saveCity } from '@/lib/weather';
import { getWardrobe, getDailyCounter, saveDailyCounter, getProfile } from '@/lib/storage';
import { generateRecommendations } from '@/lib/recommendations';
import { ClothingItem, UserProfile } from '@/lib/types';
import OutfitSwiper from '@/components/OutfitSwiper';
import OutfitResults from '@/components/OutfitResults';
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

interface SavedOutfitResult {
  outfitIds: string[];
  liked: boolean | null;
}

interface SavedTodayData {
  date: string;
  results: SavedOutfitResult[];
}

const STORAGE_KEY = 'mystyl_today_outfits';

function loadTodayData(today: string, wardrobe: ClothingItem[]): { outfit: ClothingItem[]; liked: boolean | null }[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: SavedTodayData = JSON.parse(raw);
    if (data.date !== today) return null;
    const resolved = data.results.map(r => {
      const items = r.outfitIds.map(id => wardrobe.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
      return { outfit: items, liked: r.liked };
    }).filter(r => r.outfit.length > 0);
    return resolved.length > 0 ? resolved : null;
  } catch {
    return null;
  }
}

function saveTodayData(today: string, results: { outfit: ClothingItem[]; liked: boolean | null }[]) {
  const data: SavedTodayData = {
    date: today,
    results: results.map(r => ({
      outfitIds: r.outfit.map(i => i.id),
      liked: r.liked,
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getAvatarFromStorage(): AvatarData {
  try {
    const raw = localStorage.getItem('alex_avatar');
    return raw ? JSON.parse(raw) : DEFAULT_AVATAR;
  } catch { return DEFAULT_AVATAR; }
}

export default function Today() {
  const [ws, setWs] = useState<WeatherState>({ status: 'loading' });
  const [cityInput, setCityInput] = useState('');
  const [recommendations, setRecommendations] = useState<ClothingItem[][]>([]);
  const [swipeResults, setSwipeResults] = useState<{ outfit: ClothingItem[]; liked: boolean | null }[] | null>(null);
  const [swipeComplete, setSwipeComplete] = useState(false);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userSeason, setUserSeason] = useState<Season | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const enough = wardrobe.length >= 8;
  const canSuggest = dailyCount < 5;
  const weatherTemp = ws.status === 'done' ? ws.data.temperature : null;

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [w, p, c] = await Promise.all([
          getWardrobe(),
          getProfile(),
          getDailyCounter(),
        ]);
        setWardrobe(w);
        setUserProfile(p);
        setDailyCount(c.date === today ? c.count : 0);
        const saved = loadTodayData(today, w);
        const shouldKeepSaved = Boolean(saved && (saved.length >= 5 || c.count >= 5));
        if (saved && shouldKeepSaved) {
          setSwipeResults(saved);
          setSwipeComplete(true);
        }
        // Fetch colorimetry season
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('colorimetry_season')
              .eq('id', userData.user.id)
              .maybeSingle();
            if (prof?.colorimetry_season) {
              setUserSeason(prof.colorimetry_season as Season);
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

  const generate = useCallback(async () => {
    if (!enough || swipeComplete) return;
    if (!canSuggest) return; // only block NEW generation requests
    const recs = generateRecommendations(wardrobe, weatherTemp, 5, userProfile);
    setRecommendations(recs);
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    await saveDailyCounter({ date: today, count: newCount });
  }, [weatherTemp, canSuggest, enough, wardrobe, dailyCount, today, swipeComplete, userProfile]);

  useEffect(() => {
    // Auto-generate only if no results saved and still has quota
    if (!loading && ws.status !== 'loading' && enough && canSuggest && recommendations.length === 0 && !swipeComplete) {
      generate();
    }
  }, [loading, ws.status, enough, canSuggest, swipeComplete]); // eslint-disable-line

  const handleSwipeComplete = (results: { outfit: ClothingItem[]; liked: boolean | null }[]) => {
    setSwipeResults(results);
    setSwipeComplete(true);
    saveTodayData(today, results);
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

  return (
    <div className="fade-enter pb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <AvatarSVG avatar={avatarData} size={40} />
          </div>
          <h1 className="text-2xl font-serif font-bold">Aujourd'hui</h1>
        </div>
        <StreakCounter />
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

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
              <p className="text-2xl font-serif font-bold">{ws.data.temperature}°C</p>
              <p className="text-muted-foreground">{ws.data.description}</p>
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

      <EventBanner onViewOutfits={() => {
        if (!enough) return;
        const recs = generateRecommendations(wardrobe, weatherTemp, 5, userProfile);
        setRecommendations(recs);
        setSwipeComplete(false);
        setSwipeResults(null);
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

      {enough && !canSuggest && !swipeComplete && (
        <div className="bg-card rounded-xl p-6 card-shadow text-center">
          <p className="text-lg font-serif">Tu as utilisé tes 5 suggestions du jour ✨</p>
          <p className="text-muted-foreground mt-2">Reviens demain ou passe en Premium pour en voir plus.</p>
        </div>
      )}

      {enough && !swipeComplete && recommendations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-serif font-semibold text-center">Suggestions du jour</h2>
          <OutfitSwiper
            outfits={recommendations}
            weatherCode={ws.status === 'done' ? ws.data.weathercode : null}
            temperature={weatherTemp}
            onComplete={handleSwipeComplete}
            userSeason={userSeason}
            userProfile={userProfile}
          />
        </div>
      )}

      {swipeComplete && swipeResults && (
        <OutfitResults
          results={swipeResults}
          weatherCode={ws.status === 'done' ? ws.data.weathercode : null}
          temperature={weatherTemp}
          userSeason={userSeason}
          userProfile={userProfile}
        />
      )}

      {enough && canSuggest && recommendations.length > 0 && recommendations.length < 5 && !swipeComplete && (
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
