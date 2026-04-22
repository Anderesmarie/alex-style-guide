import { useState, useEffect, useRef, useMemo } from 'react';
import { ClothingItem, COLORS, SEASONS, OCCASIONS, STYLE_OPTIONS } from '@/lib/types';
import { getWardrobe, addClothing, updateClothing, deleteClothing, getOutfits, saveOutfits, genId } from '@/lib/storage';
import { CATEGORIES, getLayerByType } from '@/lib/categories';
import { compressImage, recompressWithRotation } from '@/lib/imageUtils';
import { toast } from 'sonner';
import { updateStreak } from '@/lib/streak';
import PhotoGuide from '@/components/PhotoGuide';
import Wishlist from '@/components/Wishlist';
import { WishlistItem } from '@/lib/wishlist';
import { useClothingAnalysis } from '@/hooks/useClothingAnalysis';

type View = 'grid' | 'add' | 'detail' | 'edit';
type Tab = 'dressing' | 'wishlist';

const COLOR_PALETTE = [
  { label: 'Blanc', value: 'blanc', bg: '#FFFFFF' },
  { label: 'Noir', value: 'noir', bg: '#2C2C2C' },
  { label: 'Gris', value: 'gris', bg: '#9B9B9B' },
  { label: 'Beige', value: 'beige', bg: '#F5F0EB' },
  { label: 'Camel', value: 'camel', bg: '#C8A882' },
  { label: 'Bleu', value: 'bleu', bg: '#3B6BA5' },
  { label: 'Marine', value: 'marine', bg: '#1B2A4A' },
  { label: 'Rouge', value: 'rouge', bg: '#C0392B' },
  { label: 'Bordeaux', value: 'bordeaux', bg: '#722F37' },
  { label: 'Rose', value: 'rose', bg: '#E8A0B4' },
  { label: 'Vert', value: 'vert', bg: '#2E7D32' },
  { label: 'Kaki', value: 'kaki', bg: '#6B7C3A' },
  { label: 'Jaune', value: 'jaune', bg: '#F4C430' },
  { label: 'Marron', value: 'marron', bg: '#6B3F2A' },
  { label: 'Violet', value: 'violet', bg: '#6B3FA0' },
  { label: 'Corail', value: 'corail', bg: '#E8734A' },
  { label: 'Terracotta', value: 'terracotta', bg: '#C1440E' },
  { label: 'Lavande', value: 'lavande', bg: '#B8A0CC' },
  { label: 'Turquoise', value: 'turquoise', bg: '#00CED1' },
  { label: 'Rose gold', value: 'rose_gold', bg: '#C9956C' },
  { label: 'Crème', value: 'creme', bg: '#F5F5DC' },
  { label: 'Fuchsia', value: 'fuchsia', bg: '#FF69B4' },
];

const PATTERN_PALETTE = [
  { label: 'Léopard', value: 'leopard', bg: 'radial-gradient(circle at 30% 40%, #6B3F2A 3px, transparent 3px), radial-gradient(circle at 70% 60%, #6B3F2A 2px, transparent 2px), #C8A882' },
  { label: 'Fleuri', value: 'fleuri', bg: 'radial-gradient(circle at 25% 30%, #E8A0B4 3px, transparent 3px), radial-gradient(circle at 65% 50%, #E8A0B4 2px, transparent 2px), radial-gradient(circle at 45% 75%, #E8A0B4 3px, transparent 3px), #FFFFFF' },
  { label: 'Rayé', value: 'raye', bg: 'repeating-linear-gradient(90deg, #2C2C2C 0px, #2C2C2C 3px, #FFFFFF 3px, #FFFFFF 6px)' },
  { label: 'Carreaux', value: 'carreaux', bg: 'repeating-linear-gradient(0deg, transparent, transparent 8px, #3B6BA555 8px, #3B6BA555 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, #3B6BA555 8px, #3B6BA555 9px), #D6E4F0' },
  { label: 'Géométrique', value: 'geometrique', bg: 'repeating-linear-gradient(45deg, #C9956C 0px, #C9956C 4px, #F5F0EB 4px, #F5F0EB 8px)' },
  { label: 'Multicolore', value: 'multicolore', bg: 'linear-gradient(135deg, #C0392B, #F4C430, #2E7D32, #3B6BA5, #6B3FA0)' },
];

const DELETE_REASONS = [
  { emoji: '📏', label: 'Trop petit / trop grand' },
  { emoji: '💔', label: 'Je ne l\'aime plus' },
  { emoji: '🎁', label: 'Donné' },
  { emoji: '💸', label: 'Vendu' },
  { emoji: '🗑️', label: 'Autre' },
];

export default function Dressing() {
  const [tab, setTab] = useState<Tab>('dressing');
  const [view, setView] = useState<View>('grid');
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSeason, setFilterSeason] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewBase64, setPreviewBase64] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOrigSrc, setPreviewOrigSrc] = useState('');
  const [manualRotation, setManualRotation] = useState(0);

  // Delete dialog state
  const [deleteDialogItem, setDeleteDialogItem] = useState<ClothingItem | null>(null);
  const [deleteReason, setDeleteReason] = useState<string | null>(null);

  // Form state
  const [displayImage, setDisplayImage] = useState<string | null>(null);
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
  const [layer, setLayer] = useState<number>(1);
  const [showPhotoTips, setShowPhotoTips] = useState(true);
  const [bgRemoved, setBgRemoved] = useState(false);
  const { analyze, loading: analyzing, error: analysisError, cleanImage, analysis } = useClothingAnalysis();

  // Met à jour l'image affichée seulement si cleanImage est une data URL valide
  useEffect(() => {
    if (cleanImage && typeof cleanImage === 'string' && cleanImage.startsWith('data:image')) {
      setDisplayImage(cleanImage);
      setImageBase64(cleanImage);
      setBgRemoved(true);
    }
  }, [cleanImage]);

  const loadWardrobe = async () => {
    const w = await getWardrobe();
    setWardrobe(w);
    setLoading(false);
  };

  useEffect(() => { loadWardrobe(); }, []);

  const resetForm = () => {
    setDisplayImage(null); setImageBase64(''); setBgRemoved(false);
    setCategory(''); setSubcategory(''); setType(''); setColor(''); setCustomColor('');
    setSeason([]); setStyle([]); setOccasion([]); setBrand(''); setPrice('');
    setPreviewBase64(''); setPreviewFile(null); setPreviewOrigSrc(''); setManualRotation(0);
    setLayer(1);
    setShowPhotoTips(true);
    setFormError(null);
  };

  const handlePurchaseFromWishlist = (item: WishlistItem) => {
    resetForm();
    setDisplayImage(item.photo);
    setImageBase64(item.photo);
    if (item.name) setBrand(item.name);
    setTab('dressing');
    setView('add');
    toast.success('Termine de cataloguer ta nouvelle pièce ✨');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset bgRemoved car nouvelle photo = nouvelle analyse
    setBgRemoved(false);

    // 1. Aperçu instantané — ne disparaîtra plus jamais
    const instantPreview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setDisplayImage(instantPreview);
    setImageBase64(instantPreview);
    setPreviewFile(file);
    setPreviewOrigSrc(instantPreview);
    setManualRotation(0);

    try {
      const compressed = await compressImage(file);
      setImageBase64(compressed);
      setPreviewBase64(compressed);
      setPreviewOrigSrc(compressed);

      const base64 = compressed.includes(',') ? compressed.split(',')[1] : compressed;
      const result = await analyze(base64);
      if (result) {
        setCategory(result.category);
        setSubcategory(result.subcategory);
        setType(result.type);
        setColor(result.color);
        setSeason(result.season);
        setStyle(result.style);
        setOccasion(result.occasion);
      }
    } catch {
      // displayImage reste affichée
    }
  };

  const handleRotate90 = async () => {
    const newRotation = manualRotation + 90;
    setManualRotation(newRotation);
    if (!previewFile) return;
    const rotated = await recompressWithRotation(previewOrigSrc, previewFile, newRotation);
    setPreviewBase64(rotated);
    if (rotated && rotated.startsWith('data:image')) {
      setDisplayImage(rotated);
      setImageBase64(rotated);
      setBgRemoved(false);
    }
  };

  const acceptPreview = () => {
    if (previewBase64 && previewBase64.startsWith('data:image')) {
      setDisplayImage(previewBase64);
      setImageBase64(previewBase64);
    }
    setPreviewBase64('');
    setPreviewFile(null);
    setPreviewOrigSrc('');
    setManualRotation(0);
  };

  const retakePreview = () => {
    setDisplayImage(null);
    setImageBase64('');
    setBgRemoved(false);
    setPreviewBase64('');
    setPreviewFile(null);
    setPreviewOrigSrc('');
    setManualRotation(0);
    if (fileRef.current) {
      fileRef.current.value = '';
      fileRef.current.click();
    }
  };

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    setFormError(null);
    const finalImage = displayImage;
    if (!finalImage) {
      setFormError('Ajoute une photo pour continuer');
      return;
    }
    if (!category) {
      setFormError('Choisis une catégorie');
      return;
    }
    const finalColor = color || customColor || 'Autre';
    const item: ClothingItem = {
      id: genId(), imageBase64: finalImage, category, subcategory, layer, type: type || category, color: finalColor,
      season: season.length ? season : ['Toutes saisons'],
      style: style.length ? style : ['Casual'],
      occasion: occasion.length ? occasion : ['Quotidien'],
      brand: brand || undefined,
      price: price ? Number(price) : undefined,
    };
    setSaving(true);
    try {
      await addClothing(item);
      updateStreak();
      await loadWardrobe();
      resetForm();
      setView('grid');
      toast.success('Vêtement ajouté à ton dressing ✨');
    } catch (err) {
      setFormError("Erreur lors de l'enregistrement. Réessaie.");
    } finally {
      setSaving(false);
    }
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
      imageBase64: displayImage ?? selectedItem.imageBase64,
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
    setDisplayImage(item.imageBase64);
    setImageBase64(item.imageBase64);
    setBgRemoved(false);
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

      <div className="flex flex-col gap-5 pb-24">

        {showPhotoTips && (
          <div className="rounded-2xl border border-[#C9956C]/30 bg-[#C9956C]/5 p-4">
            <p className="text-sm font-medium text-[#C9956C] mb-3">
              📸 Conseils pour une belle photo
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <p>✅ Fond uni ou neutre — sol, mur blanc ou beige</p>
              <p className="text-amber-700">⚠️ Si ton vêtement est blanc, crème, beige ou jaune clair → fond foncé — sol en bois, mur gris</p>
              <p>✅ Lumière naturelle si possible — près d'une fenêtre, pas de flash</p>
              <p>✅ Vêtement à plat — étale-le pour voir sa forme entière</p>
              <p>✅ Cadrage carré — centre le vêtement, laisse un peu de bord</p>
              <p className="text-red-500">❌ Évite les photos floues ou sombres</p>
              <p className="text-red-500">❌ Évite les fonds chargés ou très colorés</p>
            </div>
            <button
              onClick={() => setShowPhotoTips(false)}
              className="mt-3 text-sm text-[#C9956C] font-medium"
            >
              J'ai compris ✓
            </button>
          </div>
        )}

        {displayImage ? (
          <div className="relative">
            <div
              className="w-full rounded-2xl overflow-hidden max-h-64"
              style={bgRemoved ? {
                backgroundImage:
                  'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: '#ffffff',
              } : undefined}
            >
              <img
                src={displayImage}
                alt="Aperçu"
                className={`w-full max-h-64 ${bgRemoved ? 'object-contain' : 'object-cover'}`}
              />
            </div>
            {bgRemoved && (
              <span className="absolute top-2 left-2 bg-white/90 text-xs px-2 py-1 rounded-full border border-gray-200 font-medium">
                ✂️ Fond supprimé
              </span>
            )}
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-3 right-3 bg-white/90 text-xs px-3 py-1.5 rounded-full border border-gray-200">Changer</button>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-[#C9956C]/40 rounded-2xl bg-white flex flex-col items-center justify-center gap-2 cursor-pointer py-16">
            <span className="text-4xl">📷</span>
            <p className="text-sm font-medium text-gray-700">Ajouter une photo</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {analyzing && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#C9956C]/30 bg-[#C9956C]/5 py-4">
            <span className="inline-block w-5 h-5 border-2 border-[#C9956C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#C9956C]">✨ Analyse en cours...</p>
          </div>
        )}

        {!analyzing && analysis && !analysisError && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-medium">
            ✅ Pré-rempli par l'IA — vérifie et modifie si besoin
          </div>
        )}

        {!analyzing && analysisError && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700 font-medium">
            ⚠️ Analyse automatique indisponible — remplis les champs manuellement
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">Catégorie <span className="text-[#C9956C]">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.name} type="button"
                onClick={() => { setCategory(cat.name); setType(''); setLayer(cat.layer); }}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${category === cat.name ? 'border-[#C9956C] bg-[#C9956C]/10 text-[#C9956C]' : 'border-gray-200 bg-white text-gray-600'}`}>
                <span className="text-xl">{cat.icon}</span>
                <span className="text-center leading-tight font-medium">{cat.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {category && (
          <div>
            <label className="block text-sm font-medium mb-2">Type <span className="text-[#C9956C]">*</span></label>
            <select value={type}
              onChange={e => { const t = e.target.value; setType(t); const found = CATEGORIES.find(c => c.name === category)?.types.find(x => x.label === t); if (found) setLayer(found.layer); }}
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm text-gray-700">
              <option value="">Sélectionne un type</option>
              {CATEGORIES.find(c => c.name === category)?.types.map(t => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">Couleur</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map(c => (
              <button key={c.value} type="button" onClick={() => setColor(c.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${color === c.value ? 'border-[#C9956C] bg-[#C9956C]/10 text-[#C9956C]' : 'border-gray-200 bg-white text-gray-600'}`}>
                <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: c.bg }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Saison</label>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map(s => (
              <button key={s} type="button" onClick={() => toggle(season, s, setSeason)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all ${season.includes(s) ? 'border-[#C9956C] bg-[#C9956C]/10 text-[#C9956C]' : 'border-gray-200 bg-white text-gray-600'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(s => (
              <button key={s.label} type="button" onClick={() => toggle(style, s.label, setStyle)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all ${style.includes(s.label) ? 'border-[#C9956C] bg-[#C9956C]/10 text-[#C9956C]' : 'border-gray-200 bg-white text-gray-600'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map(o => (
              <button key={o} type="button" onClick={() => toggle(occasion, o, setOccasion)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all ${occasion.includes(o) ? 'border-[#C9956C] bg-[#C9956C]/10 text-[#C9956C]' : 'border-gray-200 bg-white text-gray-600'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Marque</label>
          <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Zara, H&M, Sézane..." className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prix d'achat</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="ex : 45" className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm" />
        </div>

        {formError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 font-medium">
            ⚠️ {formError}
          </div>
        )}

        <button onClick={isEdit ? handleUpdate : handleSave} disabled={saving}
          className="w-full bg-[#2C2C2C] text-white py-4 rounded-2xl text-sm font-medium disabled:opacity-60 mt-2">
          {isEdit ? (saving ? 'Enregistrement...' : 'Enregistrer les modifications') : (saving ? 'Enregistrement...' : 'Sauvegarder')}
        </button>

      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex gap-6 border-b border-border mb-5">
      <button
        onClick={() => setTab('dressing')}
        className={`pb-2 text-sm font-medium transition-colors relative ${
          tab === 'dressing' ? 'text-[#C9956C]' : 'text-muted-foreground'
        }`}
      >
        Mon Dressing
        {tab === 'dressing' && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#C9956C] rounded-full" />}
      </button>
      <button
        onClick={() => setTab('wishlist')}
        className={`pb-2 text-sm font-medium transition-colors relative ${
          tab === 'wishlist' ? 'text-[#C9956C]' : 'text-muted-foreground'
        }`}
      >
        Wishlist 🛍️
        {tab === 'wishlist' && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#C9956C] rounded-full" />}
      </button>
    </div>
  );

  // Wishlist tab takes over (only when on grid view, not inside add/edit/detail)
  if (tab === 'wishlist' && view === 'grid') {
    return (
      <div className="fade-enter pb-4">
        {renderTabs()}
        <Wishlist onPurchase={handlePurchaseFromWishlist} />
      </div>
    );
  }

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
      {renderTabs()}
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
            {CATEGORIES.flatMap(c => c.types.map(t => t.label))
              .filter((v, i, a) => a.indexOf(v) === i)
              .map(t => <option key={t}>{t}</option>)}
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
