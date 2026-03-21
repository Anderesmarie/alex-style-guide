import { useState, useEffect } from 'react';
import AvatarSVG, { AvatarData, SKIN_TONES, FACE_SHAPES, EYE_SHAPES, BROW_SHAPES, EYE_COLOR_OPTIONS, BROW_COLOR_OPTIONS, NOSE_SHAPES, LIPS_SHAPES, LIPS_COLOR_OPTIONS } from './AvatarSVG';
import { HAIR_COLORS } from '@/lib/colorimetry';

const SKIN_OPTIONS = Object.keys(SKIN_TONES);
const FACE_SHAPE_OPTIONS = Object.keys(FACE_SHAPES);
const EYE_SHAPE_OPTIONS = Object.keys(EYE_SHAPES);
const BROW_SHAPE_OPTIONS = Object.keys(BROW_SHAPES);
const NOSE_SHAPE_OPTIONS = Object.keys(NOSE_SHAPES);
const LIPS_SHAPE_OPTIONS = Object.keys(LIPS_SHAPES);

const HAIR_STYLE_OPTIONS = [
  { key: 'court-lisse', label: 'Court lisse' },
  { key: 'court-boucle', label: 'Court bouclé' },
  { key: 'mi-long-lisse', label: 'Mi-long lisse' },
  { key: 'mi-long-boucle', label: 'Mi-long bouclé' },
  { key: 'long-lisse', label: 'Long lisse' },
  { key: 'long-boucle', label: 'Long bouclé' },
  { key: 'chignon', label: 'Chignon' },
  { key: 'tresse', label: 'Tresse' },
];
const HAIR_COLOR_OPTIONS = Object.keys(HAIR_COLORS);

// Map hair color to closest brow color
function hairToBrowColor(hairColor: string): string {
  const map: Record<string, string> = {
    'Noir': '#1C1C1C',
    'Brun': '#3B1F0A',
    'Châtain': '#6B4226',
    'Blond': '#BFA888',
    'Roux': '#A0522D',
    'Platine': '#BFA888',
    'Gris': '#999999',
  };
  return map[hairColor] || '#3B1F0A';
}

interface Props {
  initial?: AvatarData | null;
  onSave: (avatar: AvatarData) => void;
}

export const DEFAULT_AVATAR: AvatarData = {
  skin: 'clair-rose',
  faceShape: 'ovale',
  eyeColor: '#7B4F2E',
  eyeShape: 'amande',
  browShape: 'arques',
  browColor: '#3B1F0A',
  noseShape: 'petit',
  lipsShape: 'naturelles',
  lipsColor: '#D4756A',
  hairStyle: 'long-lisse',
  hairColor: 'Brun',
  extras: [],
};

export default function AvatarCreator({ initial, onSave }: Props) {
  const init = initial || DEFAULT_AVATAR;
  const [skin, setSkin] = useState(init.skin || DEFAULT_AVATAR.skin);
  const [faceShape, setFaceShape] = useState(init.faceShape || DEFAULT_AVATAR.faceShape);
  const [eyeColor, setEyeColor] = useState(init.eyeColor || DEFAULT_AVATAR.eyeColor);
  const [eyeShape, setEyeShape] = useState(init.eyeShape || DEFAULT_AVATAR.eyeShape);
  const [browShape, setBrowShape] = useState(init.browShape || DEFAULT_AVATAR.browShape);
  const [browColor, setBrowColor] = useState(init.browColor || DEFAULT_AVATAR.browColor);
  const [browColorManual, setBrowColorManual] = useState(false);
  const [noseShape, setNoseShape] = useState(init.noseShape || DEFAULT_AVATAR.noseShape);
  const [lipsShape, setLipsShape] = useState(init.lipsShape || DEFAULT_AVATAR.lipsShape);
  const [lipsColor, setLipsColor] = useState(init.lipsColor || DEFAULT_AVATAR.lipsColor);
  const [hairStyle, setHairStyle] = useState(init.hairStyle || DEFAULT_AVATAR.hairStyle);
  const [hairColor, setHairColor] = useState(init.hairColor || DEFAULT_AVATAR.hairColor);

  // Sync brow color with hair color unless manually overridden
  useEffect(() => {
    if (!browColorManual) {
      setBrowColor(hairToBrowColor(hairColor));
    }
  }, [hairColor, browColorManual]);

  const avatar: AvatarData = {
    skin,
    faceShape,
    eyeColor,
    eyeShape,
    browShape,
    browColor,
    noseShape,
    lipsShape,
    lipsColor,
    hairStyle,
    hairColor,
    extras: init.extras || [],
  };

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

      {/* Skin tone */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Teint</label>
      <div className="flex flex-wrap gap-3 mb-5">
        {SKIN_OPTIONS.map(s => {
          const tone = SKIN_TONES[s];
          return (
            <button
              key={s}
              onClick={() => setSkin(s)}
              className={`w-10 h-10 rounded-full transition-all ${skin === s ? 'ring-3 ring-primary ring-offset-2' : ''}`}
              style={{ backgroundColor: tone.face }}
              title={tone.label}
            />
          );
        })}
      </div>

      {/* Face shape */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Forme du visage</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {FACE_SHAPE_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFaceShape(f)}
            className={`chip text-xs ${faceShape === f ? 'chip-active' : ''}`}
          >
            {FACE_SHAPES[f].label}
          </button>
        ))}
      </div>

      {/* Eye color */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Couleur des yeux</label>
      <div className="flex flex-wrap gap-3 mb-5">
        {EYE_COLOR_OPTIONS.map(e => (
          <button
            key={e.key}
            onClick={() => setEyeColor(e.key)}
            className={`w-10 h-10 rounded-full transition-all ${eyeColor === e.key ? 'ring-3 ring-primary ring-offset-2' : ''}`}
            style={{ backgroundColor: e.key }}
            title={e.label}
          />
        ))}
      </div>

      {/* Eye shape */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Forme des yeux</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {EYE_SHAPE_OPTIONS.map(e => (
          <button
            key={e}
            onClick={() => setEyeShape(e)}
            className={`chip text-xs ${eyeShape === e ? 'chip-active' : ''}`}
          >
            {EYE_SHAPES[e].label}
          </button>
        ))}
      </div>

      {/* Brow shape */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Forme des sourcils</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {BROW_SHAPE_OPTIONS.map(b => (
          <button
            key={b}
            onClick={() => setBrowShape(b)}
            className={`chip text-xs ${browShape === b ? 'chip-active' : ''}`}
          >
            {BROW_SHAPES[b].label}
          </button>
        ))}
      </div>

      {/* Brow color */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
        Couleur des sourcils
        {!browColorManual && <span className="text-xs font-normal ml-1">(sync cheveux)</span>}
      </label>
      <div className="flex flex-wrap gap-3 mb-5">
        {BROW_COLOR_OPTIONS.map(c => (
          <button
            key={c.key}
            onClick={() => { setBrowColor(c.key); setBrowColorManual(true); }}
            className={`w-10 h-10 rounded-full transition-all ${browColor === c.key ? 'ring-3 ring-primary ring-offset-2' : ''}`}
            style={{ backgroundColor: c.key }}
            title={c.label}
          />
        ))}
      </div>

      {/* Nose shape */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Forme du nez</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {NOSE_SHAPE_OPTIONS.map(n => (
          <button
            key={n}
            onClick={() => setNoseShape(n)}
            className={`chip text-xs ${noseShape === n ? 'chip-active' : ''}`}
          >
            {NOSE_SHAPES[n].label}
          </button>
        ))}
      </div>

      {/* Lips shape */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Forme des lèvres</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {LIPS_SHAPE_OPTIONS.map(l => (
          <button
            key={l}
            onClick={() => setLipsShape(l)}
            className={`chip text-xs ${lipsShape === l ? 'chip-active' : ''}`}
          >
            {LIPS_SHAPES[l].label}
          </button>
        ))}
      </div>

      {/* Lips color */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Couleur des lèvres</label>
      <div className="flex flex-wrap gap-3 mb-5">
        {LIPS_COLOR_OPTIONS.map(c => (
          <button
            key={c.key}
            onClick={() => setLipsColor(c.key)}
            className={`w-10 h-10 rounded-full transition-all ${lipsColor === c.key ? 'ring-3 ring-primary ring-offset-2' : ''}`}
            style={{ backgroundColor: c.key }}
            title={c.label}
          />
        ))}
      </div>

      {/* Hair style */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Style de cheveux</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {HAIR_STYLE_OPTIONS.map(h => (
          <button
            key={h.key}
            onClick={() => setHairStyle(h.key)}
            className={`chip text-xs ${hairStyle === h.key ? 'chip-active' : ''}`}
          >
            {h.label}
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
