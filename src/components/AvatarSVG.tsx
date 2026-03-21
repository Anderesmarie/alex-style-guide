import { HAIR_COLORS } from '@/lib/colorimetry';

export interface AvatarData {
  skin: string;
  faceShape: string;
  eyeColor: string;
  eyeShape: string;
  browShape: string;
  browColor: string;
  noseShape: string;
  lipsShape: string;
  lipsColor: string;
  hairStyle: string;
  hairColor: string;
  extras: string[];
}

// ---------- Skin tone triplets ----------
export const SKIN_TONES: Record<string, { face: string; neck: string; bg: string; label: string }> = {
  'tres-clair':  { face: '#FEF0E6', neck: '#F0D8C0', bg: '#FFF8F2', label: 'Très clair' },
  'clair':       { face: '#F9D9C0', neck: '#F0C4A0', bg: '#FDF4EC', label: 'Clair' },
  'clair-rose':  { face: '#FADADB', neck: '#F5C8B8', bg: '#FDF0F0', label: 'Clair rosé' },
  'beige-dore':  { face: '#E8B87A', neck: '#D9A060', bg: '#F5E8D0', label: 'Beige doré' },
  'miel':        { face: '#D49455', neck: '#C0803C', bg: '#EDDDBE', label: 'Miel' },
  'caramel':     { face: '#B8732A', neck: '#A06020', bg: '#D9C0A0', label: 'Caramel' },
  'brun':        { face: '#7B4820', neck: '#623815', bg: '#B89070', label: 'Brun' },
  'ebene':       { face: '#3D1E0A', neck: '#2E1406', bg: '#6B4028', label: 'Ébène' },
};

// ---------- Face shape params ----------
export const FACE_SHAPES: Record<string, { cx: number; cy: number; rx: number; ry: number; label: string }> = {
  'ovale':   { cx: 60, cy: 68, rx: 28, ry: 34, label: 'Ovale' },
  'rond':    { cx: 60, cy: 66, rx: 30, ry: 30, label: 'Rond' },
  'carre':   { cx: 60, cy: 68, rx: 27, ry: 29, label: 'Carré' },
  'coeur':   { cx: 60, cy: 68, rx: 26, ry: 30, label: 'Cœur' },
  'long':    { cx: 60, cy: 70, rx: 22, ry: 40, label: 'Long' },
  'diamant': { cx: 60, cy: 68, rx: 24, ry: 34, label: 'Diamant' },
};

// ---------- Eye shape params ----------
export const EYE_SHAPES: Record<string, { rx: number; ry: number; lcx: number; rcx: number; label: string }> = {
  'amande':   { rx: 8, ry: 6, lcx: 45, rcx: 75, label: 'Amande' },
  'ronds':    { rx: 7, ry: 7, lcx: 45, rcx: 75, label: 'Ronds' },
  'brides':   { rx: 9, ry: 4, lcx: 45, rcx: 75, label: 'Bridés' },
  'tombants': { rx: 8, ry: 6, lcx: 45, rcx: 75, label: 'Tombants' },
  'ecartes':  { rx: 8, ry: 6, lcx: 40, rcx: 80, label: 'Écartés' },
};

// ---------- Nose shape params ----------
export const NOSE_SHAPES: Record<string, { d: string; label: string }> = {
  'petit':     { d: 'M60 66 Q57 74 54 76 Q60 78 66 76 Q63 74 60 66Z', label: 'Petit' },
  'droit':     { d: 'M59 64 L59 76 Q60 78 61 76 L61 64Z', label: 'Droit' },
  'retrousse': { d: 'M60 66 Q57 72 56 76 Q60 79 64 76 Q63 72 60 66Z', label: 'Retroussé' },
  'large':     { d: 'M60 65 Q55 74 50 78 Q60 81 70 78 Q65 74 60 65Z', label: 'Large' },
  'aquilin':   { d: 'M60 62 Q58 70 54 78 Q60 80 66 78 Q62 70 60 62Z', label: 'Aquilin' },
};

// ---------- Lips shape params ----------
export const LIPS_SHAPES: Record<string, { top: string; bot: string; label: string }> = {
  'naturelles': {
    top: 'M50 86 Q55 83 60 84 Q65 83 70 86 Q65 84 60 85 Q55 84 50 86Z',
    bot: 'M50 86 Q55 91 60 91.5 Q65 91 70 86 Q65 89 60 89.5 Q55 89 50 86Z',
    label: 'Naturelles',
  },
  'pulpeuses': {
    top: 'M48 85 Q55 80 60 82 Q65 80 72 85 Q65 82 60 83 Q55 82 48 85Z',
    bot: 'M48 85 Q55 93 60 94 Q65 93 72 85 Q65 91 60 92 Q55 91 48 85Z',
    label: 'Pulpeuses',
  },
  'fines': {
    top: 'M51 87 Q56 84 60 85 Q64 84 69 87 Q64 85 60 86 Q56 85 51 87Z',
    bot: 'M51 87 Q56 90 60 90.5 Q64 90 69 87 Q64 89 60 89.5 Q56 89 51 87Z',
    label: 'Fines',
  },
  'cupidon': {
    top: 'M50 86 Q54 82 57 84 Q60 81 63 84 Q66 82 70 86 Q65 84 60 85 Q55 84 50 86Z',
    bot: 'M50 86 Q55 91 60 91.5 Q65 91 70 86 Q65 89 60 89.5 Q55 89 50 86Z',
    label: 'Arc de Cupidon',
  },
  'asymetriques': {
    top: 'M50 87 Q55 83 60 84 Q65 82 70 85 Q65 83 60 84.5 Q55 83.5 50 87Z',
    bot: 'M50 87 Q55 91 60 91 Q65 90.5 70 85 Q65 88.5 60 89 Q55 88.5 50 87Z',
    label: 'Asymétriques',
  },
};

// ---------- Lips color options ----------
export const LIPS_COLOR_OPTIONS = [
  { key: '#D4756A', label: 'Rose naturel' },
  { key: '#E8A090', label: 'Rose clair' },
  { key: '#C24B4B', label: 'Rouge' },
  { key: '#8B2040', label: 'Bordeaux' },
  { key: '#C47560', label: 'Nude' },
  { key: '#B06A9A', label: 'Rose froid' },
  { key: '#3A2A2A', label: 'Foncé' },
];

// ---------- Brow shape params ----------
export const BROW_SHAPES: Record<string, { ld: string; rd: string; sw: number; label: string }> = {
  'arques': { ld: 'M38 52 Q44 48 50 52', rd: 'M70 52 Q76 48 82 52', sw: 1.8, label: 'Arqués' },
  'droits': { ld: 'M37 52 L50 52', rd: 'M70 52 L83 52', sw: 2, label: 'Droits' },
  'ronds':  { ld: 'M38 53 Q44 50 50 53', rd: 'M70 53 Q76 50 82 53', sw: 1.8, label: 'Ronds' },
  'epais':  { ld: 'M38 52 Q44 48 50 52', rd: 'M70 52 Q76 48 82 52', sw: 3, label: 'Épais' },
  'fins':   { ld: 'M39 52 Q44 50 49 52', rd: 'M71 52 Q76 50 81 52', sw: 1, label: 'Fins' },
};

// ---------- Eye color options ----------
export const EYE_COLOR_OPTIONS = [
  { key: '#7B4F2E', label: 'Noisette' },
  { key: '#5C3317', label: 'Marron' },
  { key: '#4A7C59', label: 'Vert' },
  { key: '#4A7EBD', label: 'Bleu' },
  { key: '#7D8C8C', label: 'Gris' },
  { key: '#1A0A00', label: 'Noir' },
  { key: '#8B6914', label: 'Ambre' },
];

// ---------- Brow color options ----------
export const BROW_COLOR_OPTIONS = [
  { key: '#3B1F0A', label: 'Brun foncé' },
  { key: '#6B4226', label: 'Brun' },
  { key: '#A0784A', label: 'Châtain' },
  { key: '#BFA888', label: 'Blond' },
  { key: '#A0522D', label: 'Roux' },
  { key: '#1C1C1C', label: 'Noir' },
  { key: '#999999', label: 'Gris' },
];

interface Props {
  avatar: AvatarData;
  size?: number;
}

function HairSVG({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'court-lisse':
      return <path d="M36 46 Q60 18 84 46 Q86 34 82 26 Q60 10 38 26 Q34 34 36 46Z" fill={color} />;
    case 'court-boucle':
      return <>
        <path d="M34 48 Q60 14 86 48 Q88 32 82 22 Q60 6 38 22 Q32 32 34 48Z" fill={color} />
        <circle cx={38} cy={34} r={5} fill={color} /><circle cx={50} cy={24} r={5} fill={color} />
        <circle cx={70} cy={24} r={5} fill={color} /><circle cx={82} cy={34} r={5} fill={color} />
      </>;
    case 'mi-long-lisse':
      return <path d="M32 50 Q34 22 60 18 Q86 22 88 50 L90 70 Q88 74 84 70 L84 50 Q82 32 60 28 Q38 32 36 50 L36 70 Q32 74 30 70Z" fill={color} />;
    case 'mi-long-boucle':
      return <>
        <path d="M32 50 Q34 22 60 18 Q86 22 88 50 L90 72 Q86 78 84 70 L84 50 Q82 32 60 28 Q38 32 36 50 L36 70 Q34 78 30 72Z" fill={color} />
        <circle cx={32} cy={62} r={6} fill={color} /><circle cx={88} cy={62} r={6} fill={color} />
      </>;
    case 'long-lisse':
      return <path d="M30 50 Q34 20 60 16 Q86 20 90 50 L92 90 Q90 96 86 90 L84 50 Q82 28 60 24 Q38 28 36 50 L34 90 Q30 96 28 90Z" fill={color} />;
    case 'long-boucle':
      return <>
        <path d="M30 50 Q34 20 60 16 Q86 20 90 50 L92 94 Q88 98 86 92 L84 50 Q82 28 60 24 Q38 28 36 50 L34 92 Q32 98 28 94Z" fill={color} />
        <circle cx={30} cy={72} r={6} fill={color} /><circle cx={90} cy={72} r={6} fill={color} />
        <circle cx={28} cy={86} r={5} fill={color} /><circle cx={92} cy={86} r={5} fill={color} />
      </>;
    case 'chignon':
      return <>
        <path d="M36 46 Q60 18 84 46 Q86 34 82 26 Q60 10 38 26 Q34 34 36 46Z" fill={color} />
        <circle cx={60} cy={20} r={12} fill={color} />
      </>;
    case 'tresse':
      return <>
        <path d="M32 50 Q34 22 60 18 Q86 22 88 50 L88 58 Q86 60 84 58 L84 50 Q82 32 60 28 Q38 32 36 50 L36 58 Q34 60 32 58Z" fill={color} />
        <path d="M60 50 L62 62 L58 70 L62 78 L58 86 L62 94 L60 98 L58 94 L62 86 L58 78 L62 70 L58 62Z" fill={color} strokeWidth={2} />
      </>;
    default:
      return <path d="M36 46 Q60 18 84 46 Q86 34 82 26 Q60 10 38 26 Q34 34 36 46Z" fill={color} />;
  }
}

export default function AvatarSVG({ avatar, size = 120 }: Props) {
  const tone = SKIN_TONES[avatar.skin] || SKIN_TONES['clair-rose'];
  const face = FACE_SHAPES[avatar.faceShape] || FACE_SHAPES['ovale'];
  const eye = EYE_SHAPES[avatar.eyeShape] || EYE_SHAPES['amande'];
  const brow = BROW_SHAPES[avatar.browShape] || BROW_SHAPES['arques'];
  const eyeHex = avatar.eyeColor || '#7B4F2E';
  const browHex = avatar.browColor || '#3B1F0A';
  const lipsHex = avatar.lipsColor || '#D4756A';
  const hairHex = HAIR_COLORS[avatar.hairColor] || avatar.hairColor || '#3B1F0A';

  // Tombants: shift outer corners down
  const tombantDy = avatar.eyeShape === 'tombants' ? 2 : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="rounded-full">
      {/* Background circle */}
      <circle id="bg-circle" cx={60} cy={60} r={60} fill={tone.bg} />

      {/* Neck + shoulders */}
      <rect id="neck" x={50} y={86} width={20} height={14} rx={5} fill={tone.neck} />
      <ellipse id="shoulders" cx={60} cy={110} rx={36} ry={16} fill={tone.neck} />

      {/* Face */}
      <ellipse id="face-shape" cx={face.cx} cy={face.cy} rx={face.rx} ry={face.ry} fill={tone.face} />

      {/* Eyes */}
      <ellipse id="eye-white-l" cx={eye.lcx} cy={66 + tombantDy / 2} rx={eye.rx} ry={eye.ry} fill="white" />
      <ellipse id="eye-white-r" cx={eye.rcx} cy={66 + tombantDy / 2} rx={eye.rx} ry={eye.ry} fill="white" />
      {avatar.eyeShape === 'tombants' && (
        <>
          <clipPath id="clip-eye-l"><ellipse cx={eye.lcx} cy={66 + tombantDy / 2} rx={eye.rx} ry={eye.ry} /></clipPath>
          <clipPath id="clip-eye-r"><ellipse cx={eye.rcx} cy={66 + tombantDy / 2} rx={eye.rx} ry={eye.ry} /></clipPath>
          <rect x={eye.lcx + 2} y={64} width={eye.rx} height={4} fill={tone.face} clipPath="url(#clip-eye-l)" />
          <rect x={eye.rcx + 2} y={64} width={eye.rx} height={4} fill={tone.face} clipPath="url(#clip-eye-r)" />
        </>
      )}
      <circle id="iris-l" cx={eye.lcx} cy={66 + tombantDy / 2} r={2.8} fill={eyeHex} />
      <circle id="iris-r" cx={eye.rcx} cy={66 + tombantDy / 2} r={2.8} fill={eyeHex} />
      <circle cx={eye.lcx + 0.6} cy={65.4 + tombantDy / 2} r={0.8} fill="white" />
      <circle cx={eye.rcx + 0.6} cy={65.4 + tombantDy / 2} r={0.8} fill="white" />

      {/* Eyebrows */}
      <path id="brow-l" d={brow.ld} stroke={browHex} strokeWidth={brow.sw} fill="none" strokeLinecap="round" />
      <path id="brow-r" d={brow.rd} stroke={browHex} strokeWidth={brow.sw} fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path id="nose" d="M60 68 Q58 74 60 76 Q62 74 60 68" stroke={tone.neck} strokeWidth={1.2} fill="none" />

      {/* Mouth */}
      <path d="M52 82 Q60 88 68 82" stroke={lipsHex} strokeWidth={1.8} fill="none" strokeLinecap="round" />

      {/* Hair */}
      <HairSVG style={avatar.hairStyle} color={hairHex} />
    </svg>
  );
}
