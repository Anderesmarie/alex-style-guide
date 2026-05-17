// Upload d'images de vêtements vers Supabase Storage (bucket public "wardrobe-images")
// Format : WebP qualité 0.85 — beaucoup plus léger que base64 en DB → réduit l'egress.
import { supabase } from './supabase';

const BUCKET = 'wardrobe-images';

/**
 * Convertit un dataURL (base64) en Blob WebP via canvas.
 */
async function dataUrlToWebpBlob(dataUrl: string, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
        'image/webp',
        quality,
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

/**
 * Upload une image (base64 dataURL) dans wardrobe-images/{userId}/{itemId}.webp
 * et renvoie l'URL publique.
 */
export async function uploadWardrobeImage(
  base64DataUrl: string,
  userId: string,
  itemId: string,
): Promise<string> {
  if (!base64DataUrl.startsWith('data:')) {
    // déjà une URL, pas besoin de réuploader
    return base64DataUrl;
  }
  const blob = await dataUrlToWebpBlob(base64DataUrl, 0.85);
  const path = `${userId}/${itemId}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '31536000',
    });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
