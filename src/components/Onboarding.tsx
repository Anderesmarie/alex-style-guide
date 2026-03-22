import { useState, useRef } from 'react';
import { compressImage } from '@/lib/imageUtils';
import { UserProfile, SILHOUETTES, STYLE_OPTIONS, BRAND_SUGGESTIONS } from '@/lib/types';
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

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [silhouette, setSilhouette] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState(80);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [stylePhotos, setStylePhotos] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState('');
  const [makeup, setMakeup] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 7;

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
    // Save to localStorage as alex_avatar
    localStorage.setItem('alex_avatar', JSON.stringify(avatar));
    // Also save to Supabase
    await saveAvatar(avatar);
    const palette = getPaletteForSkin(avatar.skin);
    savePalette(palette);
    await saveProfile({ silhouette, styles, budget, brands, taille: null, corpulence: null });
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      onComplete();
    }, 1200);
  };

  const toggleStyle = (s: string) => {
    setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addBrand = (b: string) => {
    if (brands.length < 3 && !brands.includes(b)) setBrands([...brands, b]);
  };
  const removeBrand = (b: string) => setBrands(brands.filter(x => x !== b));

  const canProceed = [
    silhouette !== '',
    styles.length > 0,
    lifestyle !== '',
    true,
    true,
    makeup !== '',
    false,
  ][step];

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8 fade-enter">
      <div className="progress-bar mb-8">
        <div className="progress-bar-fill" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      {showMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <p className="text-xl font-serif text-primary animate-pulse">{MOTIVATIONAL[step]}</p>
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
            <h1 className="text-2xl font-serif font-bold mb-6">Ton style, c'est plutôt ?</h1>
            <div className="flex flex-wrap gap-3">
              {STYLE_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleStyle(s)}
                  className={`chip ${styles.includes(s) ? 'chip-active' : ''}`}>{s}</button>
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

        {step === 2 && (
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

        {step === 3 && (
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

        {step === 4 && (
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

        {step === 5 && (
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

        {step === 6 && (
          <AvatarCreator onSave={handleAvatarSave} />
        )}
      </div>

      {step < 6 && (
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
