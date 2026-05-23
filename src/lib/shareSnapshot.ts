import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { toBlob } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import OutfitGalleryCard from '@/components/OutfitGalleryCard';
import { ClothingItem, Outfit } from './types';

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
    root.render(
      createElement(OutfitGalleryCard, {
        outfit,
        items,
        pseudo,
        hideLike: true,
        hideName: true,
      }),
    );

    // Wait for React commit, then for images
    await new Promise(r => setTimeout(r, 100));
    const cardEl = inner.querySelector('div > div') as HTMLElement | null;
    const target = cardEl || inner;
    await waitForImages(target);

    const blob = await toBlob(target, {
      quality: 0.85,
      pixelRatio: window.devicePixelRatio || 2,
      skipFonts: true,
    });
    if (!blob) return null;

    const path = `${userId}/${outfit.id}.jpg`;
    const { error } = await supabase.storage
      .from('outfit-shares')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });
    if (error) {
      console.error('Snapshot upload failed:', error);
      return null;
    }
    const { data } = supabase.storage.from('outfit-shares').getPublicUrl(path);
    // Cache-bust so updates refresh
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (e) {
    console.error('Snapshot generation failed:', e);
    return null;
  } finally {
    try { root.unmount(); } catch {}
    host.remove();
  }
}
