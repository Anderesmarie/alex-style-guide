import { useState } from 'react';
import AvatarSVG, { AvatarData } from './AvatarSVG';
import { SKIN_COLORS, EYE_COLORS, HAIR_COLORS } from '@/lib/colorimetry';

const SKIN_OPTIONS = Object.keys(SKIN_COLORS);
const EYE_OPTIONS = Object.keys(EYE_COLORS);
const HAIR_STYLE_OPTIONS = [
  'Court lisse', 'Court bouclé', 'Mi-long lisse', 'Mi-long bouclé',
  'Long lisse', 'Long bouclé', 'Chignon', 'Tresse',
];
const HAIR_COLOR_OPTIONS = Object.keys(HAIR_COLORS);

interface Props {
  initial?: AvatarData | null;
  onSave: (avatar: AvatarData) => void;
}

export default function AvatarCreator({ initial, onSave }: Props) {
  const [skin, setSkin] = useState(initial?.skin || 'Clair');
  const [eyeColor, setEyeColor] = useState(initial?.eyeColor || 'Marron');
  const [hairStyle, setHairStyle] = useState(initial?.hairStyle || 'Long lisse');
  const [hairColor, setHairColor] = useState(initial?.hairColor || 'Brun');

  const avatar: AvatarData = { skin, eyeColor, hairStyle, hairColor };

  return (
    <div className="fade-enter">
      <h1 className="text-2xl font-serif font-bold mb-2">Crée ton avatar ✨</h1>
      <p className="text-sm text-muted-foreground mb-6">
        On s'en sert pour personnaliser tes recommandations de couleurs
      </p>

      {/* Avatar preview */}
      <div className="flex justify-center mb-8">
        <AvatarSVG avatar={avatar} size={160} />
      </div>

      {/* Skin */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Teint</label>
      <div className="flex flex-wrap gap-3 mb-5">
        {SKIN_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSkin(s)}
            className={`w-10 h-10 rounded-full transition-all ${skin === s ? 'ring-3 ring-primary ring-offset-2' : ''}`}
            style={{ backgroundColor: SKIN_COLORS[s] }}
            title={s}
          />
        ))}
      </div>

      {/* Eye color */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Couleur des yeux</label>
      <div className="flex flex-wrap gap-3 mb-5">
        {EYE_OPTIONS.map(e => (
          <button
            key={e}
            onClick={() => setEyeColor(e)}
            className={`w-10 h-10 rounded-full transition-all ${eyeColor === e ? 'ring-3 ring-primary ring-offset-2' : ''}`}
            style={{ backgroundColor: EYE_COLORS[e] }}
            title={e}
          />
        ))}
      </div>

      {/* Hair style */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Style de cheveux</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {HAIR_STYLE_OPTIONS.map(h => (
          <button
            key={h}
            onClick={() => setHairStyle(h)}
            className={`chip text-xs ${hairStyle === h ? 'chip-active' : ''}`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Hair color */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Couleur des cheveux</label>
      <div className="flex flex-wrap gap-3 mb-6">
        {HAIR_COLOR_OPTIONS.map(c => (
          <button
            key={c}
            onClick={() => setHairColor(c)}
            className={`w-10 h-10 rounded-full transition-all ${hairColor === c ? 'ring-3 ring-primary ring-offset-2' : ''}`}
            style={{ backgroundColor: HAIR_COLORS[c] }}
            title={c}
          />
        ))}
      </div>

      <button
        onClick={() => onSave(avatar)}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg active:scale-[0.98] transition-transform text-lg"
      >
        C'est moi ! ✨
      </button>
    </div>
  );
}
