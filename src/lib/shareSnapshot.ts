import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { toBlob } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import OutfitGalleryCard from '@/components/OutfitGalleryCard';
import { ClothingItem, Outfit } from './types';
import { SHARE_BACKGROUND_URL } from './constants';

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 5000);
      });
    }),
  );
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => setTimeout(r, 200));
}

/**
 * Render the OutfitGalleryCard off-screen, capture as JPEG via html-to-image,
 * upload to Supabase Storage (bucket "outfit-shares"), return the public URL.
 */
export async function generateAndUploadShareSnapshot(
  outfit: Outfit,
  items: ClothingItem[],
  pseudo: string | null,
): Promise<string | null> {
  console.log('1. Début génération snapshot');
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) return null;

  // Off-screen container
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:360px;height:auto;pointer-events:none;opacity:0;z-index:-1';
  document.body.appendChild(host);

  const inner = document.createElement('div');
  inner.style.cssText = 'width:360px';
  host.appendChild(inner);

  const root = createRoot(inner);
  try {
    // Précharger le fond avant tout
    await new Promise<void>((resolve) => {
      const preload = new window.Image();
      preload.crossOrigin = 'anonymous';
      preload.onload = () => resolve();
      preload.onerror = () => resolve();
      preload.src = SHARE_BACKGROUND_URL;
    });

    root.render(
      createElement(OutfitGalleryCard, {
        outfit,
        items,
        pseudo,
        hideLike: true,
        hideName: true,
      }),
    );
    console.log('2. Host créé, rendu OutfitGalleryCard');

    // Puis attendre plus longtemps pour le rendu
    await new Promise(r => setTimeout(r, 500));
    const cardEl = inner.querySelector('div > div') as HTMLElement | null;
    const target = cardEl || inner;
    console.log('3. Après attente, target:', target);
    await waitForImages(target);
    console.log('4. Images chargées');
    console.log(
      '4b. Images dans target:',
      Array.from(target.querySelectorAll('img')).map(img => ({
        src: img.src.substring(0, 50),
        complete: img.complete,
        naturalW: img.naturalWidth,
      })),
    );

    const blob = await toBlob(target, {
      quality: 0.85,
      pixelRatio: window.devicePixelRatio || 2,
      skipFonts: true,
    });
    console.log('5. Blob généré:', blob?.size, blob?.type);
    if (!blob) return null;

    const path = `${userId}/${outfit.id}.jpg`;
    const { error } = await supabase.storage
      .from('outfit-shares')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });
    console.log('6. Upload result:', error);
    if (error) {
      console.error('Snapshot upload failed:', error);
      return null;
    }
    const { data } = supabase.storage.from('outfit-shares').getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    console.log('7. snapshot URL:', publicUrl);
    return publicUrl;
  } catch (e) {
    console.error('Snapshot generation failed:', e);
    return null;
  } finally {
    try { root.unmount(); } catch {}
    host.remove();
  }
}

