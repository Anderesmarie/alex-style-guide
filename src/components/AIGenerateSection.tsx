import { useState } from 'react';
import { getThumb } from '@/lib/wardrobeImages';
import { toast } from 'sonner';
import { ClothingItem, UserProfile } from '@/lib/types';
import { getWardrobe, getProfile } from '@/lib/storage';
import { generateOutfits } from '@/lib/outfitEngine';
import { generateRecommendations } from '@/lib/recommendations';
import { geocodeCity, getSavedCity } from '@/lib/weather';
import { supabase } from '@/lib/supabase';

// Premium flag — hardcoded for now, will be wired to Stripe later
const IS_PREMIUM = true;

export interface DayWeather {
  tempMin: number;
  tempMax: number;
  amplitude: number;
  avg: number;
}

async function fetchWeatherForDate(dateKey: string): Promise<DayWeather | null> {
  try {
    const city = getSavedCity();
    if (!city) return null;
    const geo = await geocodeCity(city);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&hourly=temperature_2m&timezone=auto&start_date=${dateKey}&end_date=${dateKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temps: number[] = data.hourly?.temperature_2m ?? [];
    const times: string[] = data.hourly?.time ?? [];
    const dayTemps = times
      .map((t, i) => ({ hour: new Date(t).getHours(), temp: temps[i] }))
      .filter(x => x.hour >= 7 && x.hour <= 22)
      .map(x => x.temp);
    if (dayTemps.length === 0) return null;
    const tempMin = Math.round(Math.min(...dayTemps));
    const tempMax = Math.round(Math.max(...dayTemps));
    const avg = Math.round(dayTemps.reduce((a, b) => a + b, 0) / dayTemps.length);
    return { tempMin, tempMax, amplitude: tempMax - tempMin, avg };
  } catch {
    return null;
  }
}

interface Props {
  dateKey: string;
  occasion?: string;
  /** If provided, skips internal weather fetch and uses this directly. */
  weather?: DayWeather | null;
  onUseOutfit: (itemIds: string[]) => Promise<void> | void;
}

export default function AIGenerateSection({ dateKey, occasion, weather, onUseOutfit }: Props) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ClothingItem[] | null>(null);
  const [applying, setApplying] = useState(false);

  const handleGenerate = async () => {
    if (!IS_PREMIUM) {
      setShowPaywall(true);
      return;
    }
    setGenerating(true);
    setGenerated(null);
    try {
      const [wardrobe, profile, fetchedWeather] = await Promise.all([
        getWardrobe(),
        getProfile(),
        weather !== undefined ? Promise.resolve(weather) : fetchWeatherForDate(dateKey),
      ]);
      const dayWeather = weather !== undefined ? weather : fetchedWeather;

      // Pull full profile (colorimetry, morpho, taille, corpulence, favorite_colors)
      let fullProfile: UserProfile | null = profile;
      let userSeason: string | undefined;
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .maybeSingle();
          if (prof) {
            fullProfile = {
              ...(profile ?? {} as UserProfile),
              morphologie: prof.morphologie as any,
              taille: prof.taille as any,
              corpulence: prof.corpulence as any,
              styles: prof.styles as any ?? [],
              favorite_colors: prof.favorite_colors as any ?? [],
            };
            userSeason = (prof.colorimetry_season as string) || undefined;
          }
        }
      } catch {}

      const tempMin = weather?.tempMin ?? 18;
      const tempMax = weather?.tempMax ?? 18;
      const amplitude = weather?.amplitude ?? 0;
      const finalOccasion = occasion?.trim() || 'Quotidien';

      const candidates = generateOutfits({
        wardrobe,
        tempMin,
        tempMax,
        amplitude,
        occasion: finalOccasion,
        morphologie: fullProfile?.morphologie ?? null,
        taille: fullProfile?.taille ?? null,
        corpulence: fullProfile?.corpulence ?? null,
        colorimetry: userSeason,
        favStyles: fullProfile?.styles ?? [],
        favoriteColors: fullProfile?.favorite_colors,
        wornItemIds: [],
      });

      const first = candidates.find(c => c.items.length > 0);
      if (first) {
        setGenerated(first.items);
        return;
      }

      // Fallback to legacy recommender if engine returns nothing
      const fallback = await generateRecommendations(wardrobe, weather?.avg ?? null, 1, fullProfile);
      if (fallback.length === 0 || fallback[0].length === 0) {
        toast.error('Pas assez de pièces pour générer une tenue');
      } else {
        setGenerated(fallback[0]);
      }
    } catch {
      toast.error('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const handleUse = async () => {
    if (!generated) return;
    setApplying(true);
    try {
      await onUseOutfit(generated.map(i => i.id));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Separator with "ou" */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {!generated && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-2.5 rounded-lg border-2 bg-transparent text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ borderColor: '#C9956C', color: '#C9956C' }}
        >
          {generating ? 'Génération...' : '✨ Générer automatiquement'}
        </button>
      )}

      {generated && (
        <div className="rounded-lg border border-border p-3 bg-background/50">
          <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            {generated.map(item => (
              <img
 key={item.id}
 src={getThumb(item.imageBase64, 200)}
 alt={item.type}
 className="w-14 h-14 rounded-md object-cover flex-shrink-0" loading="lazy" decoding="async" />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUse}
              disabled={applying}
              className="flex-1 py-2 rounded-lg text-white text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{ backgroundColor: '#C9956C' }}
            >
              {applying ? '...' : 'Utiliser cette tenue'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-2 rounded-lg border text-xs text-muted-foreground"
            >
              ↻
            </button>
          </div>
        </div>
      )}

      {showPaywall && (
        <div className="mt-3 rounded-xl p-4 border" style={{ borderColor: '#C9956C', backgroundColor: '#C9956C10' }}>
          <p className="font-serif font-bold text-sm mb-1">✨ Fonctionnalité Premium</p>
          <p className="text-xs text-muted-foreground mb-3">
            Génère des tenues pour n'importe quel jour à l'avance, basées sur ta garde-robe et la météo. Passe en Premium pour débloquer.
          </p>
          <button
            onClick={() => toast.info('Bientôt disponible ✨')}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold active:scale-[0.98] transition-transform"
            style={{ backgroundColor: '#C9956C' }}
          >
            Passer en Premium
          </button>
          <button
            onClick={() => setShowPaywall(false)}
            className="w-full mt-1.5 py-1.5 text-xs text-muted-foreground"
          >
            Plus tard
          </button>
        </div>
      )}
    </div>
  );
}
