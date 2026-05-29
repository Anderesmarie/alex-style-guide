import { useEffect, useState } from 'react';
import { getThumb } from '@/lib/wardrobeImages';
import { toast } from 'sonner';
import { ClothingItem, Outfit, Trip, TripDay } from '@/lib/types';
import { getTripDays, getOutfits, getWardrobe, upsertTripDay, addOutfit, genId } from '@/lib/storage';
import AIGenerateSection from './AIGenerateSection';

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
                className="w-full px-3 py-2 rounded-lg bg-background border border-border outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-3"
              />

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
