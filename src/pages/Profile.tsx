import { useState, useEffect } from 'react';
import { getProfile, getAvatar, saveAvatar, saveProfile } from '@/lib/storage';
import AvatarSVG from '@/components/AvatarSVG';
import AvatarCreator, { DEFAULT_AVATAR } from '@/components/AvatarCreator';
import { AvatarData } from '@/components/AvatarSVG';
import { determineSeason, SEASON_PALETTES, SEASON_COLOR_HEX, SEASON_LABELS } from '@/lib/colorimetry';
import type { Season } from '@/lib/colorimetry';
import { getStreak } from '@/lib/streak';
import { UserProfile, STYLE_OPTIONS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const FAVORITE_COLORS_MAP: Record<string, string> = {
  'Blanc': '#FFFFFF', 'Noir': '#1A1A1A', 'Gris': '#9E9E9E', 'Beige': '#E8D5B7',
  'Camel': '#C19A6B', 'Bleu': '#4A90D9', 'Marine': '#1B2A4A', 'Rouge': '#D32F2F',
  'Bordeaux': '#722F37', 'Rose': '#F48FB1', 'Vert': '#4CAF50', 'Kaki': '#6B7B3A',
  'Jaune': '#FFD54F', 'Marron': '#6D4C41', 'Violet': '#7B1FA2', 'Corail': '#FF7F7F',
  'Terracotta': '#CC5C3B', 'Lavande': '#B39DDB', 'Turquoise': '#26C6DA', 'Rose gold': '#C9956C',
};
const ALL_COLOR_NAMES = Object.keys(FAVORITE_COLORS_MAP);

interface Props {
  onEditProfile: () => void;
  onLogout: () => void;
}

export default function Profile({ onEditProfile, onLogout }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<AvatarData>(DEFAULT_AVATAR);
  const [season, setSeason] = useState<Season | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [tempColors, setTempColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pseudo, setPseudo] = useState('');
  const [editingPseudo, setEditingPseudo] = useState(false);
  const [tempPseudo, setTempPseudo] = useState('');

  const computeAndSaveSeason = async (avatarData: AvatarData) => {
    const s = determineSeason(avatarData.skin, avatarData.eyeColor, avatarData.hairColor);
    setSeason(s);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('profiles').update({ colorimetry_season: s }).eq('id', data.user.id);
      }
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      const [a] = await Promise.all([getAvatar()]);
      // Load profile directly from Supabase for fresh data
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        if (profileData) {
          setPseudo(profileData.pseudo || '');
          setProfile({
            silhouette: profileData.silhouette || '',
            styles: (profileData.styles as string[]) || [],
            budget: profileData.budget || 80,
            brands: (profileData.brands as string[]) || [],
            taille: profileData.taille || null,
            corpulence: profileData.corpulence || null,
            morphologie: profileData.morphologie || null,
            favorite_colors: (profileData.favorite_colors as string[]) || [],
          });
        }
      }
      let avatarData: AvatarData = DEFAULT_AVATAR;
      try {
        const raw = localStorage.getItem('alex_avatar');
        if (raw) avatarData = JSON.parse(raw);
        else if (a) avatarData = a as AvatarData;
      } catch {}
      setAvatar(avatarData);
      await computeAndSaveSeason(avatarData);
      setLoading(false);
    };
    load();
  }, []);

  const handleAvatarSave = async (data: AvatarData) => {
    localStorage.setItem('alex_avatar', JSON.stringify(data));
    await saveAvatar(data);
    setAvatar(data);
    await computeAndSaveSeason(data);
    setEditingAvatar(false);
  };

  if (loading) {
    return (
      <div className="fade-enter pb-4">
        <div className="h-8 w-40 rounded bg-muted animate-pulse mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
            <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (editingAvatar) {
    return (
      <div className="fade-enter pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setEditingAvatar(false)} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">Modifier mon avatar</h1>
        </div>
        <AvatarCreator initial={avatar} onSave={handleAvatarSave} />
      </div>
    );
  }

  if (!profile) return null;

  const palette = season ? SEASON_PALETTES[season] : null;
  const seasonInfo = season ? SEASON_LABELS[season] : null;

  const SEASON_VIBES: Record<string, string> = {
    printemps: 'Les teintes chaudes et lumineuses te subliment ✨',
    ete: "Les teintes douces et fraîches t'illuminent ✨",
    automne: 'Les teintes profondes et chaleureuses te mettent en valeur ✨',
    hiver: 'Les teintes intenses et contrastées te subliment ✨',
  };

  const MORPHO_LABELS: Record<string, string> = {
    A: 'Morphologie A (Triangle)',
    H: 'Morphologie H (Rectangle)',
    X: 'Morphologie X (Sablier)',
    V: 'Morphologie V (Triangle inversé)',
    O: 'Morphologie O (Ronde)',
    '8': 'Morphologie 8 (Sablier pulpeux)',
  };

  return (
    <div className="fade-enter pb-6" style={{ backgroundColor: '#F5F0EB', minHeight: '100vh' }}>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-serif font-bold mb-6" style={{ color: '#2C2C2C' }}>Mon Profil</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <AvatarSVG avatar={avatar} size={80} />
          <div>
            <p className="font-serif font-semibold text-lg" style={{ color: '#2C2C2C' }}>Mon Avatar</p>
            <button
              onClick={() => setEditingAvatar(true)}
              className="text-sm font-medium mt-1"
              style={{ color: '#C9956C' }}
            >
              Modifier mon avatar
            </button>
          </div>
        </div>

        {/* Pseudo */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <p className="font-serif font-semibold text-base" style={{ color: '#2C2C2C' }}>
              Mon pseudo
            </p>
            {!editingPseudo && (
              <button
                onClick={() => { setTempPseudo(pseudo); setEditingPseudo(true); }}
                className="text-sm"
                style={{ color: '#C9956C' }}
              >
                ✏️
              </button>
            )}
          </div>
          {editingPseudo ? (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={tempPseudo}
                onChange={e => setTempPseudo(e.target.value.slice(0, 20))}
                maxLength={20}
                placeholder="Ton pseudo..."
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/30"
                style={{ borderColor: '#E0D5C8' }}
              />
              <p className="text-xs text-right" style={{ color: '#9B9B9B' }}>{tempPseudo.length}/20</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPseudo(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }}
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    const { data: userData } = await supabase.auth.getUser();
                    if (userData.user) {
                      await supabase.from('profiles').update({ pseudo: tempPseudo.trim() || null }).eq('id', userData.user.id);
                      setPseudo(tempPseudo.trim());
                      toast.success('Pseudo sauvegardé ✨', { duration: 2000 });
                    }
                    setEditingPseudo(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#C9956C' }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1" style={{ color: pseudo ? '#2C2C2C' : '#9B9B9B' }}>
              {pseudo || 'Non défini'}
            </p>
          )}
        </div>

        {/* 1. SAISON COLORIMÉTRIQUE */}
        {palette && seasonInfo && season && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="font-serif font-bold text-xl mb-1" style={{ color: '#2C2C2C' }}>
              {seasonInfo.emoji} Palette {seasonInfo.label}
            </p>
            <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
              {SEASON_VIBES[season] || seasonInfo.vibe}
            </p>
            <div className="flex gap-2.5 mb-3 flex-wrap">
              {palette.recommended.slice(0, 8).map(c => (
                <div
                  key={c}
                  className="w-5 h-5 rounded-full"
                  style={{
                    backgroundColor: SEASON_COLOR_HEX[c] || '#ccc',
                    border: c === 'blanc' || c === 'creme' ? '1.5px solid #E0D5C8' : 'none',
                  }}
                  title={c}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: '#9B9B9B' }}>
              Bijoux recommandés : {palette.metal}
            </p>
          </div>
        )}

        {/* 2. MES COULEURS PRÉFÉRÉES */}
        {editingColors ? (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-serif font-semibold text-base" style={{ color: '#2C2C2C' }}>
                Mes couleurs préférées 🎨
              </p>
              <span className="text-xs" style={{ color: '#9B9B9B' }}>{tempColors.length}/5</span>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {ALL_COLOR_NAMES.map(name => {
                const selected = tempColors.includes(name);
                const disabled = !selected && tempColors.length >= 5;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setTempColors(prev =>
                        prev.includes(name) ? prev.filter(c => c !== name) :
                        prev.length >= 5 ? prev : [...prev, name]
                      );
                    }}
                    disabled={disabled}
                    className="flex flex-col items-center gap-1 transition-all"
                    style={{ opacity: disabled ? 0.35 : 1 }}
                  >
                    <div
                      className="w-9 h-9 rounded-full transition-all"
                      style={{
                        backgroundColor: FAVORITE_COLORS_MAP[name],
                        border: selected ? '3px solid #C9956C' : name === 'Blanc' ? '2px solid #E0D5C8' : '2px solid transparent',
                        boxShadow: selected ? '0 0 0 2px #C9956C40' : 'none',
                        transform: selected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                    <span className="text-[10px] leading-tight text-center" style={{ color: '#6B6B6B' }}>{name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingColors(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }}
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const { data: userData } = await supabase.auth.getUser();
                  if (userData.user) {
                    await supabase
                      .from('profiles')
                      .update({ favorite_colors: tempColors })
                      .eq('id', userData.user.id);
                    setProfile(prev => prev ? { ...prev, favorite_colors: tempColors } : prev);
                    toast.success('Couleurs sauvegardées ✨', { duration: 2000 });
                  }
                  setEditingColors(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#C9956C' }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-serif font-semibold text-base" style={{ color: '#2C2C2C' }}>
                Mes couleurs préférées 🎨
              </p>
              <button
                onClick={() => {
                  setTempColors(profile?.favorite_colors || []);
                  setEditingColors(true);
                }}
                className="text-sm font-medium"
                style={{ color: '#C9956C' }}
              >
                {profile?.favorite_colors?.length ? 'Modifier' : '＋'}
              </button>
            </div>
            {profile?.favorite_colors?.length ? (
              <div className="flex gap-3 flex-wrap">
                {profile.favorite_colors.map(name => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{
                        backgroundColor: FAVORITE_COLORS_MAP[name] || '#ccc',
                        border: name === 'Blanc' ? '1.5px solid #E0D5C8' : 'none',
                      }}
                    />
                    <span className="text-[10px]" style={{ color: '#6B6B6B' }}>{name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#9B9B9B' }}>Ajoute tes couleurs préférées ✨</p>
            )}
          </div>
        )}

        {/* 3. MON PROFIL DE STYLE */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <p className="font-serif font-semibold text-base mb-4" style={{ color: '#2C2C2C' }}>
            Mon profil de style 👗
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.morphologie && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5F0EB', color: '#C9956C' }}>
                {MORPHO_LABELS[profile.morphologie] || `Morpho ${profile.morphologie}`}
              </span>
            )}
            {profile.taille && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5F0EB', color: '#2C2C2C' }}>
                Taille {profile.taille}
              </span>
            )}
            {profile.corpulence && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5F0EB', color: '#2C2C2C' }}>
                Corpulence {profile.corpulence}
              </span>
            )}
            {profile.silhouette && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5F0EB', color: '#2C2C2C' }}>
                {profile.silhouette}
              </span>
            )}
            {profile.styles.map(s => {
              const styleObj = STYLE_OPTIONS.find(so => so.label === s);
              return (
                <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#C9956C20', color: '#C9956C' }}>
                  {styleObj ? `${styleObj.emoji} ` : ''}{s}
                </span>
              );
            })}
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5F0EB', color: '#2C2C2C' }}>
              Budget {profile.budget}€
            </span>
            {profile.brands.map(b => (
              <span key={b} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }}>
                {b}
              </span>
            ))}
          </div>

          <button onClick={onEditProfile}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white active:scale-[0.98] transition-transform"
            style={{ backgroundColor: '#C9956C' }}>
            Modifier mon profil
          </button>
        </div>

        {/* Streak */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <p className="text-sm mb-1" style={{ color: '#9B9B9B' }}>Meilleur streak</p>
          <p className="text-2xl font-serif font-bold" style={{ color: '#C9956C' }}>
            {getStreak().bestStreak} jours 🔥
          </p>
        </div>

        <button onClick={onLogout} className="w-full py-3 mt-2 mb-4 text-sm font-medium" style={{ color: '#D32F2F' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
