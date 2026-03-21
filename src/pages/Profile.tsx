import { useState, useEffect } from 'react';
import { getProfile, getAvatar, getPalette, saveAvatar, savePalette } from '@/lib/storage';
import AvatarSVG from '@/components/AvatarSVG';
import AvatarCreator, { DEFAULT_AVATAR } from '@/components/AvatarCreator';
import { AvatarData } from '@/components/AvatarSVG';
import { getPaletteForSkin, PALETTE_COLORS } from '@/lib/colorimetry';
import { getStreak } from '@/lib/streak';
import { UserProfile, AvatarConfig } from '@/lib/types';
import { ColorPalette } from '@/lib/colorimetry';

interface Props {
  onEditProfile: () => void;
  onLogout: () => void;
}

export default function Profile({ onEditProfile, onLogout }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<AvatarData>(DEFAULT_AVATAR);
  const [palette, setPaletteState] = useState<ColorPalette | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, a] = await Promise.all([getProfile(), getAvatar()]);
      setProfile(p);
      // Prefer localStorage alex_avatar, fallback to Supabase, then default
      let avatarData: AvatarData = DEFAULT_AVATAR;
      try {
        const raw = localStorage.getItem('alex_avatar');
        if (raw) avatarData = JSON.parse(raw);
        else if (a) avatarData = a as AvatarData;
      } catch {}
      setAvatar(avatarData);
      setPaletteState(getPalette());
      setLoading(false);
    };
    load();
  }, []);

  const handleAvatarSave = async (data: AvatarData) => {
    localStorage.setItem('alex_avatar', JSON.stringify(data));
    await saveAvatar(data);
    const newPalette = getPaletteForSkin(data.skin);
    savePalette(newPalette);
    setAvatar(data);
    setPaletteState(newPalette);
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

      {/* Color palette */}
      {palette && palette.recommended.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow mb-4">
          <p className="text-sm text-muted-foreground mb-2">Ces couleurs sont recommandées pour ton teint ✨</p>
          <div className="flex flex-wrap gap-2">
            {palette.recommended.map(c => (
              <div key={c} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: PALETTE_COLORS[c] || '#ccc' }} />
                <span className="text-[10px] text-muted-foreground">{c}</span>
              </div>
            ))}
          </div>
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
