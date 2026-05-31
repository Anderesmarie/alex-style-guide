import { useEffect, useState } from 'react';
import { getThumb } from '@/lib/wardrobeImages';
import { toast } from 'sonner';
import { ClothingItem, Outfit, Trip, TripDay, OCCASIONS } from '@/lib/types';
import { getTripDays, getOutfits, getWardrobe, upsertTripDay, addOutfit, genId } from '@/lib/storage';
import { geocodeCity } from '@/lib/weather';
import AIGenerateSection, { DayWeather } from './AIGenerateSection';

const DAYS_FULL_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatLongDate(d: Date): string {
  return `${DAYS_FULL_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function daysBetween(start: string, end: string): Date[] {
  const s = parseDateKey(start);
  const e = parseDateKey(end);
  const days: Date[] = [];
  const cur = new Date(s);
  while (cur <= e) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

interface Props {
  trip: Trip;
  onBack: () => void;
}

export default function TripDetail({ trip, onBack }: Props) {
  const [days, setDays] = useState<TripDay[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerForDate, setPickerForDate] = useState<string | null>(null);
  const [activityDrafts, setActivityDrafts] = useState<Record<string, string>>({});
  const [occasionDrafts, setOccasionDrafts] = useState<Record<string, string>>({});

  // Weather centralized at trip level
  const cityStorageKey = `mystyl_trip_city_${trip.id}`;
  const [weatherCity, setWeatherCity] = useState<string>(() => {
    try { return localStorage.getItem(cityStorageKey) || trip.destination; }
    catch { return trip.destination; }
  });
  const [cityEditing, setCityEditing] = useState(false);
  const [cityDraft, setCityDraft] = useState(weatherCity);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [dayWeathers, setDayWeathers] = useState<Record<string, DayWeather>>({});

  const load = async () => {
    const [d, o, w] = await Promise.all([getTripDays(trip.id), getOutfits(), getWardrobe()]);
    setDays(d);
    setOutfits(o);
    setWardrobe(w);
    const drafts: Record<string, string> = {};
    d.forEach(day => { drafts[day.date] = day.eventName ?? ''; });
    setActivityDrafts(drafts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [trip.id]);

  // Fetch weather ONCE for the whole trip range whenever weatherCity changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!weatherCity.trim()) return;
      setWeatherStatus('loading');
      setWeatherError(null);
      try {
        const geo = await geocodeCity(weatherCity.trim());
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&hourly=temperature_2m&timezone=auto&start_date=${trip.startDate}&end_date=${trip.endDate}`
        );
        if (!res.ok) throw new Error('METEO_KO');
        const data = await res.json();
        const times: string[] = data.hourly?.time ?? [];
        const temps: number[] = data.hourly?.temperature_2m ?? [];
        const buckets: Record<string, number[]> = {};
        times.forEach((t, i) => {
          const dt = new Date(t);
          const hour = dt.getHours();
          if (hour < 7 || hour > 22) return;
          const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          (buckets[k] = buckets[k] || []).push(temps[i]);
        });
        const result: Record<string, DayWeather> = {};
        Object.entries(buckets).forEach(([k, arr]) => {
          if (arr.length === 0) return;
          const tempMin = Math.round(Math.min(...arr));
          const tempMax = Math.round(Math.max(...arr));
          const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
          result[k] = { tempMin, tempMax, amplitude: tempMax - tempMin, avg };
        });
        if (!cancelled) {
          setDayWeathers(result);
          setWeatherStatus('done');
        }
      } catch (e: any) {
        if (cancelled) return;
        setWeatherStatus('error');
        setWeatherError(e?.message === 'CITY_NOT_FOUND' ? 'Ville non trouvée' : 'Météo indisponible');
      }
    };
    run();
    return () => { cancelled = true; };
  }, [weatherCity, trip.startDate, trip.endDate]);

  const handleCityValidate = () => {
    const v = cityDraft.trim();
    if (!v) return;
    try { localStorage.setItem(cityStorageKey, v); } catch {}
    setWeatherCity(v);
    setCityEditing(false);
  };

  const allDates = daysBetween(trip.startDate, trip.endDate);
  const totalDays = allDates.length;

  const getDayFor = (dateKey: string): TripDay | undefined =>
    days.find(d => d.date === dateKey);

  const getOutfit = (id: string | null | undefined): Outfit | undefined =>
    id ? outfits.find(o => o.id === id) : undefined;

  const getItemsForOutfit = (outfit: Outfit | undefined): ClothingItem[] => {
    if (!outfit) return [];
    return outfit.itemIds
      .map(id => wardrobe.find(i => i.id === id))
      .filter(Boolean) as ClothingItem[];
  };

  const handleSaveActivity = async (dateKey: string) => {
    const existing = getDayFor(dateKey);
    const eventName = activityDrafts[dateKey]?.trim() || null;
    try {
      await upsertTripDay({
        id: existing?.id,
        tripId: trip.id,
        date: dateKey,
        outfitId: existing?.outfitId ?? null,
        eventName,
      });
      const d = await getTripDays(trip.id);
      setDays(d);
      toast.success('Activité enregistrée');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleAssignOutfit = async (dateKey: string, outfitId: string) => {
    const existing = getDayFor(dateKey);
    try {
      await upsertTripDay({
        id: existing?.id,
        tripId: trip.id,
        date: dateKey,
        outfitId,
        eventName: existing?.eventName ?? activityDrafts[dateKey]?.trim() ?? null,
      });
      const d = await getTripDays(trip.id);
      setDays(d);
      setPickerForDate(null);
      toast.success('Tenue assignée ✨');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleClearOutfit = async (dateKey: string) => {
    const existing = getDayFor(dateKey);
    if (!existing) return;
    try {
      await upsertTripDay({
        id: existing.id,
        tripId: trip.id,
        date: dateKey,
        outfitId: null,
        eventName: existing.eventName,
      });
      const d = await getTripDays(trip.id);
      setDays(d);
    } catch {
      toast.error('Erreur');
    }
  };

  // Packing list — unique items across all assigned outfits
  const packingItems: ClothingItem[] = (() => {
    const ids = new Set<string>();
    days.forEach(day => {
      const outfit = getOutfit(day.outfitId);
      outfit?.itemIds.forEach(id => ids.add(id));
    });
    return Array.from(ids)
      .map(id => wardrobe.find(i => i.id === id))
      .filter(Boolean) as ClothingItem[];
  })();

  if (loading) {
    return (
      <div className="space-y-3 fade-enter">
        <div className="h-8 w-40 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded-xl bg-muted animate-pulse" />
        <div className="h-20 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="fade-enter pb-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-2xl">←</button>
        <div>
          <h1 className="text-2xl font-serif font-bold leading-tight">🧳 {trip.destination}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatShortDate(parseDateKey(trip.startDate))} → {formatShortDate(parseDateKey(trip.endDate))} {parseDateKey(trip.endDate).getFullYear()} · {totalDays} jour{totalDays > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Ville météo — centralisée pour tout le voyage */}
      <div className="bg-card rounded-xl p-3 card-shadow mb-4">
        {cityEditing ? (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Ville pour la météo du voyage</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={cityDraft}
                onChange={e => setCityDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCityValidate()}
                placeholder="Ex : Rome"
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleCityValidate}
                className="px-4 rounded-lg text-primary-foreground text-sm font-semibold active:scale-[0.98]"
                style={{ backgroundColor: '#C9956C' }}
              >OK</button>
              <button
                onClick={() => { setCityDraft(weatherCity); setCityEditing(false); }}
                className="px-3 rounded-lg border border-border text-xs text-muted-foreground"
              >Annuler</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Météo du voyage</p>
              <p className="text-sm font-medium truncate">
                📍 {weatherCity}
                {weatherStatus === 'loading' && <span className="text-muted-foreground"> · chargement…</span>}
                {weatherStatus === 'error' && <span className="text-destructive"> · {weatherError}</span>}
              </p>
            </div>
            <button
              onClick={() => { setCityDraft(weatherCity); setCityEditing(true); }}
              className="text-xs font-medium"
              style={{ color: '#C9956C' }}
            >✏️ Modifier</button>
          </div>
        )}
      </div>


      <div className="space-y-3">
        {allDates.map(d => {
          const key = formatDateKey(d);
          const day = getDayFor(key);
          const outfit = getOutfit(day?.outfitId);
          const items = getItemsForOutfit(outfit);
          return (
            <div key={key} className="bg-card rounded-xl p-4 card-shadow">
              <p className="font-serif font-semibold capitalize mb-2">{formatLongDate(d)}</p>

              <input
                type="text"
                value={activityDrafts[key] ?? ''}
                onChange={e => setActivityDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => handleSaveActivity(key)}
                placeholder="Visite musée, plage, soirée..."
                className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-2"
              />

              <select
                value={occasionDrafts[key] ?? 'Quotidien'}
                onChange={e => setOccasionDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-3"
              >
                {OCCASIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>

              {outfit ? (
                <div>
                  <div className="flex gap-1.5 mb-2">
                    {items.slice(0, 5).map(item => (
                      <img
 key={item.id}
 src={getThumb(item.imageBase64, 300)}
 alt={item.type}
 className="w-12 h-12 rounded-md object-cover" loading="lazy" decoding="async" />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPickerForDate(key)}
                      className="text-xs font-medium"
                      style={{ color: '#C9956C' }}
                    >
                      Changer
                    </button>
                    <button
                      onClick={() => handleClearOutfit(key)}
                      className="text-xs text-muted-foreground"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPickerForDate(key)}
                  className="w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  + Choisir une tenue
                </button>
              )}

              <AIGenerateSection
                dateKey={key}
                occasion={occasionDrafts[key] ?? 'Quotidien'}
                onUseOutfit={async (itemIds) => {
                  try {
                    const newOutfitId = genId();
                    await addOutfit({
                      id: newOutfitId,
                      name: `Tenue IA · ${d.getDate()}/${d.getMonth() + 1}`,
                      itemIds,
                      createdAt: new Date().toISOString(),
                    });
                    const existing = getDayFor(key);
                    await upsertTripDay({
                      id: existing?.id,
                      tripId: trip.id,
                      date: key,
                      outfitId: newOutfitId,
                      eventName: existing?.eventName ?? activityDrafts[key]?.trim() ?? null,
                    });
                    const [ds, os] = await Promise.all([getTripDays(trip.id), getOutfits()]);
                    setDays(ds);
                    setOutfits(os);
                    toast.success('Tenue assignée ✨');
                  } catch {
                    toast.error('Erreur');
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Packing list */}
      <div className="mt-8">
        <h2 className="font-serif text-xl font-bold mb-3">Ma liste valise 🧳</h2>
        {packingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Assigne des tenues pour voir ta liste valise
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {packingItems.length} pièce{packingItems.length > 1 ? 's' : ''} à emporter
            </p>
            <div className="grid grid-cols-3 gap-2">
              {packingItems.map(item => (
                <div key={item.id} className="rounded-lg overflow-hidden bg-card card-shadow">
                  <img src={getThumb(item.imageBase64, 300)} alt={item.type} className="w-full aspect-square object-cover" loading="lazy" decoding="async" />
                  <p className="text-[10px] px-1.5 py-1 truncate">{item.type}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Outfit picker bottom sheet */}
      {pickerForDate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setPickerForDate(null)}
        >
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-card rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold mb-4">Choisir une tenue</h3>
            {outfits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucune tenue sauvegardée pour l'instant
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {outfits.map(o => {
                  const items = getItemsForOutfit(o);
                  const first = items[0];
                  return (
                    <button
                      key={o.id}
                      onClick={() => handleAssignOutfit(pickerForDate, o.id)}
                      className="rounded-xl overflow-hidden bg-background border border-border active:scale-[0.97] transition-transform text-left"
                    >
                      {first ? (
                        <img src={getThumb(first.imageBase64, 300)} alt={o.name} className="w-full aspect-square object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full aspect-square bg-muted" />
                      )}
                      <p className="text-xs font-medium px-2 py-2 truncate">{o.name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
