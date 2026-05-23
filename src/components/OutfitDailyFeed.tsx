import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClothingItem, OutfitLayoutData, UserProfile } from '@/lib/types';
import { addOutfit, genId, saveLastOutfit, setOutfitShareSnapshot } from '@/lib/storage';
import { generateAndUploadShareSnapshot } from '@/lib/shareSnapshot';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { updateStreak } from '@/lib/streak';
import type { Season } from '@/lib/colorimetry';
import OutfitLayout from '@/components/OutfitLayout';
import OutfitTemplateEditor from '@/components/OutfitTemplateEditor';

export interface OutfitResult {
  outfit: ClothingItem[];
  liked: boolean | null;
  layoutData?: OutfitLayoutData | null;
  savedOutfitId?: string | null;
}

interface Props {
  results: OutfitResult[];
  weatherCode: number | null;
  temperature: number | null;
  userSeason?: Season | null;
  userProfile?: UserProfile | null;
  pseudo?: string | null;
  wardrobe: ClothingItem[];
  onResultsChange?: (next: OutfitResult[]) => void;
}

const ROSE_GOLD = '#C9956C';

export default function OutfitDailyFeed({
  results,
  pseudo,
  wardrobe,
  onResultsChange,
}: Props) {
  const navigate = useNavigate();
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [wornIdx, setWornIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Detect already-worn outfit today
  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data } = await supabase
          .from('user_preferences')
          .select('item_ids')
          .eq('user_id', userData.user.id)
          .eq('reaction', 'portee')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .limit(1);
        if (data && data.length > 0) {
          const wornIds = data[0].item_ids as string[];
          const matchIdx = results.findIndex(
            r =>
              r.outfit.length === wornIds.length &&
              r.outfit.every(item => wornIds.includes(item.id))
          );
          if (matchIdx >= 0) setWornIdx(matchIdx);
        }
      } catch {}
    })();
  }, [today, results]);

  const handleWear = async (items: ClothingItem[], idx: number) => {
    const hour = new Date().getHours();
    if (wornIdx !== null && wornIdx !== idx) {
      if (hour >= 12) {
        toast.error("Tu as déjà choisi ta tenue du jour 😊", {
          description: "Après midi, la tenue est définitivement enregistrée.",
        });
        return;
      }
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('reaction', 'portee')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        }
      } catch {}
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const itemIds = items.map(i => i.id);
      await saveLastOutfit(itemIds);
      await supabase.from('user_preferences').insert({
        user_id: userData.user.id,
        item_ids: itemIds,
        reaction: 'portee',
        created_at: new Date().toISOString(),
      });
      const r = results[idx];
      const newOutfit = {
        id: genId(),
        name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
        itemIds,
        createdAt: new Date().toISOString(),
        layoutData: r.layoutData ?? null,
      };
      await addOutfit(newOutfit);
      (async () => {
        try {
          const { data: prof } = await supabase.from('profiles').select('pseudo').eq('id', userData.user.id).maybeSingle();
          const url = await generateAndUploadShareSnapshot(newOutfit, items, prof?.pseudo ?? null);
          if (url) await setOutfitShareSnapshot(newOutfit.id, url);
        } catch (e) { console.error('snapshot bg', e); }
      })();
      setWornIdx(idx);
      setSavedIdxs(prev => new Set(prev).add(idx));
      updateStreak();
      toast("Belle journée avec cette tenue ! 🌸", {
        style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
      });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEditorSave = async (newItems: ClothingItem[], layoutData: OutfitLayoutData) => {
    if (editingIdx === null) return;
    try {
      const outfitId = genId();
      await addOutfit({
        id: outfitId,
        name: `Tenue du ${new Date().toLocaleDateString('fr-FR')}`,
        itemIds: newItems.map(i => i.id),
        createdAt: new Date().toISOString(),
        layoutData,
      });
      const next = [...results];
      next[editingIdx] = {
        ...next[editingIdx],
        outfit: newItems,
        layoutData,
        savedOutfitId: outfitId,
      };
      onResultsChange?.(next);
      toast("Tenue enregistrée ✨", {
        style: { backgroundColor: ROSE_GOLD, color: '#FFFFFF', border: 'none' },
      });
      setEditingIdx(null);
      navigate('/outfits');
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-2 fade-enter">
      <h2 className="text-lg font-serif font-semibold text-center mb-2">Tes tenues du jour</h2>

      <div className="space-y-4">
        {results.map((r, idx) => {
          const isWorn = wornIdx === idx;
          const isDisliked = r.liked === false;
          const isLocked = !!r.savedOutfitId;

          return (
            <div key={idx} className={isDisliked ? 'opacity-40 pointer-events-none' : ''}>
              <div className="relative">
                <OutfitLayout items={r.outfit} layoutData={r.layoutData ?? null} readOnly />
                <div
                  className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-4"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    height: 36,
                    backdropFilter: 'blur(4px)',
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                    maxWidth: 360,
                    margin: '0 auto',
                  }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
                    ✨ Générée par MyStyl
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
                    @{pseudo || 'moi'}
                  </span>
                </div>
              </div>

              {!isDisliked && (
                <div className="mt-3 space-y-2 max-w-[360px] mx-auto">
                  <button
                    onClick={() => handleWear(r.outfit, idx)}
                    disabled={isWorn}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-80"
                    style={{ backgroundColor: isWorn ? '#4CAF50' : ROSE_GOLD }}
                  >
                    {isWorn ? 'Portée aujourd\'hui 🌸' : '✨ Je la mets !'}
                  </button>

                  {!isLocked && (
                    <button
                      onClick={() => setEditingIdx(idx)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                      style={{
                        border: `1.5px solid ${ROSE_GOLD}`,
                        color: ROSE_GOLD,
                        backgroundColor: 'transparent',
                      }}
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingIdx !== null && (
        <OutfitTemplateEditor
          items={results[editingIdx].outfit}
          initialLayout={results[editingIdx].layoutData ?? null}
          wardrobe={wardrobe}
          onCancel={() => setEditingIdx(null)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
