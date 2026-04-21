import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarEvent, ClothingItem, Outfit, Trip } from '@/lib/types';
import {
  getCalendarEvents,
  upsertCalendarEvent,
  deleteCalendarEvent,
  getOutfits,
  getWardrobe,
  getTrips,
  upsertTrip,
  deleteTrip,
} from '@/lib/storage';
import TripDetail from './TripDetail';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Bottom sheet state
  const [openDate, setOpenDate] = useState<Date | null>(null);
  const [draftEventName, setDraftEventName] = useState('');
  const [draftOutfitId, setDraftOutfitId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Trip creation sheet
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  const [tripDest, setTripDest] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [creatingTrip, setCreatingTrip] = useState(false);

  // Trip detail navigation
  const [openTrip, setOpenTrip] = useState<Trip | null>(null);

  const load = async () => {
    const [ev, o, w, t] = await Promise.all([getCalendarEvents(), getOutfits(), getWardrobe(), getTrips()]);
    setEvents(ev);
    setOutfits(o);
    setWardrobe(w);
    setTrips(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const getEventForDate = (d: Date): CalendarEvent | undefined =>
    events.find(e => e.date === formatDateKey(d));

  const getOutfit = (id: string | null | undefined): Outfit | undefined =>
    id ? outfits.find(o => o.id === id) : undefined;

  const getFirstItem = (outfit: Outfit | undefined): ClothingItem | undefined => {
    if (!outfit) return undefined;
    for (const id of outfit.itemIds) {
      const item = wardrobe.find(i => i.id === id);
      if (item) return item;
    }
    return undefined;
  };

  const openDayEditor = (d: Date) => {
    const ev = getEventForDate(d);
    setDraftEventName(ev?.eventName ?? '');
    setDraftOutfitId(ev?.outfitId ?? null);
    setOpenDate(d);
  };

  const closeDayEditor = () => {
    setOpenDate(null);
    setDraftEventName('');
    setDraftOutfitId(null);
  };

  const handleSave = async () => {
    if (!openDate) return;
    setSaving(true);
    try {
      const existing = getEventForDate(openDate);
      await upsertCalendarEvent({
        id: existing?.id,
        date: formatDateKey(openDate),
        outfitId: draftOutfitId,
        eventName: draftEventName.trim() || null,
      });
      const ev = await getCalendarEvents();
      setEvents(ev);
      toast.success('Journée enregistrée ✨');
      closeDayEditor();
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleClearDay = async () => {
    if (!openDate) return;
    const existing = getEventForDate(openDate);
    if (!existing) return;
    setSaving(true);
    try {
      await deleteCalendarEvent(existing.id);
      const ev = await getCalendarEvents();
      setEvents(ev);
      toast.success('Journée effacée');
      closeDayEditor();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  // Trip helpers
  const openTripCreator = () => {
    setTripDest('');
    setTripStart('');
    setTripEnd('');
    setTripSheetOpen(true);
  };

  const handleCreateTrip = async () => {
    if (!tripDest.trim()) {
      toast.error('Choisis une destination');
      return;
    }
    if (!tripStart || !tripEnd) {
      toast.error('Choisis les dates');
      return;
    }
    if (tripEnd < tripStart) {
      toast.error('La date de retour doit être après le départ');
      return;
    }
    setCreatingTrip(true);
    try {
      await upsertTrip({
        destination: tripDest.trim(),
        startDate: tripStart,
        endDate: tripEnd,
      });
      const t = await getTrips();
      setTrips(t);
      setTripSheetOpen(false);
      toast.success('Voyage créé ✨');
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleDeleteTrip = async (trip: Trip) => {
    if (!confirm(`Supprimer le voyage à ${trip.destination} ?`)) return;
    try {
      await deleteTrip(trip.id);
      const t = await getTrips();
      setTrips(t);
      toast.success('Voyage supprimé');
    } catch {
      toast.error('Erreur');
    }
  };

  const formatTripRange = (trip: Trip): string => {
    const [sy, sm, sd] = trip.startDate.split('-').map(Number);
    const [ey, em, ed] = trip.endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    return `${start.getDate()} ${MONTHS_FR[start.getMonth()]} → ${end.getDate()} ${MONTHS_FR[end.getMonth()]} ${end.getFullYear()}`;
  };

  const tripDayCount = (trip: Trip): number => {
    const [sy, sm, sd] = trip.startDate.split('-').map(Number);
    const [ey, em, ed] = trip.endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd).getTime();
    const end = new Date(ey, em - 1, ed).getTime();
    return Math.round((end - start) / 86400000) + 1;
  };

  if (openTrip) {
    return <TripDetail trip={openTrip} onBack={() => setOpenTrip(null)} />;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-20 h-32 rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-enter">
      {/* Week strip */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {days.map(d => {
          const ev = getEventForDate(d);
          const outfit = getOutfit(ev?.outfitId);
          const firstItem = getFirstItem(outfit);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={formatDateKey(d)}
              onClick={() => openDayEditor(d)}
              className={`flex-shrink-0 w-[88px] bg-card rounded-xl p-2.5 card-shadow text-center active:scale-[0.97] transition-transform ${
                isToday ? 'ring-2' : ''
              }`}
              style={isToday ? { boxShadow: '0 0 0 2px #C9956C' } : undefined}
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{DAYS_FR[d.getDay()]}</p>
              <p className="font-serif text-2xl leading-tight mt-0.5">{d.getDate()}</p>
              <div className="mt-2 flex items-center justify-center">
                {firstItem ? (
                  <img
                    src={firstItem.imageBase64}
                    alt={firstItem.type}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-2xl text-muted-foreground/60">
                    +
                  </div>
                )}
              </div>
              {ev?.eventName && (
                <p
                  className="mt-1.5 text-[10px] truncate font-medium"
                  style={{ color: '#C9956C' }}
                  title={ev.eventName}
                >
                  {ev.eventName}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Trips section */}
      <div className="mt-8">
        <h2 className="font-serif text-xl font-bold mb-3">Mes voyages</h2>
        <button
          onClick={() => toast('Bientôt disponible ✨')}
          className="w-full py-3.5 rounded-xl text-primary-foreground font-semibold active:scale-[0.98] transition-transform shadow-lg"
          style={{ backgroundColor: '#C9956C' }}
        >
          + Planifier un voyage
        </button>
      </div>

      {/* Bottom sheet */}
      {openDate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={closeDayEditor}
        >
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-card rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold mb-4 capitalize">
              {DAYS_FULL_FR[openDate.getDay()]} {openDate.getDate()} {MONTHS_FR[openDate.getMonth()]}
            </h3>

            <label className="block text-sm font-medium mb-1.5">Événement ?</label>
            <input
              type="text"
              value={draftEventName}
              onChange={e => setDraftEventName(e.target.value)}
              placeholder="Anniversaire, soirée, cours..."
              className="w-full px-4 py-3 rounded-lg bg-background border border-border outline-none focus:ring-2 focus:ring-primary/30 mb-5"
            />

            <p className="text-sm font-medium mb-2">Choisir une tenue</p>
            {outfits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune tenue sauvegardée pour l'instant
              </p>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5 mb-5">
                {outfits.map(o => {
                  const item = getFirstItem(o);
                  const selected = draftOutfitId === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setDraftOutfitId(selected ? null : o.id)}
                      className={`flex-shrink-0 w-24 rounded-xl overflow-hidden border-2 transition-all ${
                        selected ? '' : 'border-transparent'
                      }`}
                      style={selected ? { borderColor: '#C9956C' } : undefined}
                    >
                      {item ? (
                        <img src={item.imageBase64} alt={o.name} className="w-24 h-24 object-cover" />
                      ) : (
                        <div className="w-24 h-24 bg-muted" />
                      )}
                      <p className="text-[11px] font-medium px-1 py-1.5 truncate text-left bg-card">
                        {o.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-xl text-primary-foreground font-semibold active:scale-[0.98] transition-transform shadow-lg disabled:opacity-60"
              style={{ backgroundColor: '#C9956C' }}
            >
              Enregistrer
            </button>

            {getEventForDate(openDate) && (
              <button
                onClick={handleClearDay}
                disabled={saving}
                className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Effacer ce jour
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
