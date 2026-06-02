import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserProfile, SILHOUETTES, STYLE_OPTIONS, BRAND_SUGGESTIONS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getProfile, saveProfile, getAvatar, saveAvatar } from '@/lib/storage';
import AvatarCreator, { DEFAULT_AVATAR } from './AvatarCreator';
import { AvatarData } from './AvatarSVG';
import SilhouetteCarousel from './SilhouetteCarousel';

const FAVORITE_COLORS = [
  { name: 'Blanc', hex: '#FFFFFF' }, { name: 'Noir', hex: '#1A1A1A' },
  { name: 'Gris', hex: '#9E9E9E' }, { name: 'Beige', hex: '#E8D5B7' },
  { name: 'Camel', hex: '#C19A6B' }, { name: 'Bleu', hex: '#4A90D9' },
  { name: 'Marine', hex: '#1B2A4A' }, { name: 'Rouge', hex: '#D32F2F' },
  { name: 'Bordeaux', hex: '#722F37' }, { name: 'Rose', hex: '#F48FB1' },
  { name: 'Vert', hex: '#4CAF50' }, { name: 'Kaki', hex: '#6B7B3A' },
  { name: 'Jaune', hex: '#FFD54F' }, { name: 'Marron', hex: '#6D4C41' },
  { name: 'Violet', hex: '#7B1FA2' }, { name: 'Corail', hex: '#FF7F7F' },
  { name: 'Terracotta', hex: '#CC5C3B' }, { name: 'Lavande', hex: '#B39DDB' },
  { name: 'Turquoise', hex: '#26C6DA' }, { name: 'Rose gold', hex: '#C9956C' },
];

const MAKEUP_OPTIONS = [
  { label: 'No makeup', emoji: '💧' },
  { label: 'Naturel', emoji: '🌸' },
  { label: 'Coloré', emoji: '💄' },
  { label: "J'adore varier", emoji: '✨' },
];

const LIFESTYLES = [
  { label: 'Lycée', emoji: '🎒' },
  { label: 'Études sup', emoji: '📚' },
  { label: 'Premier job', emoji: '💼' },
  { label: 'Je travaille', emoji: '✨' },
  { label: 'Autre', emoji: '🌍' },
] as const;

const SILHOUETTE_TO_MORPHO: Record<string, 'A' | 'H' | 'X' | 'V' | 'O' | '8'> = {
  'Sablier': 'X', 'Rectangle': 'H', 'Triangle': 'A',
  'Triangle inversé': 'V', 'Ovale': 'O', 'Autre': '8',
};

type Section = 'pseudo' | 'silhouette' | 'taille' | 'colors' | 'styles' | 'budget' | 'brands' | 'makeup' | 'avatar' | null;

interface Props {
  onComplete: () => void;
}

export default function ProfileEditor({ onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Section>(null);

  const [pseudo, setPseudo] = useState('');
  const [silhouette, setSilhouette] = useState('');
  const [taille, setTaille] = useState<'petite' | 'moyenne' | 'grande' | ''>('');
  const [corpulence, setCorpulence] = useState<'fine' | 'medium' | 'ronde' | ''>('');
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState(80);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [makeup, setMakeup] = useState('');
  const [lifestyle, setLifestyle] = useState<string>('');
  const [avatar, setAvatar] = useState<AvatarData>(DEFAULT_AVATAR);

  useEffect(() => {
    (async () => {
      try {
        const [profile, av, { data: userData }] = await Promise.all([
          getProfile(),
          getAvatar(),
          supabase.auth.getUser(),
        ]);
        if (profile) {
          setSilhouette(profile.silhouette || '');
          setTaille(profile.taille || '');
          setCorpulence(profile.corpulence || '');
          setFavoriteColors(profile.favorite_colors || []);
          setStyles(profile.styles || []);
          setBudget(profile.budget || 80);
          setBrands(profile.brands || []);
          setLifestyle(profile.lifestyle || '');
        }
        if (userData.user) {
          const { data } = await supabase.from('profiles').select('pseudo, makeup').eq('id', userData.user.id).single();
          if (data) {
            setPseudo(data.pseudo || '');
            setMakeup(data.makeup || '');
          }
        }
        try {
          const raw = localStorage.getItem('alex_avatar');
          if (raw) setAvatar(JSON.parse(raw));
          else if (av) setAvatar(av as AvatarData);
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const profileObj = (): UserProfile => ({
    lifestyle: lifestyle as UserProfile['lifestyle'],
    silhouette,
    styles,
    budget,
    brands,
    taille: taille || null,
    corpulence: corpulence || null,
    morphologie: silhouette ? (SILHOUETTE_TO_MORPHO[silhouette] || null) : null,
    favorite_colors: favoriteColors,
  });

  const saveSection = async (label: string, extra?: () => Promise<void>) => {
    try {
      await saveProfile(profileObj());
      if (extra) await extra();
      toast.success(`✅ ${label} mis à jour !`);
      setOpen(null);
    } catch {
      toast.error('Erreur, réessaie');
    }
  };

  const savePseudo = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('profiles').update({ pseudo: pseudo.trim() || null }).eq('id', userData.user.id);
    }
    toast.success('✅ Pseudo mis à jour !');
    setOpen(null);
  };

  const saveMakeup = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('profiles').update({ makeup }).eq('id', userData.user.id);
    }
    toast.success('✅ Maquillage mis à jour !');
    setOpen(null);
  };

  const handleAvatarSave = async (data: AvatarData) => {
    localStorage.setItem('alex_avatar', JSON.stringify(data));
    await saveAvatar(data);
    setAvatar(data);
    toast.success('✅ Avatar mis à jour !');
    setOpen(null);
  };

  const toggleArr = (val: string, arr: string[], setter: (v: string[]) => void, max?: number) => {
    if (arr.includes(val)) setter(arr.filter(x => x !== val));
    else if (!max || arr.length < max) setter([...arr, val]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0EB' }}>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (open === 'avatar') {
    return (
      <div className="fade-enter pb-4 px-5 pt-6" style={{ backgroundColor: '#F5F0EB', minHeight: '100vh' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setOpen(null)} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">Mon avatar</h1>
        </div>
        <AvatarCreator initial={avatar} onSave={handleAvatarSave} />
      </div>
    );
  }

  const SectionCard = ({ id, icon, title, children, summary }: { id: Section; icon: string; title: string; children?: React.ReactNode; summary?: string }) => (
    <div className="rounded-2xl p-5 mb-3 bg-white" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-base" style={{ color: '#2C2C2C' }}>
            {icon} {title}
          </p>
          {summary && open !== id && (
            <p className="text-sm mt-1 truncate" style={{ color: '#9B9B9B' }}>{summary}</p>
          )}
        </div>
        {open !== id && (
          <button onClick={() => setOpen(id)} className="text-sm font-medium ml-3" style={{ color: '#C9956C' }}>
            Modifier
          </button>
        )}
      </div>
      {open === id && <div className="mt-4">{children}</div>}
    </div>
  );

  const SaveCancelRow = ({ onSave }: { onSave: () => void }) => (
    <div className="flex gap-2 mt-4">
      <button onClick={() => setOpen(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }}>
        Annuler
      </button>
      <button onClick={onSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#C9956C' }}>
        Enregistrer
      </button>
    </div>
  );

  return (
    <div className="fade-enter pb-8" style={{ backgroundColor: '#F5F0EB', minHeight: '100vh' }}>
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onComplete} className="text-2xl" aria-label="Retour">←</button>
          <h1 className="text-xl font-serif font-bold" style={{ color: '#2C2C2C' }}>Modifier mon profil</h1>
        </div>

        {/* Pseudo */}
        <SectionCard id="pseudo" icon="👤" title="Pseudo" summary={pseudo || 'Non défini'}>
          <input
            type="text" value={pseudo} maxLength={20}
            onChange={e => setPseudo(e.target.value.slice(0, 20))}
            placeholder="Ton pseudo..."
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/30"
            style={{ borderColor: '#E0D5C8' }}
          />
          <p className="text-xs text-right mt-1" style={{ color: '#9B9B9B' }}>{pseudo.length}/20</p>
          <SaveCancelRow onSave={savePseudo} />
        </SectionCard>

        {/* Silhouette */}
        <SectionCard id="silhouette" icon="👗" title="Morphologie" summary={silhouette || 'Non définie'}>
          <SilhouetteCarousel value={silhouette} onChange={setSilhouette} />
          <SaveCancelRow onSave={() => saveSection('Morphologie')} />
        </SectionCard>

        {/* Taille & Corpulence */}
        <SectionCard id="taille" icon="📏" title="Taille & Corpulence"
          summary={`${taille || '?'} · ${corpulence || '?'}`}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#6B6B6B' }}>Ta taille</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['petite', 'moyenne', 'grande'] as const).map(t => (
              <button key={t} onClick={() => setTaille(t)}
                className="p-2 rounded-xl text-xs font-medium capitalize"
                style={taille === t
                  ? { border: '2px solid #C9956C', backgroundColor: '#FAF5F0' }
                  : { border: '2px solid #E0D5C8', backgroundColor: '#FFFFFF' }}>
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#6B6B6B' }}>Ta corpulence</p>
          <div className="grid grid-cols-3 gap-2">
            {(['fine', 'medium', 'ronde'] as const).map(c => (
              <button key={c} onClick={() => setCorpulence(c)}
                className="p-2 rounded-xl text-xs font-medium capitalize"
                style={corpulence === c
                  ? { border: '2px solid #C9956C', backgroundColor: '#FAF5F0' }
                  : { border: '2px solid #E0D5C8', backgroundColor: '#FFFFFF' }}>
                {c}
              </button>
            ))}
          </div>
          <SaveCancelRow onSave={() => saveSection('Taille & corpulence')} />
        </SectionCard>

        {/* Couleurs */}
        <SectionCard id="colors" icon="🎨" title="Couleurs préférées"
          summary={favoriteColors.length ? `${favoriteColors.length} couleur(s)` : 'Non défini'}>
          <p className="text-xs mb-3" style={{ color: '#9B9B9B' }}>{favoriteColors.length}/5 sélectionnées</p>
          <div className="grid grid-cols-5 gap-3">
            {FAVORITE_COLORS.map(c => {
              const sel = favoriteColors.includes(c.name);
              const dis = !sel && favoriteColors.length >= 5;
              return (
                <button key={c.name} disabled={dis}
                  onClick={() => toggleArr(c.name, favoriteColors, setFavoriteColors, 5)}
                  className="flex flex-col items-center gap-1" style={{ opacity: dis ? 0.35 : 1 }}>
                  <div className="w-9 h-9 rounded-full transition-all" style={{
                    backgroundColor: c.hex,
                    border: sel ? '3px solid #C9956C' : c.name === 'Blanc' ? '2px solid #E0D5C8' : '2px solid transparent',
                    transform: sel ? 'scale(1.1)' : 'scale(1)',
                  }} />
                  <span className="text-[10px] leading-tight text-center" style={{ color: '#6B6B6B' }}>{c.name}</span>
                </button>
              );
            })}
          </div>
          <SaveCancelRow onSave={() => saveSection('Couleurs')} />
        </SectionCard>

        {/* Styles */}
        <SectionCard id="styles" icon="✨" title="Style dominant"
          summary={styles.length ? styles.join(', ') : 'Non défini'}>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(s => (
              <button key={s.label} onClick={() => toggleArr(s.label, styles, setStyles)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={styles.includes(s.label)
                  ? { backgroundColor: '#C9956C', color: '#FFFFFF', border: '1.5px solid #C9956C' }
                  : { backgroundColor: '#FFFFFF', color: '#2C2C2C', border: '1.5px solid #E0D5C8' }}>
                {s.label}
              </button>
            ))}
          </div>
          <SaveCancelRow onSave={() => saveSection('Style')} />
        </SectionCard>

        {/* Lifestyle */}
        <SectionCard id="lifestyle" icon="🌍" title="Mon quotidien"
          summary={lifestyle || 'Non défini'}>
          <div>
            <label className="text-sm font-medium">Mon quotidien</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {LIFESTYLES.map(l => (
                <button
                  key={l.label}
                  type="button"
                  onClick={() => setLifestyle(l.label)}
                  className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    lifestyle === l.label
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:shadow-md'
                  }`}
                >
                  <span>{l.emoji}</span>
                  <span className="text-sm font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
          <SaveCancelRow onSave={() => saveSection('Mon quotidien')} />
        </SectionCard>

        {/* Budget */}
        <SectionCard id="budget" icon="💰" title="Budget" summary={`${budget}€ par vêtement`}>
          <div className="text-center mb-4">
            <span className="text-3xl font-serif font-bold" style={{ color: '#C9956C' }}>{budget}€</span>
          </div>
          <input type="range" min={10} max={300} step={5} value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full" style={{ accentColor: '#C9956C' }} />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#9B9B9B' }}>
            <span>10€</span><span>300€</span>
          </div>
          <SaveCancelRow onSave={() => saveSection('Budget')} />
        </SectionCard>

        {/* Marques */}
        <SectionCard id="brands" icon="🏷️" title="Marques préférées"
          summary={brands.length ? brands.join(', ') : 'Non défini'}>
          {brands.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {brands.map(b => (
                <span key={b} onClick={() => setBrands(brands.filter(x => x !== b))}
                  className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer text-white"
                  style={{ backgroundColor: '#C9956C' }}>
                  {b} ✕
                </span>
              ))}
            </div>
          )}
          <input type="text" value={brandInput} onChange={e => setBrandInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && brandInput.trim() && brands.length < 3 && !brands.includes(brandInput.trim())) {
                setBrands([...brands, brandInput.trim()]);
                setBrandInput('');
              }
            }}
            placeholder="Ajoute une marque..." disabled={brands.length >= 3}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-3"
            style={{ borderColor: '#E0D5C8' }} />
          <div className="flex flex-wrap gap-2">
            {BRAND_SUGGESTIONS.filter(b => !brands.includes(b)).map(b => (
              <button key={b} onClick={() => brands.length < 3 && setBrands([...brands, b])}
                disabled={brands.length >= 3}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', border: '1.5px solid #E0D5C8', opacity: brands.length >= 3 ? 0.4 : 1 }}>
                + {b}
              </button>
            ))}
          </div>
          <SaveCancelRow onSave={() => saveSection('Marques')} />
        </SectionCard>

        {/* Maquillage */}
        <SectionCard id="makeup" icon="💄" title="Maquillage" summary={makeup || 'Non défini'}>
          <div className="flex flex-wrap gap-2">
            {MAKEUP_OPTIONS.map(m => (
              <button key={m.label} onClick={() => setMakeup(m.label)}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={makeup === m.label
                  ? { backgroundColor: '#C9956C', color: '#FFFFFF', border: '1.5px solid #C9956C' }
                  : { backgroundColor: '#FFFFFF', color: '#2C2C2C', border: '1.5px solid #E0D5C8' }}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <SaveCancelRow onSave={saveMakeup} />
        </SectionCard>

        {/* Avatar */}
        <SectionCard id="avatar" icon="🧍" title="Avatar" summary="Personnalise ton avatar" />
      </div>
    </div>
  );
}
