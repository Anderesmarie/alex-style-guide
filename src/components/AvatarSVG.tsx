import { SKIN_COLORS, EYE_COLORS, HAIR_COLORS } from '@/lib/colorimetry';

export interface AvatarData {
  skin: string;
  eyeColor: string;
  hairStyle: string;
  hairColor: string;
}

interface Props {
  avatar: AvatarData;
  size?: number;
}

function lighten(hex: string, amount = 0.15): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function HairSVG({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'Court lisse':
      return <path d="M30 38 Q50 15 70 38 Q72 28 68 22 Q50 8 32 22 Q28 28 30 38Z" fill={color} />;
    case 'Court bouclé':
      return <>
        <path d="M28 40 Q50 12 72 40 Q74 26 68 18 Q50 4 32 18 Q26 26 28 40Z" fill={color} />
        <circle cx={32} cy={28} r={4} fill={color} /><circle cx={42} cy={20} r={4} fill={color} />
        <circle cx={58} cy={20} r={4} fill={color} /><circle cx={68} cy={28} r={4} fill={color} />
      </>;
    case 'Mi-long lisse':
      return <path d="M26 42 Q28 18 50 14 Q72 18 74 42 L76 58 Q74 62 70 58 L70 42 Q68 26 50 22 Q32 26 30 42 L30 58 Q26 62 24 58Z" fill={color} />;
    case 'Mi-long bouclé':
      return <>
        <path d="M26 42 Q28 18 50 14 Q72 18 74 42 L76 60 Q72 65 70 58 L70 42 Q68 26 50 22 Q32 26 30 42 L30 58 Q28 65 24 60Z" fill={color} />
        <circle cx={26} cy={52} r={5} fill={color} /><circle cx={74} cy={52} r={5} fill={color} />
      </>;
    case 'Long lisse':
      return <path d="M24 42 Q28 16 50 12 Q72 16 76 42 L78 75 Q76 80 72 75 L70 42 Q68 24 50 20 Q32 24 30 42 L28 75 Q24 80 22 75Z" fill={color} />;
    case 'Long bouclé':
      return <>
        <path d="M24 42 Q28 16 50 12 Q72 16 76 42 L78 78 Q74 82 72 76 L70 42 Q68 24 50 20 Q32 24 30 42 L28 76 Q26 82 22 78Z" fill={color} />
        <circle cx={24} cy={60} r={5} fill={color} /><circle cx={76} cy={60} r={5} fill={color} />
        <circle cx={22} cy={72} r={4} fill={color} /><circle cx={78} cy={72} r={4} fill={color} />
      </>;
    case 'Chignon':
      return <>
        <path d="M30 38 Q50 15 70 38 Q72 28 68 22 Q50 8 32 22 Q28 28 30 38Z" fill={color} />
        <circle cx={50} cy={16} r={10} fill={color} />
      </>;
    case 'Tresse':
      return <>
        <path d="M26 42 Q28 18 50 14 Q72 18 74 42 L74 48 Q72 50 70 48 L70 42 Q68 26 50 22 Q32 26 30 42 L30 48 Q28 50 26 48Z" fill={color} />
        <path d="M50 42 L52 52 L48 58 L52 64 L48 70 L52 76 L50 80 L48 76 L52 70 L48 64 L52 58 L48 52Z" fill={color} strokeWidth={2} />
      </>;
    default:
      return <path d="M30 38 Q50 15 70 38 Q72 28 68 22 Q50 8 32 22 Q28 28 30 38Z" fill={color} />;
  }
}

export default function AvatarSVG({ avatar, size = 120 }: Props) {
  const skinHex = SKIN_COLORS[avatar.skin] || '#F5CBA7';
  const faceHex = lighten(skinHex, 0.1);
  const eyeHex = EYE_COLORS[avatar.eyeColor] || '#5C3317';
  const hairHex = HAIR_COLORS[avatar.hairColor] || '#3B2F2F';
  const browHex = HAIR_COLORS[avatar.hairColor] || '#3B2F2F';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full">
      {/* Background circle */}
      <circle cx={50} cy={50} r={50} fill={skinHex} opacity={0.3} />
      
      {/* Neck + shoulders */}
      <rect x={42} y={72} width={16} height={12} rx={4} fill={faceHex} />
      <ellipse cx={50} cy={90} rx={30} ry={14} fill={faceHex} />
      
      {/* Face oval */}
      <ellipse cx={50} cy={48} rx={22} ry={26} fill={faceHex} />
      
      {/* Eyes */}
      <ellipse cx={40} cy={48} rx={3.5} ry={3} fill="white" />
      <ellipse cx={60} cy={48} rx={3.5} ry={3} fill="white" />
      <circle cx={40} cy={48} r={2} fill={eyeHex} />
      <circle cx={60} cy={48} r={2} fill={eyeHex} />
      <circle cx={40.5} cy={47.5} r={0.7} fill="white" />
      <circle cx={60.5} cy={47.5} r={0.7} fill="white" />
      
      {/* Eyebrows */}
      <path d="M35 42 Q40 39 45 42" stroke={browHex} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <path d="M55 42 Q60 39 65 42" stroke={browHex} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      
      {/* Nose */}
      <path d="M50 50 Q48 56 50 57 Q52 56 50 50" stroke={skinHex} strokeWidth={1} fill="none" />
      
      {/* Mouth */}
      <path d="M44 62 Q50 67 56 62" stroke="#C9956C" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      
      {/* Hair (on top) */}
      <HairSVG style={avatar.hairStyle} color={hairHex} />
    </svg>
  );
}
