import { useRef, useState } from 'react';
import { DndContext, useDraggable, DragEndEvent, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ClothingItem, OutfitLayoutPiece } from '@/lib/types';
import { getCategoryByType } from '@/lib/categories';

export const CANVAS_W = 360;
export const CANVAS_H = 500;

export type ChipKey = 'top' | 'bottom' | 'jacket' | 'shoes' | 'bag' | 'jewelry' | 'other';

export const CHIPS: { key: ChipKey; label: string; matches: string[] }[] = [
  { key: 'top', label: 'Haut', matches: ['Hauts', 'Pulls & sweats', 'Robes & combinaisons'] },
  { key: 'bottom', label: 'Bas', matches: ['Bas', 'Jupes'] },
  { key: 'jacket', label: 'Veste', matches: ['Manteaux & vestes'] },
  { key: 'shoes', label: 'Chaussures', matches: ['Chaussures'] },
  { key: 'bag', label: 'Sac', matches: ['Sacs'] },
  { key: 'jewelry', label: 'Bijoux', matches: ['Accessoires'] },
  { key: 'other', label: 'Autre', matches: [] },
];

export function defaultPositionForCategory(catName: string): { xPct: number; yPct: number; size: number; z: number } {
  // x/y = top-left in % of canvas
  if (catName === 'Manteaux & vestes') return { xPct: 5, yPct: 18, size: 170, z: 2 };
  if (catName === 'Hauts' || catName === 'Pulls & sweats') return { xPct: 35, yPct: 12, size: 140, z: 3 };
  if (catName === 'Robes & combinaisons') return { xPct: 28, yPct: 14, size: 180, z: 3 };
  if (catName === 'Bas' || catName === 'Jupes') return { xPct: 33, yPct: 42, size: 150, z: 2 };
  if (catName === 'Chaussures') return { xPct: 38, yPct: 76, size: 110, z: 2 };
  if (catName === 'Sacs') return { xPct: 70, yPct: 70, size: 80, z: 4 };
  if (catName === 'Accessoires') return { xPct: 75, yPct: 6, size: 50, z: 5 };
  return { xPct: 40, yPct: 40, size: 100, z: 1 };
}

interface CanvasPiece extends OutfitLayoutPiece {
  item: ClothingItem;
}

interface DraggablePieceProps {
  piece: CanvasPiece;
  selected: boolean;
  onSelect: () => void;
}

function DraggablePiece({ piece, selected, onSelect }: DraggablePieceProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: piece.itemId });
  const px = (piece.x / 100) * CANVAS_W;
  const py = (piece.y / 100) * CANVAS_H;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: px,
        top: py,
        width: piece.size,
        zIndex: piece.z + (selected ? 50 : 0),
        transform: CSS.Translate.toString(transform),
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        outline: selected ? '2px solid #C9956C' : 'none',
        outlineOffset: 4,
        borderRadius: 8,
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))',
        userSelect: 'none',
      }}
    >
      <img
        src={piece.item.imageBase64}
        alt={piece.item.type}
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
      />
    </div>
  );
}

interface Props {
  pieces: CanvasPiece[];
  onChange: (pieces: CanvasPiece[]) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

export default function OutfitFreeCanvas({ pieces, onChange, selectedId, onSelectId }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };
  const unlockScroll = () => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };

  const handleDragStart = (_e: DragStartEvent) => {
    lockScroll();
  };

  const handleDragEnd = (e: DragEndEvent) => {
    unlockScroll();
    const { active, delta } = e;
    onChange(pieces.map(p => {
      if (p.itemId !== active.id) return p;
      const newX = (p.x / 100) * CANVAS_W + delta.x;
      const newY = (p.y / 100) * CANVAS_H + delta.y;
      const clampedX = Math.max(0, Math.min(CANVAS_W - 20, newX));
      const clampedY = Math.max(0, Math.min(CANVAS_H - 20, newY));
      return { ...p, x: (clampedX / CANVAS_W) * 100, y: (clampedY / CANVAS_H) * 100 };
    }));
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={unlockScroll}>
      <div
        ref={containerRef}
        onClick={() => onSelectId(null)}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: CANVAS_W,
          height: CANVAS_H,
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {pieces.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Tape une catégorie pour ajouter une pièce ✨
          </div>
        )}
        {pieces.map(p => (
          <DraggablePiece
            key={p.itemId}
            piece={p}
            selected={selectedId === p.itemId}
            onSelect={() => onSelectId(p.itemId)}
          />
        ))}
      </div>
    </DndContext>
  );
}

export function chipMatchesItem(chip: ChipKey, item: ClothingItem): boolean {
  const cat = getCategoryByType(item.type)?.name || item.category || '';
  const all = CHIPS.flatMap(c => c.matches);
  if (chip === 'other') return !all.includes(cat);
  const target = CHIPS.find(c => c.key === chip);
  return !!target && target.matches.includes(cat);
}
