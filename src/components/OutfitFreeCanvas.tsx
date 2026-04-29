import { useRef, useEffect, useState, useCallback } from 'react';
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

interface Props {
  pieces: CanvasPiece[];
  onChange: (pieces: CanvasPiece[]) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

interface DragState {
  itemId: string;
  startClientX: number;
  startClientY: number;
  startX: number; // px on canvas
  startY: number; // px on canvas
}

export default function OutfitFreeCanvas({ pieces, onChange, selectedId, onSelectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  // live offset during drag (px)
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };
  const unlockScroll = () => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };

  const endDrag = useCallback((commit: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (commit) {
      const finalX = drag.startX + dragOffsetRef.current.dx;
      const finalY = drag.startY + dragOffsetRef.current.dy;
      const clampedX = Math.max(0, Math.min(CANVAS_W - 20, finalX));
      const clampedY = Math.max(0, Math.min(CANVAS_H - 20, finalY));
      onChange(pieces.map(p =>
        p.itemId === drag.itemId
          ? { ...p, x: (clampedX / CANVAS_W) * 100, y: (clampedY / CANVAS_H) * 100 }
          : p
      ));
    }
    dragRef.current = null;
    dragOffsetRef.current = { dx: 0, dy: 0 };
    setDragId(null);
    setDragOffset({ dx: 0, dy: 0 });
    unlockScroll();
  }, [pieces, onChange]);

  // ref mirror to avoid stale state in window handlers
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!dragId) return;

    const onMove = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = clientX - drag.startClientX;
      const dy = clientY - drag.startClientY;
      dragOffsetRef.current = { dx, dy };
      setDragOffset({ dx, dy });
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      onMove(e.clientX, e.clientY);
    };
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      endDrag(true);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      endDrag(true);
    };
    const handleTouchCancel = () => endDrag(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [dragId, endDrag]);

  const startDrag = (piece: CanvasPiece, clientX: number, clientY: number) => {
    const startX = (piece.x / 100) * CANVAS_W;
    const startY = (piece.y / 100) * CANVAS_H;
    dragRef.current = {
      itemId: piece.itemId,
      startClientX: clientX,
      startClientY: clientY,
      startX,
      startY,
    };
    dragOffsetRef.current = { dx: 0, dy: 0 };
    setDragId(piece.itemId);
    setDragOffset({ dx: 0, dy: 0 });
    onSelectId(piece.itemId);
    lockScroll();
  };

  return (
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
      {pieces.map(p => {
        const isDragging = dragId === p.itemId;
        const baseX = (p.x / 100) * CANVAS_W;
        const baseY = (p.y / 100) * CANVAS_H;
        const left = isDragging ? baseX + dragOffset.dx : baseX;
        const top = isDragging ? baseY + dragOffset.dy : baseY;
        const selected = selectedId === p.itemId;

        return (
          <div
            key={p.itemId}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              startDrag(p, e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              if (e.touches.length === 0) return;
              startDrag(p, e.touches[0].clientX, e.touches[0].clientY);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectId(p.itemId);
            }}
            style={{
              position: 'absolute',
              left: `${left}px`,
              top: `${top}px`,
              width: p.size,
              zIndex: p.z + (selected || isDragging ? 50 : 0),
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              outline: selected ? '2px solid #C9956C' : 'none',
              outlineOffset: 4,
              borderRadius: 8,
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.10))',
            }}
          >
            <img
              src={p.item.imageBase64}
              alt={p.item.type}
              draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function chipMatchesItem(chip: ChipKey, item: ClothingItem): boolean {
  const cat = getCategoryByType(item.type)?.name || item.category || '';
  const all = CHIPS.flatMap(c => c.matches);
  if (chip === 'other') return !all.includes(cat);
  const target = CHIPS.find(c => c.key === chip);
  return !!target && target.matches.includes(cat);
}
