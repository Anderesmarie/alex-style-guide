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
      return <path id="hair-back" d="M32 62 Q28 35 60 28 Q92 35 88 62 Q88 110 60 118 Q32 110 32 62Z" fill={color} />;
    case 'long-boucle':
      return <>
        <path id="hair-back" d="M32 62 Q28 35 60 28 Q92 35 88 62 Q88 110 60 118 Q32 110 32 62Z" fill={color} />
        <path d="M30 70 Q28 80 32 90 Q28 100 32 110" stroke={color} strokeWidth={4} fill="none" />
        <path d="M90 70 Q92 80 88 90 Q92 100 88 110" stroke={color} strokeWidth={4} fill="none" />
      </>;
    case 'mi-long':
      return <path id="hair-back" d="M32 62 Q28 35 60 28 Q92 35 88 62 Q88 96 60 100 Q32 96 32 62Z" fill={color} />;
    case 'court':
      return <path id="hair-back" d="M32 62 Q28 35 60 28 Q92 35 88 62 Q88 78 60 82 Q32 78 32 62Z" fill={color} />;
    case 'chignon':
      return null;
    case 'tresse':
      return <path id="hair-back" d="M48 36 Q52 70 50 115 Q60 118 70 115 Q68 70 72 36 Q66 30 54 30Z" fill={color} />;
    case 'queue-de-cheval':
      return <ellipse id="hair-back" cx={62} cy={35} rx={20} ry={26} fill={color} />;
    case 'afro':
      return <circle id="hair-back" cx={60} cy={50} r={40} fill={color} />;
    default:
      return <path id="hair-back" d="M32 62 Q28 35 60 28 Q92 35 88 62 Q88 110 60 118 Q32 110 32 62Z" fill={color} />;
  }
}

function HairFront({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'long-lisse':
      return <path id="hair-front" d="M32 62 Q30 50 38 42 Q45 36 60 34 Q75 36 82 42 Q90 50 88 62 L88 70 Q88 55 60 52 Q32 55 32 70Z" fill={color} />;
    case 'long-boucle':
      return <path id="hair-front" d="M32 62 Q30 50 38 42 Q45 36 60 34 Q75 36 82 42 Q90 50 88 62 L88 70 Q88 55 60 52 Q32 55 32 70Z" fill={color} />;
    case 'mi-long':
      return <path id="hair-front" d="M32 62 Q30 50 38 42 Q45 36 60 34 Q75 36 82 42 Q90 50 88 62 L88 68 Q88 55 60 52 Q32 55 32 68Z" fill={color} />;
    case 'court':
      return <path id="hair-front" d="M34 62 Q32 50 40 43 Q47 37 60 35 Q73 37 80 43 Q88 50 86 62 L86 70 Q86 58 60 54 Q34 58 34 70Z" fill={color} />;
    case 'chignon':
      return <>
        <ellipse id="hair-front" cx={60} cy={28} rx={18} ry={14} fill={color} />
        <path d="M38 44 Q45 38 60 36 Q75 38 82 44 Q75 48 60 46 Q45 48 38 44Z" fill={color} />
      </>;
    case 'tresse':
      return <>
        <path id="hair-front" d="M38 44 Q45 36 60 34 Q75 36 82 44 Q75 48 60 46 Q45 48 38 44Z" fill={color} />
        <path d="M56 46 L54 56 L58 66 L54 76 L58 86" stroke={color} strokeWidth={3} fill="none" />
        <path d="M64 46 L66 56 L62 66 L66 76 L62 86" stroke={color} strokeWidth={3} fill="none" />
      </>;
    case 'queue-de-cheval':
      return <path id="hair-front" d="M40 44 Q47 37 60 35 Q73 37 80 44 Q73 48 60 46 Q47 48 40 44Z" fill={color} />;
    case 'afro':
      return <circle id="hair-front" cx={60} cy={50} r={40} fill={color} />;
    case 'avec-frange':
      return <>
        <path id="hair-front" d="M32 62 Q30 50 38 42 Q45 36 60 34 Q75 36 82 42 Q90 50 88 62 L88 70 Q88 55 60 52 Q32 55 32 70Z" fill={color} />
        <path d="M36 44 Q48 52 60 52 Q72 52 84 44 Q72 58 60 58 Q48 58 36 44Z" fill={color} />
      </>;
    default:
      return <path id="hair-front" d="M32 62 Q30 50 38 42 Q45 36 60 34 Q75 36 82 42 Q90 50 88 62 L88 70 Q88 55 60 52 Q32 55 32 70Z" fill={color} />;
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

  const eyeY = 66 + tombantDy / 2;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="rounded-full">
      <defs>
        <clipPath id="avatar-clip"><circle cx={60} cy={60} r={55} /></clipPath>
        {avatar.eyeShape === 'tombants' && (
          <>
            <clipPath id="clip-eye-l"><ellipse cx={eye.lcx} cy={eyeY} rx={eye.rx} ry={eye.ry} /></clipPath>
            <clipPath id="clip-eye-r"><ellipse cx={eye.rcx} cy={eyeY} rx={eye.rx} ry={eye.ry} /></clipPath>
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
      <ellipse cx={eye.lcx} cy={eyeY} rx={eye.rx} ry={eye.ry} fill="white" />
      <ellipse cx={eye.rcx} cy={eyeY} rx={eye.rx} ry={eye.ry} fill="white" />
      {avatar.eyeShape === 'tombants' && (
        <>
          <rect x={eye.lcx + 2} y={eyeY - 3} width={eye.rx} height={4} fill={tone.face} clipPath="url(#clip-eye-l)" />
          <rect x={eye.rcx + 2} y={eyeY - 3} width={eye.rx} height={4} fill={tone.face} clipPath="url(#clip-eye-r)" />
        </>
      )}
      <circle cx={eye.lcx} cy={eyeY} r={4.5} fill={eyeHex} />
      <circle cx={eye.rcx} cy={eyeY} r={4.5} fill={eyeHex} />
      <circle cx={eye.lcx} cy={eyeY} r={2} fill="#000" />
      <circle cx={eye.rcx} cy={eyeY} r={2} fill="#000" />
      <circle cx={eye.lcx + 1.2} cy={eyeY - 1.2} r={1.2} fill="white" />
      <circle cx={eye.rcx + 1.2} cy={eyeY - 1.2} r={1.2} fill="white" />
      {/* Eyelid arcs */}
      <path d={`M${eye.lcx - eye.rx} ${eyeY} Q${eye.lcx} ${eyeY - eye.ry - 2} ${eye.lcx + eye.rx} ${eyeY}`} stroke="#333" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <path d={`M${eye.rcx - eye.rx} ${eyeY} Q${eye.rcx} ${eyeY - eye.ry - 2} ${eye.rcx + eye.rx} ${eyeY}`} stroke="#333" strokeWidth={1.5} fill="none" strokeLinecap="round" />

      <path id="brow-l" d={brow.ld} stroke={browHex} strokeWidth={brow.sw} fill="none" strokeLinecap="round" />
      <path id="brow-r" d={brow.rd} stroke={browHex} strokeWidth={brow.sw} fill="none" strokeLinecap="round" />

      <path id="nose" d={nose.d} fill={tone.neck} />

      <path id="lips-top" d={lips.top} fill={lipsHex} />
      <path id="lips-bot" d={lips.bot} fill={lipsBotHex} />

      <g clipPath="url(#avatar-clip)">
        <HairFront style={avatar.hairStyle} color={hairHex} />
      </g>
    </svg>
  );
}
