import { useState, useEffect, useRef, useMemo } from 'react';
import { ClothingItem, COLORS, SEASONS, OCCASIONS, STYLE_OPTIONS } from '@/lib/types';
import { getWardrobe, addClothing, updateClothing, deleteClothing, getOutfits, saveOutfits, genId } from '@/lib/storage';
import { CATEGORIES, getLayerByType } from '@/lib/categories';
import { DRESSING_CATEGORIES, getAllTypesForCategory } from '@/lib/dressingTaxonomy';
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
  { label: 'Blanc', value: 'blanc', hex: '#FFFFFF' },
  { label: 'Noir', value: 'noir', hex: '#2C2C2C' },
  { label: 'Gris', value: 'gris', hex: '#9B9B9B' },
  { label: 'Beige', value: 'beige', hex: '#F5F0EB' },
  { label: 'Crème', value: 'creme', hex: '#FFFDD0' },
  { label: 'Nude', value: 'nude', hex: '#E8C9A0' },
  { label: 'Camel', value: 'camel', hex: '#C8A882' },
  { label: 'Corail', value: 'corail', hex: '#FF6B6B' },
  { label: 'Terracotta', value: 'terracotta', hex: '#C8603A' },
  { label: 'Rouge', value: 'rouge', hex: '#D32F2F' },
  { label: 'Bordeaux', value: 'bordeaux', hex: '#7B1734' },
  { label: 'Jaune', value: 'jaune', hex: '#F9D71C' },
  { label: 'Rose', value: 'rose', hex: '#F48FB1' },
  { label: 'Fuchsia', value: 'fuchsia', hex: '#E91E8C' },
  { label: 'Rose gold', value: 'rose-gold', hex: '#C9956C' },
  { label: 'Marron', value: 'marron', hex: '#795548' },
  { label: 'Bleu ciel', value: 'bleu-ciel', hex: '#87CEEB' },
  { label: 'Bleu', value: 'bleu', hex: '#3B6BA5' },
  { label: 'Marine', value: 'marine', hex: '#1B2A4A' },
  { label: 'Turquoise', value: 'turquoise', hex: '#00BCD4' },
  { label: 'Vert', value: 'vert', hex: '#4CAF50' },
  { label: 'Kaki', value: 'kaki', hex: '#8D9440' },
  { label: 'Violet', value: 'violet', hex: '#9C27B0' },
  { label: 'Lavande', value: 'lavande', hex: '#B39DDB' },
  { label: 'Argenté', value: 'argente', hex: '#C0C0C0' },
  { label: 'Doré', value: 'dore', hex: '#FFD700' },
];

const PATTERN_PALETTE: { label: string; value: string }[] = [
  { label: 'Uni', value: 'uni' },
  { label: 'Rayé', value: 'raye' },
  { label: 'Carreaux', value: 'carreaux' },
  { label: 'Fleuri', value: 'fleuri' },
  { label: 'Léopard', value: 'leopard' },
  { label: 'Zébré', value: 'zebre' },
  { label: 'Tie-dye', value: 'tie-dye' },
  { label: 'Graphique', value: 'graphique' },
  { label: 'Géométrique', value: 'geometrique' },
  { label: 'Pied-de-poule', value: 'pied-de-poule' },
];

// Rend l'aperçu d'un motif dans un cercle SVG 28x28 (clip circulaire)
function PatternSwatch({ value }: { value: string }) {
  const size = 28;
  const r = size / 2;
  const clipId = `clip-${value}`;
  const renderInner = () => {
    switch (value) {
      case 'uni':
        return <rect width={size} height={size} fill="#E8E8E8" />;
      case 'raye':
        return (
          <>
            <rect width={size} height={size} fill="#FFFFFF" />
            <rect x={4} y={0} width={4} height={size} fill="#9B9B9B" />
            <rect x={12} y={0} width={4} height={size} fill="#9B9B9B" />
            <rect x={20} y={0} width={4} height={size} fill="#9B9B9B" />
          </>
        );
      case 'carreaux': {
        const cells: JSX.Element[] = [];
        for (let y = 0; y < size; y += 6) {
          for (let x = 0; x < size; x += 6) {
            const isBlue = ((x / 6) + (y / 6)) % 2 === 0;
            cells.push(
              <rect key={`${x}-${y}`} x={x} y={y} width={6} height={6} fill={isBlue ? '#3B6BA5' : '#FFFFFF'} />
            );
          }
        }
        return <>{cells}</>;
      }
      case 'fleuri':
        return (
          <>
            <rect width={size} height={size} fill="#FFF0F5" />
            <circle cx={14} cy={6} r={2.5} fill="#E91E8C" />
            <circle cx={14} cy={22} r={2.5} fill="#E91E8C" />
            <circle cx={6} cy={14} r={2.5} fill="#E91E8C" />
            <circle cx={22} cy={14} r={2.5} fill="#E91E8C" />
            <circle cx={14} cy={14} r={2} fill="#F9D71C" />
          </>
        );
      case 'leopard':
        return (
          <>
            <rect width={size} height={size} fill="#D4A017" />
            <ellipse cx={8} cy={8} rx={3} ry={2} fill="#3C2000" />
            <ellipse cx={20} cy={9} rx={2.5} ry={2} fill="#3C2000" />
            <ellipse cx={9} cy={20} rx={2.5} ry={2} fill="#3C2000" />
            <ellipse cx={20} cy={20} rx={3} ry={2} fill="#3C2000" />
          </>
        );
      case 'zebre': {
        const stripes: JSX.Element[] = [];
        for (let i = -size; i < size * 2; i += 8) {
          stripes.push(
            <rect key={i} x={i} y={-size} width={4} height={size * 3} fill="#000000" transform={`rotate(45 ${size / 2} ${size / 2})`} />
          );
        }
        return (
          <>
            <rect width={size} height={size} fill="#FFFFFF" />
            {stripes}
          </>
        );
      }
      case 'tie-dye':
        return (
          <>
            <rect width={size} height={size} fill="#FFFFFF" />
            <circle cx={r} cy={r} r={12} fill="#3B6BA5" />
            <circle cx={r} cy={r} r={8} fill="#9C27B0" />
            <circle cx={r} cy={r} r={4} fill="#F48FB1" />
          </>
        );
      case 'graphique':
        return (
          <>
            <rect width={size} height={size} fill="#000000" />
            <rect x={0} y={9} width={size} height={3} fill="#FFFFFF" />
            <rect x={0} y={17} width={size} height={3} fill="#FFFFFF" />
          </>
        );
      case 'geometrique':
        return (
          <>
            <rect width={size} height={size} fill="#E8E8E8" />
            <polygon points={`${r},6 22,22 6,22`} fill="#3B6BA5" />
          </>
        );
      case 'pied-de-poule': {
        const cells: JSX.Element[] = [];
        for (let y = 0; y < size; y += 4) {
          for (let x = 0; x < size; x += 4) {
            const isBlack = ((x / 4) + (y / 4)) % 2 === 0;
            cells.push(
              <rect key={`${x}-${y}`} x={x} y={y} width={4} height={4} fill={isBlack ? '#000000' : '#FFFFFF'} />
            );
          }
        }
        return <>{cells}</>;
      }
      default:
        return <rect width={size} height={size} fill="#E8E8E8" />;
    }
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{renderInner()}</g>
    </svg>
  );
}

const TEXTURE_PALETTE: { label: string; value: string }[] = [
  { label: 'Coton', value: 'coton' },
  { label: 'Denim', value: 'denim' },
  { label: 'Maille', value: 'maille' },
  { label: 'Satin', value: 'satin' },
  { label: 'Velours', value: 'velours' },
  { label: 'Cuir', value: 'cuir' },
  { label: 'Lin', value: 'lin' },
  { label: 'Synthétique', value: 'synthetique' },
];

// Rend l'aperçu d'une texture dans un cercle SVG 28x28 (clip circulaire)
function TextureSwatch({ value }: { value: string }) {
  const size = 28;
  const r = size / 2;
  const clipId = `clip-tex-${value}`;
  const renderInner = () => {
    switch (value) {
      case 'coton': {
        const lines: JSX.Element[] = [];
        for (let i = 4; i < size; i += 4) {
          lines.push(<line key={`h${i}`} x1={0} y1={i} x2={size} y2={i} stroke="#D9D9D9" strokeWidth={0.5} />);
          lines.push(<line key={`v${i}`} x1={i} y1={0} x2={i} y2={size} stroke="#D9D9D9" strokeWidth={0.5} />);
        }
        return (
          <>
            <rect width={size} height={size} fill="#F5F5F5" />
            {lines}
          </>
        );
      }
      case 'denim': {
        const lines: JSX.Element[] = [];
        for (let i = -size; i < size * 2; i += 3) {
          lines.push(
            <line key={i} x1={i} y1={0} x2={i + size} y2={size} stroke="#FFFFFF" strokeWidth={0.5} opacity={0.6} />
          );
        }
        return (
          <>
            <rect width={size} height={size} fill="#3B6BA5" />
            {lines}
          </>
        );
      }
      case 'maille': {
        const waves: JSX.Element[] = [];
        for (let y = 4; y < size; y += 5) {
          waves.push(
            <path
              key={y}
              d={`M0 ${y} Q ${size / 4} ${y - 2}, ${size / 2} ${y} T ${size} ${y}`}
              stroke="#C8A882"
              strokeWidth={1}
              fill="none"
            />
          );
        }
        return (
          <>
            <rect width={size} height={size} fill="#F5E6D3" />
            {waves}
          </>
        );
      }
      case 'satin':
        return (
          <>
            <rect width={size} height={size} fill="#F8E8F0" />
            <polygon points={`0,${size} ${size * 0.4},${size} ${size},${size * 0.4} ${size},0 ${size * 0.6},0 0,${size * 0.6}`} fill="#FFFFFF" opacity={0.7} />
          </>
        );
      case 'velours': {
        const stries: JSX.Element[] = [];
        for (let x = 2; x < size; x += 3) {
          stries.push(<line key={x} x1={x} y1={0} x2={x} y2={size} stroke="#FFFFFF" strokeWidth={0.4} opacity={0.4} />);
        }
        return (
          <>
            <rect width={size} height={size} fill="#7B1734" />
            {stries}
          </>
        );
      }
      case 'cuir':
        return (
          <>
            <rect width={size} height={size} fill="#3C2000" />
            <line x1={0} y1={r} x2={size} y2={r} stroke="#FFFFFF" strokeWidth={0.4} opacity={0.25} />
          </>
        );
      case 'lin': {
        const threads: JSX.Element[] = [];
        for (let i = 0; i < size; i += 4) {
          threads.push(<line key={`h${i}`} x1={0} y1={i} x2={size} y2={i} stroke="#C8A882" strokeWidth={0.6} />);
          threads.push(<line key={`v${i}`} x1={i} y1={0} x2={i} y2={size} stroke="#C8A882" strokeWidth={0.6} />);
        }
        return (
          <>
            <rect width={size} height={size} fill="#F5F0EB" />
            {threads}
          </>
        );
      }
      case 'synthetique': {
        const grid: JSX.Element[] = [];
        for (let i = 2; i < size; i += 3) {
          grid.push(<line key={`h${i}`} x1={0} y1={i} x2={size} y2={i} stroke="#3B6BA5" strokeWidth={0.3} opacity={0.6} />);
          grid.push(<line key={`v${i}`} x1={i} y1={0} x2={i} y2={size} stroke="#3B6BA5" strokeWidth={0.3} opacity={0.6} />);
        }
        return (
          <>
            <rect width={size} height={size} fill="#E8F0FE" />
            {grid}
          </>
        );
      }
      default:
        return <rect width={size} height={size} fill="#F5F5F5" />;
    }
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{renderInner()}</g>
    </svg>
  );
}

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
  const { analyze, loading: analyzing, error: analysisError, cleanImage, analysis } = useClothingAnalysis();
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
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
  const [colors, setColors] = useState<string[]>([]);
  const [pattern, setPattern] = useState<string>('uni');
  const [texture, setTexture] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [fit, setFit] = useState<string>('');
  const [customColor, setCustomColor] = useState('');
  const [season, setSeason] = useState<string[]>([]);
  const [style, setStyle] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [layer, setLayer] = useState<number>(1);
  const [showPhotoTips, setShowPhotoTips] = useState(true);
  const [bgRemoved, setBgRemoved] = useState(false);

  const loadWardrobe = async () => {
    const w = await getWardrobe();
    setWardrobe(w);
    setLoading(false);
  };

  useEffect(() => { loadWardrobe(); }, []);

  // Options de longueur selon la sous-catégorie / catégorie sélectionnée
  // Si aucune sous-catégorie n'est sélectionnée, on affiche les options par défaut
  const DEFAULT_LENGTH_OPTIONS = ['Crop', 'Court', 'Standard', 'Midi', 'Maxi'];
  const getLengthOptions = (cat: string, sub: string): string[] => {
    if (!sub) return DEFAULT_LENGTH_OPTIONS;
    if (cat === 'Hauts') {
      if (sub === 'Tops & T-shirts' || sub === 'Chemises & Blouses' || sub === 'Pulls & Mailles') return ['Crop', 'Court', 'Standard', 'Long'];
      return DEFAULT_LENGTH_OPTIONS;
    }
    if (cat === 'Robes') return ['Court', 'Standard', 'Midi', 'Maxi'];
    if (cat === 'Manteaux') {
      if (sub === 'Vestes') return ['Court', 'Standard', 'Long'];
      if (sub === 'Manteaux') return ['Court', 'Midi', 'Maxi'];
      return DEFAULT_LENGTH_OPTIONS;
    }
    if (cat === 'Bas') {
      if (sub === 'Jeans' || sub === 'Pantalons' || sub === 'Leggings & Joggings') return ['Court', 'Standard', 'Maxi'];
      if (sub === 'Jupes') return ['Court', 'Standard', 'Midi', 'Maxi'];
      if (sub === 'Shorts') return ['Court'];
      return DEFAULT_LENGTH_OPTIONS;
    }
    return DEFAULT_LENGTH_OPTIONS;
  };
  const lengthOptions = getLengthOptions(category, subcategory);
  const lengthDisabled = category === 'Bas' && subcategory === 'Shorts';

  // Réinitialiser length quand la sous-catégorie change
  useEffect(() => {
    if (lengthDisabled) {
      setLength('Court');
      return;
    }
    if (length && !lengthOptions.includes(length)) setLength('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategory]);

  // Quand l'IA renvoie une image détourée valide, on l'utilise comme aperçu
  useEffect(() => {
    if (cleanImage && cleanImage.startsWith('data:image')) {
      setDisplayImage(cleanImage);
      setImageBase64(cleanImage);
      setBgRemoved(true);
    }
  }, [cleanImage]);

  const resetForm = () => {
    setDisplayImage(null); setImageBase64(''); setBgRemoved(false);
    setCategory(''); setSubcategory(''); setType(''); setColors([]); setPattern('uni'); setTexture(''); setLength(''); setFit(''); setCustomColor('');
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

    setBgRemoved(false);

    // Aperçu instantané
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

    // Compression en arrière-plan, puis analyse IA
    let compressed = instantPreview;
    try {
      compressed = await compressImage(file);
      setDisplayImage(compressed);
      setImageBase64(compressed);
      setPreviewOrigSrc(compressed);
    } catch {
      // garde l'aperçu instantané si la compression échoue
    }

    // Analyse IA — pré-remplissage des champs sans jamais cacher la photo
    try {
      const result = await analyze(compressed);
      if (result) {
        if (result.category) setCategory(result.category);
        if (result.subcategory) setSubcategory(result.subcategory);
        if (result.type) setType(result.type);
        if (result.color) {
          // L'IA renvoie une couleur unique : on la place comme première sélection (max 3)
          const aiColors = String(result.color).split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
          if (aiColors.length) setColors(aiColors);
        }
        if (result.season?.length) setSeason(result.season);
        if (result.style?.length) setStyle(result.style);
        if (result.occasion?.length) setOccasion(result.occasion);
      }
    } catch {
      // l'erreur est déjà gérée dans le hook (analysisError)
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
    const finalColor = colors.length ? colors.join(', ') : (customColor || 'Autre');
    const item: ClothingItem = {
      id: genId(), imageBase64: finalImage, category, subcategory, layer, type: type || category, color: finalColor,
      season: season.length ? season : ['Toutes saisons'],
      style: style.length ? style : ['Casual'],
      occasion: occasion.length ? occasion : ['Quotidien'],
      brand: brand || undefined,
      price: price ? Number(price) : undefined,
      pattern: pattern || 'uni',
      texture: texture || undefined,
      length: length || undefined,
      fit: fit || undefined,
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
    const finalColor = colors.length ? colors.join(', ') : (customColor || selectedItem.color);
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
      pattern: pattern || selectedItem.pattern || 'uni',
      texture: texture || selectedItem.texture,
      length: length || selectedItem.length,
      fit: fit || selectedItem.fit,
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
    // Reconstruit la sélection multiple depuis le champ stocké (joint par virgule)
    const parsed = (item.color || '')
      .split(',')
      .map(s => s.trim())
      .filter(v => v && COLOR_PALETTE.some(c => c.value === v))
      .slice(0, 3);
    setColors(parsed);
    setPattern(item.pattern && PATTERN_PALETTE.some(p => p.value === item.pattern) ? item.pattern : 'uni');
    setTexture(item.texture && TEXTURE_PALETTE.some(t => t.value === item.texture) ? item.texture : '');
    setLength(item.length || '');
    setFit(item.fit || '');
    setSeason([...item.season]);
    setStyle([...item.style]);
    setOccasion([...item.occasion]);
    setBrand(item.brand || '');
    setPrice(item.price?.toString() || '');
    setView('edit');
  };

  // Niveau 1 : catégorie active (depuis la taxonomie partagée)
  const activeCategory = DRESSING_CATEGORIES.find(c => c.key === filterCategory);
  // Niveau 2 : sous-catégorie active (uniquement si la catégorie en a)
  const activeSubcategory = activeCategory?.subcategories?.find(s => s.key === filterSubcategory);

  // Liste des types autorisés selon la profondeur du filtre
  const allowedTypes: string[] | null = (() => {
    if (!activeCategory) return null;
    if (activeSubcategory) return activeSubcategory.types;
    return getAllTypesForCategory(activeCategory.key);
  })();

  const filtered = wardrobe.filter(i => {
    if (allowedTypes && !allowedTypes.includes(i.type)) return false;
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
            {bgRemoved && cleanImage && previewOrigSrc ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-gray-600 mb-1">Original</span>
                  <img
                    src={previewOrigSrc}
                    alt="Original"
                    className="w-full max-h-64 object-contain rounded-2xl bg-white border border-gray-200"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-gray-600 mb-1">Sans fond</span>
                  <div
                    className="w-full rounded-2xl overflow-hidden border border-gray-200"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <img
                      src={cleanImage}
                      alt="Sans fond"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : (
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
                {analyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-full border border-[#C9956C]/30 shadow-sm">
                      <span className="inline-block w-3 h-3 border-2 border-[#C9956C] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-[#C9956C]">✨ Analyse en cours...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {bgRemoved && (
              <span className="absolute top-2 left-2 bg-white/90 text-xs px-2 py-1 rounded-full border border-gray-200 font-medium">
                ✂️ Fond supprimé
              </span>
            )}
            {!analyzing && analysis && (
              <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full border border-emerald-200 font-medium">
                ✅ Pré-rempli par l'IA
              </span>
            )}
            {!analyzing && analysisError && (
              <span className="absolute top-2 right-2 bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full border border-amber-200 font-medium">
                ⚠️ Remplis manuellement
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


        <div>
          <label className="block text-sm font-medium mb-3">Catégorie <span className="text-[#C9956C]">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {DRESSING_CATEGORIES.map(cat => (
              <button key={cat.key} type="button"
                onClick={() => { setCategory(cat.key); setSubcategory(''); setType(''); setLayer(cat.layer); }}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${category === cat.key ? 'border-[#C9956C] bg-[#C9956C]/10 text-[#C9956C]' : 'border-gray-200 bg-white text-gray-600'}`}>
                <span className="text-center leading-tight font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sous-catégorie : seulement si la catégorie en a */}
        {category && DRESSING_CATEGORIES.find(c => c.key === category)?.subcategories && (
          <div>
            <label className="block text-sm font-medium mb-2">Sous-catégorie <span className="text-[#C9956C]">*</span></label>
            <select value={subcategory}
              onChange={e => { setSubcategory(e.target.value); setType(''); }}
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm text-gray-700">
              <option value="">Sélectionne une sous-catégorie</option>
              {DRESSING_CATEGORIES.find(c => c.key === category)?.subcategories?.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Type précis : si catégorie sans sous-cat OU si sous-cat sélectionnée */}
        {category && (() => {
          const cat = DRESSING_CATEGORIES.find(c => c.key === category);
          if (!cat) return null;
          const types = cat.subcategories
            ? cat.subcategories.find(s => s.key === subcategory)?.types
            : cat.types;
          if (!types) return null;
          return (
            <div>
              <label className="block text-sm font-medium mb-2">Type <span className="text-[#C9956C]">*</span></label>
              <select value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-2xl bg-white text-sm text-gray-700">
                <option value="">Sélectionne un type</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          );
        })()}

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="block text-sm font-medium">Couleur</label>
            <span className="text-xs text-gray-400">{colors.length}/3</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_PALETTE.map(c => {
              const selected = colors.includes(c.value);
              const isLight = ['blanc', 'creme', 'nude', 'beige'].includes(c.value);
              const toggleColor = () => {
                if (selected) {
                  setColors(colors.filter(v => v !== c.value));
                } else if (colors.length < 3) {
                  setColors([...colors, c.value]);
                } else {
                  toast.info('Tu peux sélectionner 3 couleurs maximum');
                }
              };
              return (
                <div
                  key={c.value}
                  className="flex flex-col items-center"
                  style={{ gap: 4 }}
                >
                  <button
                    type="button"
                    onClick={toggleColor}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={selected}
                    className="rounded-full transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: c.hex,
                      border: selected
                        ? '2px solid #C9956C'
                        : isLight
                          ? '1px solid #CCCCCC'
                          : '1px solid transparent',
                      boxShadow: selected ? '0 0 0 2px #FFFFFF inset' : 'none',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="border-t border-gray-200" />

        <div>
          <label className="block text-sm font-medium mb-3">Motif</label>
          <div className="flex flex-wrap gap-2.5">
            {PATTERN_PALETTE.map(p => {
              const selected = pattern === p.value;
              return (
                <div
                  key={p.value}
                  className="flex flex-col items-center"
                  style={{ gap: 4 }}
                >
                  <button
                    type="button"
                    onClick={() => setPattern(p.value)}
                    title={p.label}
                    aria-label={p.label}
                    aria-pressed={selected}
                    className="rounded-full transition-all flex items-center justify-center overflow-hidden"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: selected ? '#FDF5F0' : 'transparent',
                      border: selected ? '2px solid #C9956C' : '1px solid transparent',
                      padding: 0,
                    }}
                  >
                    <PatternSwatch value={p.value} />
                  </button>
                  <span style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="border-t border-gray-200" />

        <div>
          <label className="block text-sm font-medium mb-3">Texture</label>
          <div className="flex flex-wrap gap-2.5">
            {TEXTURE_PALETTE.map(t => {
              const selected = texture === t.value;
              return (
                <div
                  key={t.value}
                  className="flex flex-col items-center"
                  style={{ gap: 4 }}
                >
                  <button
                    type="button"
                    onClick={() => setTexture(selected ? '' : t.value)}
                    title={t.label}
                    aria-label={t.label}
                    aria-pressed={selected}
                    className="rounded-full transition-all flex items-center justify-center overflow-hidden"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: selected ? '#FDF5F0' : 'transparent',
                      border: selected ? '2px solid #C9956C' : '1px solid transparent',
                      padding: 0,
                    }}
                  >
                    <TextureSwatch value={t.value} />
                  </button>
                  <span style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="border-t border-gray-200" />

        <div>
          <label className="block text-sm font-medium mb-3">Longueur</label>
          <div className="flex flex-wrap gap-2">
            {lengthOptions.map(l => {
              const selected = length === l || (lengthDisabled && l === 'Court');
              return (
                <button
                  key={l}
                  type="button"
                  disabled={lengthDisabled}
                  onClick={() => !lengthDisabled && setLength(selected ? '' : l)}
                  aria-pressed={selected}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    backgroundColor: selected ? '#FDF5F0' : '#FFFFFF',
                    border: selected ? '2px solid #C9956C' : '0.5px solid #DDDDDD',
                    color: selected ? '#C9956C' : '#2C2C2C',
                    opacity: lengthDisabled ? 0.6 : 1,
                    cursor: lengthDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-t border-gray-200" />

        <div>
          <label className="block text-sm font-medium mb-3">Coupe</label>
          <div className="flex flex-wrap gap-2">
            {['Ajusté', 'Standard', 'Oversize'].map(f => {
              const selected = fit === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFit(selected ? '' : f)}
                  aria-pressed={selected}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    backgroundColor: selected ? '#FDF5F0' : '#FFFFFF',
                    border: selected ? '2px solid #C9956C' : '0.5px solid #DDDDDD',
                    color: selected ? '#C9956C' : '#2C2C2C',
                  }}
                >
                  {f}
                </button>
              );
            })}
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
    <div className="flex gap-2 mb-5">
      <button
        onClick={() => setTab('dressing')}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors"
        style={{
          backgroundColor: tab === 'dressing' ? '#C9956C' : 'transparent',
          color: tab === 'dressing' ? '#FFFFFF' : '#C9956C',
          border: tab === 'dressing' ? '1px solid #C9956C' : '1px solid #C9956C',
        }}
      >
        Mon Dressing
      </button>
      <button
        onClick={() => setTab('wishlist')}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors"
        style={{
          backgroundColor: tab === 'wishlist' ? '#C9956C' : 'transparent',
          color: tab === 'wishlist' ? '#FFFFFF' : '#C9956C',
          border: tab === 'wishlist' ? '1px solid #C9956C' : '1px solid #C9956C',
        }}
      >
        Wishlist 🛍️
      </button>
    </div>
  );

  // Wishlist tab takes over (only when on grid view, not inside add/edit/detail)
  if (tab === 'wishlist' && view === 'grid') {
    return (
      <div className="fade-enter pb-4">
        <h1 className="text-2xl font-serif font-bold mb-4">Ma Garde-robe</h1>
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
      <img src={selectedItem.imageBase64} alt="" className="w-full aspect-square object-contain bg-white rounded-xl card-shadow mb-4" />
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
        <span className="text-sm text-muted-foreground">{filtered.length} pièce{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <button
        onClick={() => { resetForm(); setView('add'); }}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold mb-5 active:scale-[0.98] transition-transform shadow-lg"
      >
        + Ajouter un vêtement
      </button>

      {/* Filters */}
      {wardrobe.length > 0 && (
        <div className="space-y-2 mb-4">
          {/* Ligne 1 : 6 chips catégories simplifiées */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => { setFilterCategory(''); setFilterType(''); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filterCategory === ''
                  ? 'bg-[#C9956C] text-white border-[#C9956C]'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              Toutes
            </button>
            {DRESSING_CATEGORIES.map(g => (
              <button
                key={g.key}
                onClick={() => { setFilterCategory(g.key); setFilterSubcategory(''); setFilterType(''); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filterCategory === g.key
                    ? 'bg-[#C9956C] text-white border-[#C9956C]'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Ligne 2 : dropdown sous-catégorie (si la catégorie en a) */}
          {activeCategory?.subcategories && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <select
                value={filterSubcategory}
                onChange={e => { setFilterSubcategory(e.target.value); setFilterType(''); }}
                className="px-3 py-1.5 rounded-full bg-card card-shadow text-sm outline-none"
              >
                <option value="">{activeCategory.allLabel}</option>
                {activeCategory.subcategories.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ligne 3 : dropdown type précis */}
          {activeCategory && (activeSubcategory || !activeCategory.subcategories) && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-card card-shadow text-sm outline-none"
              >
                <option value="">
                  {activeSubcategory ? activeSubcategory.allLabel : activeCategory.allLabel}
                </option>
                {(activeSubcategory ? activeSubcategory.types : activeCategory.types ?? []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ligne 3 : Couleur & Saison */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => { setSelectedItem(item); setView('detail'); }}
              className="aspect-square rounded-lg overflow-hidden card-shadow active:scale-[0.96] transition-transform bg-white"
            >
              <img src={item.imageBase64} alt={item.type} className="w-full h-full object-contain" />
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
