import { useState, useEffect } from 'react';
import { ClothingItem, Outfit } from '@/lib/types';
import { getWardrobe, getOutfits, addOutfit, deleteOutfit, genId } from '@/lib/storage';
import { generateRecommendations } from '@/lib/recommendations';

type View = 'gallery' | 'create' | 'detail';

export default function Outfits() {
  const [view, setView] = useState<View>('gallery');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [outfitName, setOutfitName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Outfit | null>(null);

  const loadData = async () => {
    const [w, o] = await Promise.all([getWardrobe(), getOutfits()]);
    setWardrobe(w);
    setOutfits(o);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 5) next.add(id);
    setSelectedIds(next);
  };

  const handleSave = async () => {
    if (selectedIds.size < 2 || !outfitName.trim()) return;
    await addOutfit({
      id: genId(),
      name: outfitName.trim(),
      itemIds: Array.from(selectedIds),
      createdAt: new Date().toISOString(),
    });
    const o = await getOutfits();
    setOutfits(o);
    setSelectedIds(new Set());
    setOutfitName('');
    setView('gallery');
  };

  const confirmDeleteOutfit = async () => {
    if (!deleteConfirm) return;
    await deleteOutfit(deleteConfirm.id);
    const o = await getOutfits();
    setOutfits(o);
    setDeleteConfirm(null);
    setView('gallery');
  };

  const handleGenerate = async () => {
    const recs = await generateRecommendations(wardrobe, null, 1);
    if (recs.length > 0) {
      setSelectedIds(new Set(recs[0].map(i => i.id)));
    }
  };

  const getItemsByIds = (ids: string[]): ClothingItem[] =>
    ids.map(id => wardrobe.find(i => i.id === id)).filter(Boolean) as ClothingItem[];

  // Delete confirmation dialog
  const renderDeleteDialog = () => {
    if (!deleteConfirm) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        <div
          className="relative bg-card rounded-2xl p-6 w-full max-w-sm card-shadow animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="font-serif font-bold text-lg mb-1">Supprimer cette tenue ?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Les vêtements qui la composent resteront dans ton dressing
          </p>

          <button
            onClick={confirmDeleteOutfit}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-destructive/15 text-destructive active:scale-[0.98] transition-transform mb-2"
          >
            Supprimer la tenue
          </button>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground active:scale-[0.98] transition-transform"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fade-enter pb-4">
        <div className="h-8 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="h-12 w-full rounded-xl bg-muted animate-pulse mb-5" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (view === 'create') {
    const selected = getItemsByIds(Array.from(selectedIds));
    return (
      <div className="fade-enter pb-4 no-scrollbar overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setSelectedIds(new Set()); setView('gallery'); }} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">Créer une tenue</h1>
        </div>

        {/* Selected preview */}
        {selected.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {selected.map(item => (
              <img key={item.id} src={item.imageBase64} alt={item.type}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 ring-2 ring-primary" />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-3">
          Sélectionne 2 à 5 pièces ({selectedIds.size}/5)
        </p>

        <button onClick={handleGenerate}
          className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm mb-4 active:scale-[0.98] transition-transform">
          ✨ Générer pour aujourd'hui
        </button>

        {/* Wardrobe grid for selection */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {wardrobe.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`aspect-square rounded-lg overflow-hidden relative active:scale-[0.96] transition-transform ${
                selectedIds.has(item.id) ? 'ring-3 ring-primary' : ''
              }`}
            >
              <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
              {selectedIds.has(item.id) && (
                <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedIds.size >= 2 && (
          <>
            <input
              type="text"
              value={outfitName}
              onChange={e => setOutfitName(e.target.value)}
              placeholder="Nom de la tenue (ex: Bureau lundi)"
              className="w-full px-4 py-3 rounded-lg bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <button
              onClick={handleSave}
              disabled={!outfitName.trim()}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                outfitName.trim()
                  ? 'bg-primary text-primary-foreground shadow-lg active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Sauvegarder la tenue
            </button>
          </>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedOutfit) {
    const items = getItemsByIds(selectedOutfit.itemIds);
    return (
      <div className="fade-enter pb-4">
        {renderDeleteDialog()}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('gallery')} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">{selectedOutfit.name}</h1>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg overflow-hidden card-shadow">
              <img src={item.imageBase64} alt={item.type} className="w-full aspect-square object-cover" />
              <div className="p-2 bg-card">
                <p className="text-xs font-medium">{item.type}</p>
                <p className="text-xs text-muted-foreground">{item.color}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Créée le {new Date(selectedOutfit.createdAt).toLocaleDateString('fr-FR')}
        </p>
        <button
          onClick={() => setDeleteConfirm(selectedOutfit)}
          className="w-full py-3 rounded-xl bg-destructive/15 text-destructive font-semibold active:scale-[0.98] transition-transform"
        >
          Supprimer cette tenue
        </button>
      </div>
    );
  }

  // Gallery
  return (
    <div className="fade-enter pb-4">
      {renderDeleteDialog()}
      <h1 className="text-2xl font-serif font-bold mb-4">Mes Tenues</h1>

      <button
        onClick={() => setView('create')}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold mb-5 active:scale-[0.98] transition-transform shadow-lg"
      >
        + Créer une tenue
      </button>

      {outfits.length > 0 ? (
        <div className="space-y-3">
          {outfits.map(outfit => {
            const items = getItemsByIds(outfit.itemIds);
            return (
              <button
                key={outfit.id}
                onClick={() => { setSelectedOutfit(outfit); setView('detail'); }}
                className="w-full bg-card rounded-xl p-4 card-shadow text-left active:scale-[0.98] transition-transform"
              >
                <p className="font-serif font-semibold mb-2">{outfit.name}</p>
                <div className="flex gap-1.5">
                  {items.slice(0, 4).map(item => (
                    <img key={item.id} src={item.imageBase64} alt={item.type}
                      className="w-12 h-12 rounded-md object-cover" />
                  ))}
                  {items.length > 4 && (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{items.length - 4}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-serif text-lg">Aucune tenue créée</p>
          <p className="text-sm mt-1">Compose ta première tenue !</p>
        </div>
      )}
    </div>
  );
}
