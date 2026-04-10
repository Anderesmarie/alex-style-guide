import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'mystyl_photo_guide_seen';

export default function PhotoGuide() {
  const [open, setOpen] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setMaxH(contentRef.current.scrollHeight);
    }
  }, [open]);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 mb-2 cursor-pointer bg-transparent border-none p-0"
        style={{ color: 'hsl(var(--primary))', fontSize: 13, fontWeight: 600 }}
      >
        📸 Conseils pour une belle photo {open ? '▲' : '▼'}
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: open ? maxH || 500 : 0,
          overflow: 'hidden',
          transition: 'max-height 300ms ease',
        }}
      >
        <div
          className="rounded-lg mb-3"
          style={{
            backgroundColor: 'hsl(var(--muted))',
            borderLeft: '3px solid hsl(var(--primary))',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div className="flex flex-col gap-1" style={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            <span style={{ color: '#2E7D32' }}>✅ Fond uni ou neutre — sol, mur blanc ou beige</span>
            <span style={{ color: '#2E7D32' }}>✅ Lumière naturelle — près d'une fenêtre, pas de flash</span>
            <span style={{ color: '#2E7D32' }}>✅ Vêtement à plat — étale-le pour voir sa forme entière</span>
            <span style={{ color: '#2E7D32' }}>✅ Cadrage carré — centre le vêtement, laisse un peu de bord</span>
            <span style={{ color: '#C62828' }}>❌ Évite les photos floues ou sombres</span>
            <span style={{ color: '#C62828' }}>❌ Évite les fonds chargés ou très colorés</span>
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={handleDismiss}
              className="bg-transparent border-none cursor-pointer p-0"
              style={{ color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600 }}
            >
              J'ai compris ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
