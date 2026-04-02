import { useState, useRef } from 'react';
import { compressImage } from '@/lib/imageUtils';
import { UserProfile, SILHOUETTES, STYLE_OPTIONS, BRAND_SUGGESTIONS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { saveProfile, saveAvatar, savePalette } from '@/lib/storage';
import { AvatarData } from './AvatarSVG';
import AvatarCreator from './AvatarCreator';
import { getPaletteForSkin } from '@/lib/colorimetry';

const MOTIVATIONAL = [
  'Super choix, on s\'en souvient ! ✨',
  'Ton style commence à se dessiner 💫',
  'On te connaît de mieux en mieux 🙌',
  'On y est presque ! 🎯',
  'Nickel, on note 📝',
  'Beauty game activé 💅',
  'Parfait, on est prêts ! 🚀',
  'Tes couleurs, c\'est noté ! 🎨',
  'Top, on finalise ! ✨',
];

const LIFESTYLES = [
  { label: 'Lycée', emoji: '🎒' },
  { label: 'Études sup', emoji: '📚' },
  { label: 'Premier job', emoji: '💼' },
  { label: 'Je travaille', emoji: '✨' },
  { label: 'Autre', emoji: '🌍' },
] as const;

const MAKEUP_OPTIONS = [
  { label: 'No makeup', emoji: '💧' },
  { label: 'Naturel', emoji: '🌸' },
  { label: 'Coloré', emoji: '💄' },
  { label: 'J\'adore varier', emoji: '✨' },
] as const;

const FAVORITE_COLORS = [
  { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Noir', hex: '#1A1A1A' },
  { name: 'Gris', hex: '#9E9E9E' },
  { name: 'Beige', hex: '#E8D5B7' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Bleu', hex: '#4A90D9' },
  { name: 'Marine', hex: '#1B2A4A' },
  { name: 'Rouge', hex: '#D32F2F' },
  { name: 'Bordeaux', hex: '#722F37' },
  { name: 'Rose', hex: '#F48FB1' },
  { name: 'Vert', hex: '#4CAF50' },
  { name: 'Kaki', hex: '#6B7B3A' },
  { name: 'Jaune', hex: '#FFD54F' },
  { name: 'Marron', hex: '#6D4C41' },
  { name: 'Violet', hex: '#7B1FA2' },
  { name: 'Corail', hex: '#FF7F7F' },
  { name: 'Terracotta', hex: '#CC5C3B' },
  { name: 'Lavande', hex: '#B39DDB' },
  { name: 'Turquoise', hex: '#26C6DA' },
  { name: 'Rose gold', hex: '#C9956C' },
] as const;

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [silhouette, setSilhouette] = useState('');
  const [taille, setTaille] = useState<'petite' | 'moyenne' | 'grande' | ''>('');
  const [corpulence, setCorpulence] = useState<'fine' | 'medium' | 'ronde' | ''>('');
  const [styles, setStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState(80);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [stylePhotos, setStylePhotos] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState('');
  const [makeup, setMakeup] = useState('');
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 10;

  const nextStep = () => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      if (step < totalSteps - 1) {
        setStep(step + 1);
      }
    }, 1200);
  };

  const handleAvatarSave = async (avatar: AvatarData) => {
    localStorage.setItem('alex_avatar', JSON.stringify(avatar));
    await saveAvatar(avatar);
    const palette = getPaletteForSkin(avatar.skin);
    savePalette(palette);
    await saveProfile({ silhouette, styles, budget, brands, taille: taille || null, corpulence: corpulence || null, morphologie: null, favorite_colors: favoriteColors });
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      onComplete();
    }, 1200);
  };

  const toggleStyle = (s: string) => {
    setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleFavoriteColor = (color: string) => {
    setFavoriteColors(prev => {
      if (prev.includes(color)) return prev.filter(c => c !== color);
      if (prev.length >= 5) return prev;
      return [...prev, color];
    });
  };

  const addBrand = (b: string) => {
    if (brands.length < 3 && !brands.includes(b)) setBrands([...brands, b]);
  };
  const removeBrand = (b: string) => setBrands(brands.filter(x => x !== b));

  const canProceed = [
    silhouette !== '',       // 0
    taille !== '' && corpulence !== '', // 1
    true,                    // 2 — favorite colors (optional)
    styles.length > 0,       // 3
    lifestyle !== '',        // 4
    true,                    // 5 — budget
    true,                    // 6 — brands
    makeup !== '',           // 7
    false,                   // 8 — avatar
  ][step];

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8 fade-enter">
      <div className="progress-bar mb-8">
        <div className="progress-bar-fill" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      {showMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <p className="text-xl font-serif text-primary animate-pulse">{MOTIVATIONAL[step] || MOTIVATIONAL[0]}</p>
        </div>
      )}

      <div className="flex-1 fade-enter no-scrollbar overflow-y-auto" key={step}>
        {step === 0 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-6">C'est quoi ta silhouette ?</h1>
            <div className="grid grid-cols-2 gap-3">
              {SILHOUETTES.map(s => (
                <button key={s.label} onClick={() => setSilhouette(s.label)}
                  className={`p-4 rounded-lg text-center transition-all duration-200 card-shadow ${
                    silhouette === s.label ? 'bg-primary text-primary-foreground scale-[1.02]' : 'bg-card text-card-foreground hover:shadow-md'
                  }`}>
                  <span className="text-3xl block mb-2">{s.emoji}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-2">Et ta silhouette en détail ?</h1>
            <p className="text-sm text-muted-foreground mb-6">Pour des suggestions encore plus adaptées ✨</p>

            <h2 className="text-base font-semibold mb-3">Ta taille</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {([
                { value: 'petite' as const, label: 'Petite', sub: 'Moins de 160 cm', emoji: '🧍‍♀️' },
                { value: 'moyenne' as const, label: 'Moyenne', sub: '160 à 170 cm', emoji: '🧍‍♀️' },
                { value: 'grande' as const, label: 'Grande', sub: 'Plus de 170 cm', emoji: '🧍‍♀️' },
              ]).map(t => (
                <button
                  key={t.value}
                  onClick={() => setTaille(t.value)}
                  className="p-3 rounded-xl text-center transition-all duration-200 card-shadow"
                  style={taille === t.value
                    ? { border: '2px solid #C9956C', backgroundColor: '#FAF5F0' }
                    : { border: '2px solid transparent', backgroundColor: 'hsl(var(--card))' }
                  }
                >
                  <span className="text-2xl block mb-1">{t.emoji}</span>
                  <span className="text-sm font-medium block">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{t.sub}</span>
                </button>
              ))}
            </div>

            <h2 className="text-base font-semibold mb-3">Ta corpulence</h2>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'fine' as const, label: 'Fine', sub: 'Je me trouve plutôt élancée', emoji: '✨' },
                { value: 'medium' as const, label: 'Medium', sub: 'Je me sens entre les deux', emoji: '💫' },
                { value: 'ronde' as const, label: 'Ronde', sub: "J'ai des courbes généreuses que j'assume", emoji: '🌸' },
              ]).map(c => (
                <button
                  key={c.value}
                  onClick={() => setCorpulence(c.value)}
                  className="p-3 rounded-xl text-center transition-all duration-200 card-shadow"
                  style={corpulence === c.value
                    ? { border: '2px solid #C9956C', backgroundColor: '#FAF5F0' }
                    : { border: '2px solid transparent', backgroundColor: 'hsl(var(--card))' }
                  }
                >
                  <span className="text-2xl block mb-1">{c.emoji}</span>
                  <span className="text-sm font-medium block">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5 leading-tight">{c.sub}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-2">Tes couleurs préférées ?</h1>
            <p className="text-sm text-muted-foreground mb-6">On privilégiera ces teintes dans tes suggestions ✨</p>

            <div className="grid grid-cols-4 gap-4 mb-4">
              {FAVORITE_COLORS.map(c => {
                const selected = favoriteColors.includes(c.name);
                const disabled = !selected && favoriteColors.length >= 5;
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleFavoriteColor(c.name)}
                    disabled={disabled}
                    className="flex flex-col items-center gap-1.5 transition-all duration-200"
                    style={{ opacity: disabled ? 0.35 : 1 }}
                  >
                    <div
                      className="w-11 h-11 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: c.hex,
                        border: selected ? '3px solid #C9956C' : c.name === 'Blanc' ? '2px solid hsl(var(--border))' : '2px solid transparent',
                        boxShadow: selected ? '0 0 0 2px #C9956C40' : 'none',
                        transform: selected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                    <span className="text-[11px] text-muted-foreground font-medium leading-tight text-center">{c.name}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {favoriteColors.length}/5 couleurs choisies
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-6">Ton style, c'est plutôt ?</h1>
            <div className="flex flex-wrap gap-2.5">
              {STYLE_OPTIONS.map(s => (
                <button key={s.label} onClick={() => toggleStyle(s.label)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  style={styles.includes(s.label)
                    ? { backgroundColor: '#C9956C', color: '#FFFFFF', border: '1.5px solid #C9956C' }
                    : { backgroundColor: '#FFFFFF', color: '#2C2C2C', border: '1.5px solid #E0D5C8' }
                  }>
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-lg font-serif font-semibold mb-1">Montre-moi des looks qui t'inspirent ✨</h2>
              <p className="text-sm text-muted-foreground mb-4">Ajoute 2 à 5 photos depuis ta galerie</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const remaining = 5 - stylePhotos.length;
                  const toProcess = files.slice(0, remaining);
                  const compressed = await Promise.all(toProcess.map(f => compressImage(f, 400)));
                  const updated = [...stylePhotos, ...compressed].slice(0, 5);
                  setStylePhotos(updated);
                  localStorage.setItem('mystyl_style_photos', JSON.stringify(updated));
                  e.target.value = '';
                }} />
              {stylePhotos.length < 5 && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-primary/40 flex items-center justify-center text-primary/60 hover:border-primary hover:text-primary transition-colors mb-4">
                  <span className="text-3xl">+</span>
                </button>
              )}
              {stylePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {stylePhotos.map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={photo} alt={`Inspo ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => {
                        const updated = stylePhotos.filter((_, idx) => idx !== i);
                        setStylePhotos(updated);
                        localStorage.setItem('mystyl_style_photos', JSON.stringify(updated));
                      }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 text-background text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-6">T'es plutôt dans quelle vibe ?</h1>
            <div className="grid grid-cols-1 gap-3">
              {LIFESTYLES.map(l => (
                <button key={l.label} onClick={() => setLifestyle(l.label)}
                  className={`p-5 rounded-xl text-left transition-all duration-200 card-shadow flex items-center gap-4 ${
                    lifestyle === l.label ? 'bg-primary text-primary-foreground scale-[1.01]' : 'bg-card text-card-foreground hover:shadow-md'
                  }`}>
                  <span className="text-3xl">{l.emoji}</span>
                  <span className="text-base font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-6">Ton budget habituel par vêtement ?</h1>
            <div className="mt-8">
              <div className="text-center mb-6">
                <span className="text-4xl font-serif font-bold text-primary">{budget}€</span>
              </div>
              <input type="range" min={10} max={300} step={5} value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-secondary accent-primary cursor-pointer"
                style={{ accentColor: 'hsl(27, 46%, 60%)' }} />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>10€</span><span>300€</span>
              </div>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-6">Tes marques préférées ?</h1>
            {brands.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {brands.map(b => (
                  <span key={b} onClick={() => removeBrand(b)} className="chip chip-active cursor-pointer">{b} ✕</span>
                ))}
              </div>
            )}
            <input type="text" value={brandInput} onChange={e => setBrandInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && brandInput.trim()) { addBrand(brandInput.trim()); setBrandInput(''); } }}
              placeholder="Tape une marque..."
              className="w-full px-4 py-3 rounded-lg bg-card card-shadow border-0 outline-none focus:ring-2 focus:ring-primary/30 mb-4" />
            <div className="flex flex-wrap gap-2">
              {BRAND_SUGGESTIONS.filter(b => !brands.includes(b)).map(b => (
                <button key={b} onClick={() => addBrand(b)} className="chip" disabled={brands.length >= 3}>{b}</button>
              ))}
            </div>
            {brands.length >= 3 && (
              <p className="text-sm text-muted-foreground mt-3">Maximum 3 marques sélectionnées</p>
            )}
          </>
        )}

        {step === 7 && (
          <>
            <h1 className="text-2xl font-serif font-bold mb-6">Ton rapport au maquillage ?</h1>
            <div className="flex flex-wrap gap-3">
              {MAKEUP_OPTIONS.map(m => (
                <button key={m.label} onClick={() => setMakeup(m.label)}
                  className={`chip text-base py-3 px-5 ${makeup === m.label ? 'chip-active' : ''}`}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 8 && (
          <AvatarCreator onSave={handleAvatarSave} />
        )}
      </div>

      {step < 8 && (
        <button onClick={nextStep} disabled={!canProceed}
          className={`w-full py-4 rounded-xl text-lg font-semibold transition-all duration-200 mt-6 ${
            canProceed ? 'bg-primary text-primary-foreground shadow-lg active:scale-[0.98]' : 'bg-muted text-muted-foreground'
          }`}>
          Continuer
        </button>
      )}
    </div>
  );
}
