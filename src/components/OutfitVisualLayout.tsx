import { ClothingItem } from '@/lib/types';

export type SlotKey = 'outerwear' | 'top' | 'topAlt' | 'bottom' | 'shoes' | 'bag';

export const SLOT_CONFIG: Record<SlotKey, { label: string; icon: string; categories: string[]; pinned?: boolean }> = {
  outerwear: { label: 'Veste', icon: '🧥', categories: ['Manteaux & vestes'] },
  top: { label: 'Haut', icon: '👕', categories: ['Hauts', 'Pulls & sweats', 'Robes & combinaisons'], pinned: true },
  topAlt: { label: 'Alt.', icon: '👚', categories: ['Hauts', 'Pulls & sweats'] },
  bottom: { label: 'Bas', icon: '👖', categories: ['Bas', 'Jupes'] },
  shoes: { label: 'Chaussures', icon: '👟', categories: ['Chaussures'] },
  bag: { label: 'Sac', icon: '👜', categories: ['Sacs', 'Accessoires'] },
};

export type SlotMap = Partial<Record<SlotKey, ClothingItem>>;

interface SlotCellProps {
  slotKey: SlotKey;
  item?: ClothingItem;
  onTap: (slot: SlotKey) => void;
  size?: 'normal' | 'mini';
}

function SlotCell({ slotKey, item, onTap, size = 'normal' }: SlotCellProps) {
  const cfg = SLOT_CONFIG[slotKey];
  const isMini = size === 'mini';
  const base = isMini
    ? 'aspect-square rounded-md bg-muted/40 flex items-center justify-center overflow-hidden'
    : 'aspect-square rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden relative active:scale-[0.97] transition-transform';

  if (item) {
    return (
      <button
        type="button"
        onClick={() => !isMini && onTap(slotKey)}
        className={base}
        disabled={isMini}
      >
        <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
        {!isMini && cfg.pinned && (
          <div className="absolute top-1 right-1 text-xs">📌</div>
        )}
      </button>
    );
  }

  if (isMini) {
    return (
      <div className={base}>
        <span className="text-xs opacity-30">{cfg.icon}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onTap(slotKey)}
      className={`${base} border border-dashed border-border`}
    >
      <span className="text-3xl opacity-25">{cfg.icon}</span>
      <div
        className="absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
        style={{ backgroundColor: '#C9956C' }}
      >
        +
      </div>
    </button>
  );
}

interface OutfitVisualLayoutProps {
  slots: SlotMap;
  onSlotTap?: (slot: SlotKey) => void;
  size?: 'normal' | 'mini';
  /** When true, only filled slots are rendered (no empty placeholders). */
  compact?: boolean;
}

export default function OutfitVisualLayout({ slots, onSlotTap, size = 'normal', compact = false }: OutfitVisualLayoutProps) {
  const handleTap = onSlotTap || (() => {});
  const isMini = size === 'mini';
  const gap = isMini ? 'gap-1' : 'gap-2';
  const padding = isMini ? 'p-2' : 'p-4';
  const radius = isMini ? 'rounded-lg' : 'rounded-2xl';

  if (compact) {
    const order: SlotKey[] = ['outerwear', 'top', 'topAlt', 'bottom', 'shoes', 'bag'];
    const filled = order.filter((k) => slots[k]);
    if (filled.length === 0) {
      return (
        <div className={`bg-white ${radius} ${padding} ${isMini ? '' : 'shadow-sm'} aspect-square`} />
      );
    }
    const cols = filled.length === 1 ? 1 : 2;
    return (
      <div className={`bg-white ${radius} ${padding} ${isMini ? '' : 'shadow-sm'}`}>
        <div className={`grid ${gap}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {filled.map((k) => (
            <SlotCell key={k} slotKey={k} item={slots[k]} onTap={handleTap} size={size} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${radius} ${padding} ${isMini ? '' : 'shadow-sm'}`}>
      {/* Row 1: outerwear / top / topAlt */}
      <div className={`grid grid-cols-3 ${gap} mb-${isMini ? '1' : '2'}`}>
        <SlotCell slotKey="outerwear" item={slots.outerwear} onTap={handleTap} size={size} />
        <SlotCell slotKey="top" item={slots.top} onTap={handleTap} size={size} />
        <SlotCell slotKey="topAlt" item={slots.topAlt} onTap={handleTap} size={size} />
      </div>
      {/* Row 2: bottom centered */}
      <div className={`grid grid-cols-3 ${gap} mb-${isMini ? '1' : '2'}`}>
        <div />
        <SlotCell slotKey="bottom" item={slots.bottom} onTap={handleTap} size={size} />
        <div />
      </div>
      {/* Row 3: shoes / empty / bag */}
      <div className={`grid grid-cols-3 ${gap}`}>
        <SlotCell slotKey="shoes" item={slots.shoes} onTap={handleTap} size={size} />
        <div />
        <SlotCell slotKey="bag" item={slots.bag} onTap={handleTap} size={size} />
      </div>
    </div>
  );
}
