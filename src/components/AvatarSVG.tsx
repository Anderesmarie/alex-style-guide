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
  const eyeHex = avatar.eyeColor || '#7B4F2E';
  const browHex = avatar.browColor || '#6B4226';
  const lipsHex = avatar.lipsColor || '#D4756A';
  const hairHex = HAIR_COLORS[avatar.hairColor] || avatar.hairColor || '#3B1F0A';

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
      <ellipse cx={48} cy={66} rx={4.2} ry={3.6} fill="white" />
      <ellipse cx={72} cy={66} rx={4.2} ry={3.6} fill="white" />
      <circle cx={48} cy={66} r={2.4} fill={eyeHex} />
      <circle cx={72} cy={66} r={2.4} fill={eyeHex} />
      <circle cx={48.6} cy={65.4} r={0.8} fill="white" />
      <circle cx={72.6} cy={65.4} r={0.8} fill="white" />

      {/* Eyebrows */}
      <path d="M42 58 Q48 54 54 58" stroke={browHex} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M66 58 Q72 54 78 58" stroke={browHex} strokeWidth={1.8} fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path id="nose" d="M60 68 Q58 74 60 76 Q62 74 60 68" stroke={tone.neck} strokeWidth={1.2} fill="none" />

      {/* Mouth */}
      <path d="M52 82 Q60 88 68 82" stroke={lipsHex} strokeWidth={1.8} fill="none" strokeLinecap="round" />

      {/* Hair */}
      <HairSVG style={avatar.hairStyle} color={hairHex} />
    </svg>
  );
}
