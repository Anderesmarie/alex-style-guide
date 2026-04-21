import { useEffect, useRef, useState } from 'react';
import { WishlistItem, getWishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem } from '@/lib/wishlist';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface Props {
  onPurchase: (item: WishlistItem) => void;
}

type View = 'grid' | 'detail' | 'edit';

export default function Wishlist({ onPurchase }: Props) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('grid');
  const [selected, setSelected] = useState<WishlistItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [photo, setPhoto] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getWishlist());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setPhoto(''); setName(''); setUrl(''); setNotes('');
  };

  const openAdd = () => {
    resetForm();
    setSelected(null);
    setShowForm(true);
  };

  const openEdit = (item: WishlistItem) => {
    setPhoto(item.photo);
    setName(item.name);
    setUrl(item.url || '');
    setNotes(item.notes || '');
    setSelected(item);
    setShowForm(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };

  const handleSave = async () => {
    if (!photo || !name.trim()) {
      toast.error('Photo et nom obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await updateWishlistItem(selected.id, { photo, name: name.trim(), url: url.trim(), notes: notes.trim() });
        toast.success('Pièce mise à jour');
      } else {
        await addWishlistItem({ photo, name: name.trim(), url: url.trim(), notes: notes.trim() });
        toast.success('Ajoutée à ta wishlist ✨');
      }
      setShowForm(false);
      setSelected(null);
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: WishlistItem) => {
    await deleteWishlistItem(item.id);
    toast.success('Supprimée de ta wishlist');
    setView('grid');
    setSelected(null);
    await load();
  };

  const handlePurchase = async (item: WishlistItem) => {
    onPurchase(item);
    await deleteWishlistItem(item.id);
    setView('grid');
    setSelected(null);
    await load();
  };

  // ---------- Form modal ----------
  if (showForm) {
    return (
      <div className="fade-enter pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setShowForm(false); resetForm(); setSelected(null); }} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold">{selected ? 'Modifier la pièce' : 'Ajouter une pièce'}</h1>
        </div>

        <div className="flex flex-col gap-5 pb-24">
          {photo ? (
            <div className="relative">
              <img src={photo} alt="pièce" className="w-full rounded-2xl object-cover max-h-64" />
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-3 right-3 bg-white/90 text-xs px-3 py-1.5 rounded-full border border-gray-200">Changer</button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-[#C9956C]/40 rounded-2xl bg-white flex flex-col items-center justify-center gap-2 cursor-pointer py-16">
              <span className="text-4xl">📷</span>
              <p className="text-sm font-medium text-gray-700">Ajouter une photo *</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <div>
            <label className="block text-sm font-medium mb-2">Nom de la pièce <span className="text-[#C9956C]">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Veste beige Zara"
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lien boutique</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Taille, couleur..."
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!photo || !name.trim() || saving}
            className="w-full bg-[#2C2C2C] text-white py-4 rounded-2xl text-sm font-medium disabled:opacity-40 mt-2"
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Detail view ----------
  if (view === 'detail' && selected) {
    return (
      <div className="fade-enter pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setView('grid'); setSelected(null); }} className="text-2xl">←</button>
          <h1 className="text-xl font-serif font-bold flex-1 truncate">{selected.name}</h1>
        </div>
        <img src={selected.photo} alt={selected.name} className="w-full aspect-square object-cover rounded-xl card-shadow mb-4" />
        <div className="space-y-3">
          <div><span className="text-sm text-muted-foreground">Nom :</span> <span className="font-medium">{selected.name}</span></div>
          {selected.url && (
            <div>
              <span className="text-sm text-muted-foreground">Lien :</span>{' '}
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#C9956C] underline break-all">
                {selected.url}
              </a>
            </div>
          )}
          {selected.notes && (
            <div>
              <span className="text-sm text-muted-foreground">Notes :</span>
              <p className="font-medium whitespace-pre-wrap">{selected.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => handlePurchase(selected)}
            className="w-full py-3 rounded-xl bg-[#C9956C] text-white font-semibold active:scale-[0.98] transition-transform"
          >
            ✓ Acheté !
          </button>
          <div className="flex gap-3">
            <button onClick={() => openEdit(selected)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform">
              Modifier
            </button>
            <button onClick={() => handleDelete(selected)} className="py-3 px-6 rounded-xl bg-destructive/15 text-destructive font-semibold active:scale-[0.98] transition-transform">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Grid view ----------
  return (
    <div className="fade-enter pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif font-bold">Wishlist 🛍️</h1>
        <span className="text-sm text-muted-foreground">{items.length} pièce{items.length !== 1 ? 's' : ''}</span>
      </div>

      <button
        onClick={openAdd}
        className="w-full py-3.5 rounded-xl bg-[#C9956C] text-white font-semibold mb-5 active:scale-[0.98] transition-transform shadow-lg"
      >
        + Ajouter une pièce
      </button>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { setSelected(item); setView('detail'); }}
              className="aspect-square rounded-lg overflow-hidden card-shadow active:scale-[0.96] transition-transform relative group"
            >
              <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-[10px] text-white font-medium truncate text-left">{item.name}</p>
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); handlePurchase(item); }}
                role="button"
                className="absolute top-1.5 right-1.5 bg-[#C9956C] text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md active:scale-95 transition-transform"
              >
                ✓ Acheté
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="font-serif text-lg">Ta wishlist est vide</p>
          <p className="text-sm mt-1">Garde ici les pièces que tu rêves d'avoir !</p>
        </div>
      )}
    </div>
  );
}
