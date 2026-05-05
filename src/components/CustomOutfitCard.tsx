import { useState, useMemo } from 'react';
import { ClothingItem, UserProfile, STYLE_OPTIONS } from '@/lib/types';
import { buildValidCustomOutfit } from '@/lib/recommendations';
import { addOutfit, genId, saveLastOutfit } from '@/lib/storage';
import { getStylingTips } from '@/lib/stylingTips';
import { updateStreak } from '@/lib/streak';
import { getCategoryByType } from '@/lib/categories';
import { toast } from 'sonner';

const ROSE_GOLD = '#C9956C';

type EditorCatKey = 'haut' | 'bas' | 'chaussures' | 'sac' | 'accessoire';

const EDITOR_CATS: { key: EditorCatKey; label: string; matches: string[] }[] = [
  { key: 'haut', label: 'Haut', matches: ['Hauts', 'Pulls & sweats', 'Manteaux & vestes', 'Robes & combinaisons'] },
  { key: 'bas', label: 'Bas', matches: ['Bas', 'Jupes'] },
  { key: 'chaussures', label: 'Chaussures', matches: ['Chaussures'] },
  { key: 'sac', label: 'Sac', matches: ['Sacs'] },
  { key: 'accessoire', label: 'Accessoire', matches: ['Accessoires'] },
];

function itemMatchesCat(catKey: EditorCatKey, item: ClothingItem): boolean {
  const cat = getCategoryByType(item.type)?.name || item.category || '';
  const target = EDITOR_CATS.find(c => c.key === catKey);
  return !!target && target.matches.includes(cat);
}

const ALL_OCCASIONS = [
  'Travail', 'Sortie', 'Sport', 'Événement', 'Mariage', 'Voyage', 'Plage', 'Quotidien'
];

const PIECE_TABS: { label: string; categories: string[] }[] = [
  { label: 'Hauts', categories: ['Hauts'] },
  { label: 'Pulls', categories: ['Pulls & sweats'] },
  { label: 'Vestes', categories: ['Manteaux & vestes'] },
  { label: 'Robes/Combinaison', categories: ['Robes & combinaisons'] },
  { label: 'Bas', categories: ['Bas', 'Jupes'] },
  { label: 'Chaussures', categories: ['Chaussures'] },
  { label: 'Sacs', categories: ['Sacs'] },
  { label: 'Accessoires', categories: ['Accessoires'] },
];

interface Props {
  wardrobe: ClothingItem[];
  temperature: number | null;
  weatherCode: number | null;
  userProfile?: UserProfile | null;
}

export default function CustomOutfitCard({ wardrobe, temperature, weatherCode }: Props) {
  const [occasion, setOccasion] = useState('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [generatedOutfit, setGeneratedOutfit] = useState<ClothingItem[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(PIECE_TABS[0].label);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editPieces, setEditPieces] = useState<ClothingItem[]>([]);
  const [pickerCat, setPickerCat] = useState<EditorCatKey | null>(null);

  const openEditor = () => {
    if (!generatedOutfit) return;
    setEditPieces([...generatedOutfit]);
    setPickerCat(null);
    setEditing(true);
  };
  const closeEditor = () => { setEditing(false); setEditPieces([]); setPickerCat(null); };
  const removePiece = (id: string) => setEditPieces(prev => prev.filter(p => p.id !== id));
  const addPieceFromItem = (item: ClothingItem) => {
    if (editPieces.some(p => p.id === item.id)) { setPickerCat(null); return; }
    setEditPieces(prev => [...prev, item]);
    setPickerCat(null);
  };
  const saveEditor = () => {
    if (editPieces.length < 1) return;
    setGeneratedOutfit([...editPieces]);
    setSaved(false);
    toast("Tenue mise à jour ✨", { style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' } });
    closeEditor();
  };
  const editorFilteredWardrobe = pickerCat ? wardrobe.filter(w => itemMatchesCat(pickerCat, w)) : [];

  const filteredWardrobe = useMemo(() => {
    const tab = PIECE_TABS.find(t => t.label === activeTab);
    if (!tab) return wardrobe;
    return wardrobe.filter(item => tab.categories.includes(item.category));
  }, [wardrobe, activeTab]);

  const hasFilter = occasion || selectedItem || selectedStyle;

  const handleGenerate = () => {
    if (!hasFilter) return;
    setGenerating(true);

    const outfit = buildValidCustomOutfit(
      wardrobe,
      selectedItem,
      occasion || 'Quotidien',
      selectedStyle || '',
      new Set<string>(),
      5,
    );

    if (!outfit) {
      toast("Pas assez de pièces pour une tenue complète ✨ Ajoute un haut, un bas et des chaussures !", {
        duration: 3500,
      });
      setGenerating(false);
      return;
    }

    setGeneratedOutfit(outfit);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedOutfit || saving) return;
    setSaving(true);
    try {
      const ids = generatedOutfit.map(i => i.id);
      await saveLastOutfit(ids);
      await addOutfit({
        id: genId(),
        name: 'Tenue perso du ' + new Date().toLocaleDateString('fr-FR'),
        itemIds: ids,
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
      updateStreak();
      toast.success('Tenue sauvegardée ! ✨', {
        style: { backgroundColor: '#C9956C', color: '#FFFFFF', border: 'none' },
        duration: 2000,
      });
    } catch (e) {
      console.error('Erreur sauvegarde tenue:', e);
      toast.error('Erreur lors de la sauvegarde, réessaie.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setGeneratedOutfit(null);
    setSaved(false);
  };

  const tips = generatedOutfit ? getStylingTips(generatedOutfit, weatherCode, temperature) : null;

  // Show result card
  if (generatedOutfit) {
    return (
      <div className="bg-card rounded-xl overflow-hidden card-shadow" style={{ border: `2px solid ${ROSE_GOLD}` }}>
        <div className="p-4">
          <p className="text-sm font-serif font-semibold text-center mb-3" style={{ color: ROSE_GOLD }}>
            Ta tenue personnalisée ✨
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {generatedOutfit.map(item => (
              <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {generatedOutfit.map(item => (
              <span key={item.id} className="chip text-xs py-1 px-2.5">{item.type}</span>
            ))}
          </div>

          {tips && (
            <div className="border-t border-border px-2 py-2 rounded-b-lg mb-3" style={{ backgroundColor: '#F5F0EB' }}>
              <p className="text-[10px] leading-tight mb-1">
                <span className="text-muted-foreground">✨ </span>
                <span style={{ color: ROSE_GOLD }}>{tips.beauty}</span>
              </p>
              <p className="text-[10px] leading-tight mb-1">
                <span className="text-muted-foreground">💇 </span>
                <span style={{ color: ROSE_GOLD }}>{tips.hair}</span>
              </p>
              <p className="text-[10px] leading-tight">
                <span className="text-muted-foreground">👜 </span>
                <span style={{ color: ROSE_GOLD }}>{tips.accessories}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm active:scale-[0.98] transition-transform"
            >
              Réessayer 🔄
            </button>
            <button
              onClick={openEditor}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm active:scale-[0.98] transition-transform"
              style={{ border: `1.5px solid ${ROSE_GOLD}`, color: ROSE_GOLD, backgroundColor: 'transparent' }}
            >
              ✏️ Modifier
            </button>
            {saved ? (
              <div className="flex-1 py-2.5 rounded-lg font-medium text-sm text-center text-white" style={{ backgroundColor: '#2E7D32' }}>
                ✅ Sauvegardée !
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{ backgroundColor: ROSE_GOLD }}
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder 💾'}
              </button>
            )}
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <div className="p-4 pb-24 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={closeEditor} className="text-2xl" aria-label="Fermer">←</button>
                <h1 className="text-xl font-serif font-bold">Modifier la tenue ✨</h1>
              </div>

              <div className="bg-card rounded-2xl card-shadow p-3 mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Pièces de la tenue ({editPieces.length})
                </p>
                {editPieces.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">Ajoute des pièces ci-dessous ✨</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {editPieces.map(item => (
                      <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={item.imageBase64} alt={item.type} className="w-full h-full object-contain" />
                        <button
                          onClick={() => removePiece(item.id)}
                          aria-label="Retirer"
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 text-white text-xs font-bold flex items-center justify-center active:scale-90"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-muted-foreground mb-2">Ajouter une pièce</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EDITOR_CATS.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setPickerCat(c.key)}
                    className="px-4 py-2 rounded-full text-xs font-medium active:scale-95 transition-transform"
                    style={{ border: `1px solid ${ROSE_GOLD}`, color: ROSE_GOLD, background: 'transparent' }}
                  >
                    + {c.label}
                  </button>
                ))}
              </div>

              {pickerCat && (
                <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setPickerCat(null)}>
                  <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
                  <div
                    className="relative w-full bg-card rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto animate-slide-in-bottom"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                    <h3 className="font-serif font-bold text-lg mb-3">
                      {EDITOR_CATS.find(c => c.key === pickerCat)?.label}
                    </h3>
                    {editorFilteredWardrobe.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">Aucune pièce dans cette catégorie</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {editorFilteredWardrobe.map(item => (
                          <button
                            key={item.id}
                            onClick={() => addPieceFromItem(item)}
                            className="aspect-square rounded-lg overflow-hidden bg-white active:scale-[0.96] transition-transform"
                          >
                            <img src={item.imageBase64} alt={item.type} className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={closeEditor}
                  className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEditor}
                  disabled={editPieces.length < 1}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{ backgroundColor: ROSE_GOLD }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show filter card
  return (
    <div className="bg-card rounded-xl overflow-hidden card-shadow p-4 space-y-4">
      <div className="text-center">
        <p className="text-base font-serif font-semibold">Crée ta tenue du moment ✨</p>
        <p className="text-sm text-muted-foreground mt-1">Dis-nous ce que tu veux porter</p>
      </div>

      {/* Occasion dropdown */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Occasion</label>
        <select
          value={occasion}
          onChange={e => setOccasion(e.target.value)}
          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Pour quelle occasion ?</option>
          {ALL_OCCASIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Wardrobe item selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Autour de quelle pièce ?</label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-2" style={{ scrollbarWidth: 'none' }}>
          {PIECE_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className="flex-shrink-0 text-xs py-1 px-2.5 rounded-full transition-all whitespace-nowrap"
              style={
                activeTab === tab.label
                  ? { backgroundColor: ROSE_GOLD, color: 'white' }
                  : { backgroundColor: '#F5F0EB', color: '#666' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
          {filteredWardrobe.length === 0 ? (
            <p className="col-span-3 text-xs text-muted-foreground italic text-center py-4">Aucune pièce dans cette catégorie.</p>
          ) : filteredWardrobe.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
              className="aspect-square rounded-lg overflow-hidden transition-all"
              style={{
                border: selectedItem?.id === item.id ? `2px solid ${ROSE_GOLD}` : '2px solid transparent',
                opacity: selectedItem && selectedItem.id !== item.id ? 0.5 : 1,
              }}
            >
              <img src={item.imageBase64} alt={item.type} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Style chips */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Quel style ?</label>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => setSelectedStyle(selectedStyle === s.label ? '' : s.label)}
              className="text-xs py-1 px-2.5 rounded-full transition-all"
              style={
                selectedStyle === s.label
                  ? { backgroundColor: ROSE_GOLD, color: 'white' }
                  : { backgroundColor: '#F5F0EB', color: '#666' }
              }
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!hasFilter || generating}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-40"
        style={{ backgroundColor: ROSE_GOLD }}
      >
        {generating ? 'Génération...' : 'Générer ma tenue 🎯'}
      </button>
    </div>
  );
}
