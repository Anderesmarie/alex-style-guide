import { useState, useEffect } from 'react';
import { getProfile, getAvatar, saveAvatar, saveProfile } from '@/lib/storage';
import AvatarSVG from '@/components/AvatarSVG';
import AvatarCreator, { DEFAULT_AVATAR } from '@/components/AvatarCreator';
import { AvatarData } from '@/components/AvatarSVG';
import { determineSeason, SEASON_PALETTES, SEASON_COLOR_HEX, SEASON_LABELS } from '@/lib/colorimetry';
import type { Season } from '@/lib/colorimetry';
import { getStreak } from '@/lib/streak';
import { UserProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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
      const [p, a] = await Promise.all([getProfile(), getAvatar()]);
      setProfile(p);
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

  return (
    <div className="fade-enter pb-4">
      <h1 className="text-2xl font-serif font-bold mb-6">Mon Profil</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <AvatarSVG avatar={avatar} size={80} />
        <div>
          <p className="font-serif font-semibold text-lg">Mon Avatar</p>
          <button
            onClick={() => setEditingAvatar(true)}
            className="text-sm text-primary font-medium mt-1"
          >
            Modifier mon avatar
          </button>
        </div>
      </div>

      {/* Season palette */}
      {palette && seasonInfo && (
        <div className="bg-card rounded-xl p-5 card-shadow mb-4">
          <p className="font-serif font-semibold text-base mb-1">
            {seasonInfo.emoji} Ta palette {seasonInfo.label}
          </p>
          <p className="text-sm text-muted-foreground mb-3">{seasonInfo.vibe}</p>
          <div className="flex gap-2 mb-3">
            {palette.recommended.slice(0, 6).map(c => (
              <div
                key={c}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: SEASON_COLOR_HEX[c] || '#ccc' }}
                title={c}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Bijoux recommandés : {palette.metal}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-card rounded-xl p-5 card-shadow">
          <p className="text-sm text-muted-foreground mb-1">Silhouette</p>
          <p className="font-serif font-semibold text-lg">{profile.silhouette}</p>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow">
          <p className="text-sm text-muted-foreground mb-2">Styles</p>
          <div className="flex flex-wrap gap-2">
            {profile.styles.map(s => (
              <span key={s} className="chip chip-active text-sm">{s}</span>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow">
          <p className="text-sm text-muted-foreground mb-1">Budget par pièce</p>
          <p className="text-2xl font-serif font-bold text-primary">{profile.budget}€</p>
        </div>
        {profile.brands.length > 0 && (
          <div className="bg-card rounded-xl p-5 card-shadow">
            <p className="text-sm text-muted-foreground mb-2">Marques préférées</p>
            <div className="flex flex-wrap gap-2">
              {profile.brands.map(b => (
                <span key={b} className="chip text-sm">{b}</span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <p className="text-sm text-muted-foreground mb-1">Meilleur streak</p>
          <p className="text-2xl font-serif font-bold" style={{ color: '#C9956C' }}>
            {getStreak().bestStreak} jours 🔥
          </p>
        </div>
      </div>

      <button onClick={onEditProfile}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold mt-6 active:scale-[0.98] transition-transform shadow-lg">
        Modifier mon profil
      </button>
      <button onClick={onLogout} className="w-full py-3 mt-4 text-destructive text-sm font-medium">
        Se déconnecter
      </button>
    </div>
  );
}
