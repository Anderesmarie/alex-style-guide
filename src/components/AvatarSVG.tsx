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

function HairBack({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'long-lisse':
    case 'avec-frange':
      return <path id="hair-back" d="M28 58 Q24 30 60 24 Q96 30 92 58 Q94 115 60 122 Q26 115 28 58Z" fill={color} />;
    case 'long-boucle':
      return <>
        <path id="hair-back" d="M28 58 Q24 30 60 24 Q96 30 92 58 Q94 115 60 122 Q26 115 28 58Z" fill={color} />
        <path d="M26 65 Q22 78 28 88 Q22 98 28 108 Q24 115 28 120" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M94 65 Q98 78 92 88 Q98 98 92 108 Q96 115 92 120" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
      </>;
    case 'mi-long':
      return <path id="hair-back" d="M28 58 Q24 30 60 24 Q96 30 92 58 Q94 100 60 105 Q26 100 28 58Z" fill={color} />;
    case 'court':
      return <path id="hair-back" d="M28 55 Q24 28 60 22 Q96 28 92 55 Q94 80 60 85 Q26 80 28 55Z" fill={color} />;
    default:
      return <path id="hair-back" d="M28 58 Q24 30 60 24 Q96 30 92 58 Q94 115 60 122 Q26 115 28 58Z" fill={color} />;
  }
}

function HairFront({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'long-lisse':
      return <path id="hair-front" d="M28 58 Q26 46 36 38 Q44 32 60 30 Q76 32 84 38 Q94 46 92 58 L92 72 Q90 54 60 48 Q30 54 28 72Z" fill={color} />;
    case 'long-boucle':
      return <path id="hair-front" d="M28 58 Q26 46 36 38 Q44 32 60 30 Q76 32 84 38 Q94 46 92 58 L92 72 Q90 54 60 48 Q30 54 28 72Z" fill={color} />;
    case 'mi-long':
      return <path id="hair-front" d="M28 58 Q26 46 36 38 Q44 32 60 30 Q76 32 84 38 Q94 46 92 58 L92 68 Q90 52 60 48 Q30 52 28 68Z" fill={color} />;
    case 'court':
      return <path id="hair-front" d="M30 56 Q28 44 38 38 Q46 32 60 30 Q74 32 82 38 Q92 44 90 56 L90 68 Q88 52 60 48 Q32 52 30 68Z" fill={color} />;
    case 'avec-frange':
      return <>
        <path id="hair-front" d="M28 58 Q26 46 36 38 Q44 32 60 30 Q76 32 84 38 Q94 46 92 58 L92 72 Q90 54 60 48 Q30 54 28 72Z" fill={color} />
        <path d="M34 42 Q46 54 60 54 Q74 54 86 42 Q74 60 60 60 Q46 60 34 42Z" fill={color} />
      </>;
    default:
      return <path id="hair-front" d="M28 58 Q26 46 36 38 Q44 32 60 30 Q76 32 84 38 Q94 46 92 58 L92 72 Q90 54 60 48 Q30 54 28 72Z" fill={color} />;
  }
}

// Helper: darken a hex color by reducing each RGB channel
function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function AvatarSVG({ avatar, size = 120 }: Props) {
  const tone = SKIN_TONES[avatar.skin] || SKIN_TONES['clair-rose'];
  const face = FACE_SHAPES[avatar.faceShape] || FACE_SHAPES['ovale'];
  const eye = EYE_SHAPES[avatar.eyeShape] || EYE_SHAPES['amande'];
  const brow = BROW_SHAPES[avatar.browShape] || BROW_SHAPES['arques'];
  const nose = NOSE_SHAPES[avatar.noseShape] || NOSE_SHAPES['petit'];
  const lips = LIPS_SHAPES[avatar.lipsShape] || LIPS_SHAPES['naturelles'];
  const eyeHex = avatar.eyeColor || '#7B4F2E';
  const browHex = avatar.browColor || '#3B1F0A';
  const lipsHex = avatar.lipsColor || '#D4756A';
  const lipsBotHex = darkenHex(lipsHex, 20);
  const hairHex = HAIR_COLORS[avatar.hairColor] || avatar.hairColor || '#3B1F0A';

  const tombantDy = avatar.eyeShape === 'tombants' ? 2 : 0;

  const eyeCy = 66 + tombantDy / 2;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="rounded-full">
      <defs>
        <clipPath id="avatar-clip"><rect x={0} y={0} width={120} height={95} /></clipPath>
        {avatar.eyeShape === 'tombants' && (
          <>
            <clipPath id="clip-eye-l"><ellipse cx={eye.lcx} cy={eyeCy} rx={eye.rx} ry={eye.ry} /></clipPath>
            <clipPath id="clip-eye-r"><ellipse cx={eye.rcx} cy={eyeCy} rx={eye.rx} ry={eye.ry} /></clipPath>
          </>
        )}
      </defs>

      <circle id="bg-circle" cx={60} cy={60} r={60} fill={tone.bg} />
      <rect id="neck" x={50} y={86} width={20} height={14} rx={5} fill={tone.neck} />
      <ellipse id="shoulders" cx={60} cy={110} rx={36} ry={16} fill={tone.neck} />

      <g clipPath="url(#avatar-clip)">
        <HairBack style={avatar.hairStyle} color={hairHex} />
      </g>

      <ellipse id="face-shape" cx={face.cx} cy={face.cy} rx={face.rx} ry={face.ry} fill={tone.face} />

      {/* Eyes */}
      <ellipse id="eye-white-l" cx={eye.lcx} cy={eyeCy} rx={eye.rx} ry={eye.ry} fill="white" />
      <ellipse id="eye-white-r" cx={eye.rcx} cy={eyeCy} rx={eye.rx} ry={eye.ry} fill="white" />
      {avatar.eyeShape === 'tombants' && (
        <>
          <rect x={eye.lcx + 2} y={64} width={eye.rx} height={4} fill={tone.face} clipPath="url(#clip-eye-l)" />
          <rect x={eye.rcx + 2} y={64} width={eye.rx} height={4} fill={tone.face} clipPath="url(#clip-eye-r)" />
        </>
      )}
      <circle id="iris-l" cx={eye.lcx} cy={eyeCy} r={4.5} fill={eyeHex} />
      <circle id="iris-r" cx={eye.rcx} cy={eyeCy} r={4.5} fill={eyeHex} />
      <circle cx={eye.lcx} cy={eyeCy} r={2} fill="#000" />
      <circle cx={eye.rcx} cy={eyeCy} r={2} fill="#000" />
      <circle cx={eye.lcx + 1.2} cy={eyeCy - 1.2} r={1.2} fill="white" />
      <circle cx={eye.rcx + 1.2} cy={eyeCy - 1.2} r={1.2} fill="white" />
      <path d={`M${eye.lcx - eye.rx + 1} ${eyeCy - 1} Q${eye.lcx} ${eyeCy - eye.ry - 1} ${eye.lcx + eye.rx - 1} ${eyeCy - 1}`} stroke="#2C2C2C" strokeWidth={1.5} fill="none" />
      <path d={`M${eye.rcx - eye.rx + 1} ${eyeCy - 1} Q${eye.rcx} ${eyeCy - eye.ry - 1} ${eye.rcx + eye.rx - 1} ${eyeCy - 1}`} stroke="#2C2C2C" strokeWidth={1.5} fill="none" />

      <path id="nose" d={nose.d} fill={tone.neck} />

      <path id="lips-top" d={lips.top} fill={lipsHex} />
      <path id="lips-bot" d={lips.bot} fill={lipsBotHex} />

      <g clipPath="url(#avatar-clip)">
        <HairFront style={avatar.hairStyle} color={hairHex} />
      </g>

      {/* Brows rendered after hair so they're always visible */}
      <path id="brow-l" d={brow.ld} stroke={browHex} strokeWidth={brow.sw} fill="none" strokeLinecap="round" />
      <path id="brow-r" d={brow.rd} stroke={browHex} strokeWidth={brow.sw} fill="none" strokeLinecap="round" />
    </svg>
  );
}
