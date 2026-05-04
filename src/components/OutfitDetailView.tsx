import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ClothingItem, Outfit, OutfitLayoutData } from '@/lib/types';
import OutfitLayout, { OutfitLayoutProps } from '@/components/OutfitLayout';
import { setOutfitLayoutData } from '@/lib/storage';

interface Props {
  outfit: Outfit;
  layoutProps: OutfitLayoutProps;
  items: ClothingItem[];
  onBack: () => void;
  onDelete: () => void;
  renderDeleteDialog: () => React.ReactNode;
}

export default function OutfitDetailView({
  outfit,
  layoutProps,
  items,
  onBack,
  onDelete,
  renderDeleteDialog,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<OutfitLayoutData | null>(null);

  const handleLayoutChange = (data: OutfitLayoutData) => {
    latestRef.current = data;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (latestRef.current) {
        setOutfitLayoutData(outfit.id, latestRef.current).catch(e =>
          console.error('Save layout failed', e)
        );
      }
    }, 1000);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (latestRef.current) {
      setOutfitLayoutData(outfit.id, latestRef.current).catch(() => {});
    }
  }, [outfit.id]);

  return (
    <div className="fade-enter pb-4">
      {renderDeleteDialog()}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-2xl">←</button>
        <h1 className="text-xl font-serif font-bold">{outfit.name}</h1>
      </div>

      <OutfitLayout
        {...layoutProps}
        readOnly={false}
        initialLayoutData={outfit.layoutData ?? null}
        onLayoutChange={handleLayoutChange}
      />

      <p className="text-xs text-muted-foreground text-center mt-2 mb-4">
        Glisse les pièces pour les arranger ✨
      </p>

      <button
        onClick={() => {
          if (latestRef.current) {
            setOutfitLayoutData(outfit.id, latestRef.current).catch(() => {});
          }
          toast('Placement sauvegardé ✨');
        }}
        className="w-full py-3 rounded-xl font-semibold text-white active:scale-[0.98] transition-transform mb-3"
        style={{ backgroundColor: '#C9956C' }}
      >
        ✅ Valider le placement
      </button>

      <p className="text-sm text-muted-foreground mb-4">
        Créée le {new Date(outfit.createdAt).toLocaleDateString('fr-FR')}
      </p>
      <button
        onClick={onDelete}
        className="w-full py-3 rounded-xl bg-destructive/15 text-destructive font-semibold active:scale-[0.98] transition-transform"
      >
        Supprimer cette tenue
      </button>
    </div>
  );
}
