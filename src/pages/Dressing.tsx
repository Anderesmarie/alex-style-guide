import { useState, useEffect, useRef, useMemo } from 'react';
import { ClothingItem, COLORS, SEASONS, STYLES, OCCASIONS } from '@/lib/types';
import { getWardrobe, addClothing, updateClothing, deleteClothing, getOutfits, saveOutfits, genId } from '@/lib/storage';
import { CATEGORIES } from '@/lib/categories';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

type View = 'grid' | 'add' | 'detail' | 'edit';

const DELETE_REASONS = [
  { emoji: '📏', label: 'Trop petit / trop grand' },
  { emoji: '💔', label: 'Je ne l\'aime plus' },
  { emoji: '🎁', label: 'Donné' },
  { emoji: '💸', label: 'Vendu' },
  { emoji: '🗑️', label: 'Autre' },
];

export default function Dressing() {
  const [view, setView] = useState<View>('grid');
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSeason, setFilterSeason] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [deleteDialogItem, setDeleteDialogItem] = useState<ClothingItem | null>(null);
  const [deleteReason, setDeleteReason] = useState<string | null>(null);

  // Form state
  const [imageBase64, setImageBase64] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [season, setSeason] = useState<string[]>([]);
  const [style, setStyle] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');

  const loadWardrobe = async () => {
    const w = await getWardrobe();
    setWardrobe(w);
    setLoading(false);
  };

  useEffect(() => { loadWardrobe(); }, []);

  const resetForm = () => {
    setImageBase64(''); setCategory(''); setSubcategory(''); setType(''); setColor(''); setCustomColor('');
    setSeason([]); setStyle([]); setOccasion([]); setBrand(''); setPrice('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImageBase64(compressed);
  };

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSave = async () => {
    if (!imageBase64 || !type || !category) return;
    const finalColor = color || customColor || 'Autre';
    const item: ClothingItem = {
      id: genId(), imageBase64, category, subcategory, type, color: finalColor,
      season: season.length ? season : ['Toutes saisons'],
      style: style.length ? style : ['Casual'],
      occasion: occasion.length ? occasion : ['Quotidien'],
      brand: brand || undefined,
      price: price ? Number(price) : undefined,
    };
    await addClothing(item);
    await loadWardrobe();
    resetForm();
    setView('grid');
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    const finalColor = color || customColor || selectedItem.color;
    const updated: ClothingItem = {
      ...selectedItem, category: category || selectedItem.category,
      subcategory: subcategory || selectedItem.subcategory,
      type, color: finalColor,
      season: season.length ? season : selectedItem.season,
      style: style.length ? style : selectedItem.style,
      occasion: occasion.length ? occasion : selectedItem.occasion,
      brand: brand || selectedItem.brand,
      price: price ? Number(price) : selectedItem.price,
      imageBase64: imageBase64 || selectedItem.imageBase64,
    };
    await updateClothing(updated);
    await loadWardrobe();
    resetForm();
    setView('grid');
  };

  const openDeleteDialog = (item: ClothingItem) => {
    setDeleteDialogItem(item);
    setDeleteReason(null);
  };

  const confirmDelete = async () => {
    if (!deleteDialogItem || !deleteReason) return;
    const itemId = deleteDialogItem.id;

    // Store deletion reason
    try {
      const history = JSON.parse(localStorage.getItem('mystyl_deletion_history') || '[]');
      history.push({
        itemId,
        type: deleteDialogItem.type,
        color: deleteDialogItem.color,
        reason: deleteReason,
        date: new Date().toISOString(),
      });
      localStorage.setItem('mystyl_deletion_history', JSON.stringify(history));
    } catch {}

    // Delete clothing
    await deleteClothing(itemId);

    // Cascade: clean up outfits
    const outfits = await getOutfits();
    const updatedOutfits = outfits.map(o => ({
      ...o,
      itemIds: o.itemIds.filter(id => id !== itemId),
    }));

    const removedOutfitNames: string[] = [];
    const keptOutfits = updatedOutfits.filter(o => {
      if (o.itemIds.length < 2) {
        removedOutfitNames.push(o.name);
        return false;
      }
      return true;
    });

    await saveOutfits(keptOutfits);

    // Show toasts for removed outfits
    removedOutfitNames.forEach(name => {
      toast.info(`La tenue "${name}" a été supprimée car elle contenait ce vêtement`);
    });

    await loadWardrobe();
    setDeleteDialogItem(null);
    setDeleteReason(null);
    setView('grid');
  };

  const openEdit = (item: ClothingItem) => {
    setSelectedItem(item);
    setImageBase64(item.imageBase64);
    setCategory(item.category || '');
    setSubcategory(item.subcategory || '');
    setType(item.type);
    setColor(item.color);
    setSeason([...item.season]);
    setStyle([...item.style]);
    setOccasion([...item.occasion]);
    setBrand(item.brand || '');
    setPrice(item.price?.toString() || '');
    setView('edit');
  };

  const filtered = wardrobe.filter(i => {
    if (filterType && i.type !== filterType) return false;
    if (filterColor && i.color !== filterColor) return false;
    if (filterSeason && !i.season.includes(filterSeason)) return false;
    return true;
  });

  // Delete confirmation dialog
  const renderDeleteDialog = () => {
    if (!deleteDialogItem) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteDialogItem(null)}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        <div
          className="relative bg-card rounded-2xl p-6 w-full max-w-sm card-shadow animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="font-serif font-bold text-lg mb-1">Pourquoi tu supprimes cette pièce ?</h3>
          <p className="text-sm text-muted-foreground mb-4">{deleteDialogItem.type} · {deleteDialogItem.color}</p>

          <div className="space-y-2 mb-6">
            {DELETE_REASONS.map(r => (
              <button
                key={r.label}
                onClick={() => setDeleteReason(r.label)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  deleteReason === r.label
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-secondary border-2 border-transparent'
                }`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={confirmDelete}
            disabled={!deleteReason}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-2 ${
              deleteReason
                ? 'bg-destructive/15 text-destructive active:scale-[0.98]'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Confirmer la suppression
          </button>
          <button
            onClick={() => setDeleteDialogItem(null)}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground active:scale-[0.98] transition-transform"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  };

  // Form JSX (shared between add and edit)
  const renderForm = (isEdit: boolean) => (
    <div className="fade-enter no-scrollbar overflow-y-auto pb-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { resetForm(); setView('grid'); }} className="text-2xl">←</button>
        <h1 className="text-xl font-serif font-bold">{isEdit ? 'Modifier' : 'Ajouter un vêtement'}</h1>
      </div>

      {!imageBase64 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 bg-card card-shadow mb-5"
        >
          <span className="text-4xl">📸</span>
          <span className="text-muted-foreground text-sm">Ajouter une photo</span>
        </button>
      ) : (
        <div className="relative mb-5">
          <img src={imageBase64} alt="" className="w-full aspect-square object-cover rounded-xl card-shadow" />
          <button
            onClick={() => { setImageBase64(''); fileRef.current?.click(); }}
            className="absolute top-2 right-2 bg-card/80 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Type */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Type</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} className={`chip text-xs ${type === t ? 'chip-active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Color */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Couleur</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); setCustomColor(''); }} className={`chip text-xs ${color === c ? 'chip-active' : ''}`}>{c}</button>
        ))}
      </div>
      <input
        type="text"
        value={customColor}
        onChange={e => { setCustomColor(e.target.value); setColor(''); }}
        placeholder="Autre couleur..."
        className="w-full px-3 py-2 rounded-lg bg-card card-shadow text-sm outline-none focus:ring-2 focus:ring-primary/30 mb-4"
      />

      {/* Season */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Saison</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {SEASONS.map(s => (
          <button key={s} onClick={() => toggle(season, s, setSeason)} className={`chip text-xs ${season.includes(s) ? 'chip-active' : ''}`}>{s}</button>
        ))}
      </div>

      {/* Style */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Style</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {STYLES.map(s => (
          <button key={s} onClick={() => toggle(style, s, setStyle)} className={`chip text-xs ${style.includes(s) ? 'chip-active' : ''}`}>{s}</button>
        ))}
      </div>

      {/* Occasion */}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Occasion</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {OCCASIONS.map(o => (
          <button key={o} onClick={() => toggle(occasion, o, setOccasion)} className={`chip text-xs ${occasion.includes(o) ? 'chip-active' : ''}`}>{o}</button>
        ))}
      </div>

      {/* Brand & Price */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-1 block">Marque</label>
          <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Optionnel"
            className="w-full px-3 py-2 rounded-lg bg-card card-shadow text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-1 block">Prix (€)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Optionnel"
            className="w-full px-3 py-2 rounded-lg bg-card card-shadow text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <button
        onClick={isEdit ? handleUpdate : handleSave}
        disabled={!imageBase64 || !type}
        className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
          imageBase64 && type
            ? 'bg-primary text-primary-foreground shadow-lg active:scale-[0.98]'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isEdit ? 'Enregistrer les modifications' : 'Ajouter au dressing'}
      </button>
    </div>
  );

  if (view === 'add' || view === 'edit') return renderForm(view === 'edit');

  if (view === 'detail' && selectedItem) return (
    <div className="fade-enter pb-4">
      {renderDeleteDialog()}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('grid')} className="text-2xl">←</button>
        <h1 className="text-xl font-serif font-bold">{selectedItem.type}</h1>
      </div>
      <img src={selectedItem.imageBase64} alt="" className="w-full aspect-square object-cover rounded-xl card-shadow mb-4" />
      <div className="space-y-3">
        <div><span className="text-sm text-muted-foreground">Couleur :</span> <span className="font-medium">{selectedItem.color}</span></div>
        <div><span className="text-sm text-muted-foreground">Saison :</span> <span className="font-medium">{selectedItem.season.join(', ')}</span></div>
        <div><span className="text-sm text-muted-foreground">Style :</span> <span className="font-medium">{selectedItem.style.join(', ')}</span></div>
        <div><span className="text-sm text-muted-foreground">Occasion :</span> <span className="font-medium">{selectedItem.occasion.join(', ')}</span></div>
        {selectedItem.brand && <div><span className="text-sm text-muted-foreground">Marque :</span> <span className="font-medium">{selectedItem.brand}</span></div>}
        {selectedItem.price && <div><span className="text-sm text-muted-foreground">Prix :</span> <span className="font-medium">{selectedItem.price}€</span></div>}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => openEdit(selectedItem)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform">
          Modifier
        </button>
        <button onClick={() => openDeleteDialog(selectedItem)} className="py-3 px-6 rounded-xl bg-destructive/15 text-destructive font-semibold active:scale-[0.98] transition-transform">
          Supprimer
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fade-enter pb-4">
        <div className="h-8 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="h-12 w-full rounded-xl bg-muted animate-pulse mb-5" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="fade-enter pb-4">
      {renderDeleteDialog()}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif font-bold">Mon Dressing</h1>
        <span className="text-sm text-muted-foreground">{wardrobe.length} pièce{wardrobe.length !== 1 ? 's' : ''}</span>
      </div>

      <button
        onClick={() => { resetForm(); setView('add'); }}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold mb-5 active:scale-[0.98] transition-transform shadow-lg"
      >
        + Ajouter un vêtement
      </button>

      {/* Filters */}
      {wardrobe.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-full bg-card card-shadow text-sm outline-none">
            <option value="">Type</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterColor} onChange={e => setFilterColor(e.target.value)}
            className="px-3 py-1.5 rounded-full bg-card card-shadow text-sm outline-none">
            <option value="">Couleur</option>
            {COLORS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterSeason} onChange={e => setFilterSeason(e.target.value)}
            className="px-3 py-1.5 rounded-full bg-card card-shadow text-sm outline-none">
            <option value="">Saison</option>
            {SEASONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => { setSelectedItem(item); setView('detail'); }}
              className="aspect-square rounded-lg overflow-hidden card-shadow active:scale-[0.96] transition-transform"
            >
              <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">👗</p>
          <p className="font-serif text-lg">Ton dressing est vide</p>
          <p className="text-sm mt-1">Ajoute tes premières pièces !</p>
        </div>
      )}
    </div>
  );
}
