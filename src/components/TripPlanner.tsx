import { useEffect, useMemo, useState } from 'react';
import { getWardrobe, getOutfits } from '@/lib/storage';
import { geocodeCity } from '@/lib/weather';
import { supabase } from '@/lib/supabase';

const BAG_TYPES: { id: 'cabine-legere' | 'valise-cabine' | 'valise-soute'; label: string; emoji: string }[] = [
  { id: 'cabine-legere', label: 'Cabine légère', emoji: '👜' },
  { id: 'valise-cabine', label: 'Valise cabine', emoji: '🧳' },
  { id: 'valise-soute', label: 'Valise soute', emoji: '🧳' },
];

const BAG_SUBS: Record<string, string> = {
  'cabine-legere': '5–7 kg',
  'valise-cabine': '10 kg',
  'valise-soute': '23 kg',
};

const STYLES_LIST = [
  'Casual chic', 'Streetwear', 'Y2K', 'Vintage', 'Sportswear', 'Bohème',
  'Minimaliste', 'Grunge', 'Dark', 'Romantique', 'Old Money', 'Preppy',
];

const OCCASIONS_LIST = [
  'Quotidien', 'Travail', 'Sortie', 'Sport',
  'Plage', 'Soirée', 'Cérémonie/Événement', 'Soirée étudiante',
];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  const diff = (db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

interface Props {
  onBack: () => void;
}

export default function TripPlanner({ onBack }: Props) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bagType, setBagType] = useState<'cabine-legere' | 'valise-cabine' | 'valise-soute' | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [packingResult, setPackingResult] = useState<any>(null);
  const [wardrobe, setWardrobe] = useState<any[]>([]);

  const STORAGE_KEY = `mystyl_trip_gen_${new Date().getFullYear()}-${new Date().getMonth()}`;
  const FREE_LIMIT = 2;
  const getUsageCount = () => parseInt(localStorage.getItem(STORAGE_KEY) ?? '0');
  const incrementUsage = () => localStorage.setItem(STORAGE_KEY, String(getUsageCount() + 1));

  const handleGenerate = async () => {
    if (getUsageCount() >= FREE_LIMIT) {
      alert('Limite gratuite atteinte ce mois-ci ✨ Passe en Premium pour générer plus de valises.');
      return;
    }
    setStep('loading');
    try {
      console.log('destination:', destination);
      console.log('startDate:', startDate);
      console.log('endDate:', endDate);

      let tempMin = 15;
      let tempMax = 22;
      try {
        const geo = await geocodeCity(destination);
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&daily=temperature_2m_min,temperature_2m_max&start_date=${startDate}&end_date=${endDate}&timezone=auto`
        );
        if (!res.ok) throw new Error('Météo indisponible');
        const wx = await res.json();
        const mins: number[] = wx.daily?.temperature_2m_min ?? [];
        const maxs: number[] = wx.daily?.temperature_2m_max ?? [];
        tempMin = mins.length ? Math.round(Math.min(...mins)) : 15;
        tempMax = maxs.length ? Math.round(Math.max(...maxs)) : 22;
      } catch (weatherErr) {
        console.warn('Météo indisponible, valeurs par défaut utilisées', weatherErr);
      }

      const [wrd, savedOutfits] = await Promise.all([getWardrobe(), getOutfits()]);
      const nbDays = Math.max(1, daysBetween(startDate, endDate) + 1);

      const { data, error } = await supabase.functions.invoke('generate-trip-packing', {
        body: {
          wardrobe: wrd,
          savedOutfits,
          destination,
          nbDays,
          tempMin,
          tempMax,
          styles: selectedStyles,
          occasions: selectedOccasions,
          bagType,
        },
      });
      if (error) throw error;

      setPackingResult(data);
      setWardrobe(wrd);
      incrementUsage();
      setStep('result');
    } catch (e: any) {
      console.error(e);
      alert(`Erreur : ${e?.message ?? 'génération impossible'}`);
      setStep('form');
    }
  };

  const today = todayISO();
  const dateDiff = daysBetween(startDate, endDate);
  const dateError = startDate && endDate && dateDiff > 7;
  const datesValid = startDate && endDate && dateDiff >= 0 && dateDiff <= 7;

  const canGenerate =
    destination.trim().length > 0 &&
    datesValid &&
    bagType !== null &&
    selectedStyles.length > 0 &&
    selectedOccasions.length > 0;

  const toggleStyle = (s: string) => {
    setSelectedStyles(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length >= 2) return prev;
      return [...prev, s];
    });
  };

  const toggleOccasion = (o: string) => {
    setSelectedOccasions(prev => {
      if (prev.includes(o)) return prev.filter(x => x !== o);
      if (prev.length >= 3) return prev;
      return [...prev, o];
    });
  };




  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-enter">
        <div className="w-10 h-10 border-4 border-muted border-t-[#C9956C] rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Préparation de ta valise...</p>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="fade-enter pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStep('form')} className="text-2xl">←</button>
          <h1 className="text-2xl font-serif font-bold leading-tight">Ma valise 🧳</h1>
        </div>

        {packingResult?.conseil && (
          <div className="bg-card rounded-xl p-3 mb-4">
            <p className="text-xs italic text-muted-foreground">✨ {packingResult.conseil}</p>
          </div>
        )}

        {packingResult?.valise && Object.entries(packingResult.valise).map(([cat, items]: [string, any]) => {
          if (!items || !items.length) return null;
          return (
            <div key={cat} className="mb-4">
              <h2 className="font-serif font-semibold text-sm mb-2">{cat}</h2>
              <div className="grid grid-cols-3 gap-2">
                {items.map((item: any) => {
                  const piece = wardrobe.find((w) => w.id === item.id);
                  const hasImage = piece?.imageBase64;
                  return (
                    <div key={item.id} className="bg-card rounded-lg overflow-hidden">
                      {hasImage ? (
                        <img
                          src={piece.imageBase64}
                          alt={item.type}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          {item.type}
                        </div>
                      )}
                      <p className="text-[10px] px-1.5 py-1 truncate">
                        {item.type} · {item.color}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          {FREE_LIMIT - getUsageCount()} génération(s) gratuite(s) restante(s) ce mois
        </p>

        <button
          onClick={() => setStep('form')}
          className="w-full mt-4 py-3 rounded-xl text-sm font-semibold border"
          style={{ borderColor: '#C9956C', color: '#C9956C' }}
        >
          ← Modifier mon voyage
        </button>
      </div>
    );
  }

  return (
    <div className="fade-enter pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-2xl">←</button>
        <h1 className="text-2xl font-serif font-bold leading-tight">Nouveau voyage 🧳</h1>
      </div>

      {/* Destination */}
      <div className="mb-5">
        <label className="text-sm font-medium mb-1.5 block">Où partez-vous ?</label>
        <input
          type="text"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          placeholder="Rome, Barcelone..."
          className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#C9956C]/30"
        />
      </div>

      {/* Dates */}
      <div className="mb-5">
        <label className="text-sm font-medium mb-1.5 block">Dates</label>
        <div className="flex gap-3">
          <div className="flex-1">
            <span className="text-[11px] text-muted-foreground mb-1 block">Départ</span>
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#C9956C]/30"
            />
          </div>
          <div className="flex-1">
            <span className="text-[11px] text-muted-foreground mb-1 block">Retour</span>
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#C9956C]/30"
            />
          </div>
        </div>
        {dateError && (
          <p className="text-xs text-destructive mt-1.5">Maximum 7 jours</p>
        )}
      </div>

      {/* Bagage */}
      <div className="mb-5">
        <label className="text-sm font-medium mb-2 block">Type de bagage</label>
        <div className="grid grid-cols-3 gap-2.5">
          {BAG_TYPES.map(b => {
            const selected = bagType === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBagType(b.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 px-2 text-xs font-medium transition-all active:scale-[0.97] ${
                  selected
                    ? 'border-2 bg-background'
                    : 'border border-border bg-card hover:border-[#C9956C]/40'
                }`}
                style={selected ? { borderColor: '#C9956C' } : undefined}
              >
                <span className="text-xl">{b.emoji}</span>
                <span className="text-center leading-tight">{b.label}</span>
                <span className="text-[10px] text-muted-foreground">{BAG_SUBS[b.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Styles */}
      <div className="mb-5">
        <label className="text-sm font-medium mb-2 block">
          Tes styles <span className="text-muted-foreground font-normal">(2 max)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STYLES_LIST.map(s => {
            const selected = selectedStyles.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className={`rounded-xl py-2.5 px-2 text-xs font-medium text-center transition-all active:scale-[0.97] ${
                  selected
                    ? 'border-2 bg-background'
                    : 'border border-border bg-card hover:border-[#C9956C]/40'
                }`}
                style={selected ? { borderColor: '#C9956C' } : undefined}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Occasions */}
      <div className="mb-8">
        <label className="text-sm font-medium mb-2 block">
          Tes occasions <span className="text-muted-foreground font-normal">(3 max)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OCCASIONS_LIST.map(o => {
            const selected = selectedOccasions.includes(o);
            return (
              <button
                key={o}
                onClick={() => toggleOccasion(o)}
                className={`rounded-xl py-2.5 px-3 text-xs font-medium text-center transition-all active:scale-[0.97] ${
                  selected
                    ? 'border-2 bg-background'
                    : 'border border-border bg-card hover:border-[#C9956C]/40'
                }`}
                style={selected ? { borderColor: '#C9956C' } : undefined}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        style={{ backgroundColor: '#C9956C' }}
      >
        Générer ma valise ✨
      </button>
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        Version gratuite : {FREE_LIMIT - getUsageCount()} génération(s) ce mois
      </p>
    </div>
  );
}
