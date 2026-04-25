// src/lib/imageUtils.ts
// Compression image + correction orientation EXIF via Canvas
// maxSize : 800px par défaut (400px pour les photos inspiration style)
// Format sortie : JPEG qualité 0.7
// Conserve le ratio original, corrige la rotation EXIF

export function compressImage(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;

      // 1. Lire l'orientation EXIF
      const orientation = getExifOrientation(arrayBuffer);

      // 2. Créer l'image depuis le fichier
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 3. Si rotation 90° ou 270°, inverser width/height
        const rotated = [5, 6, 7, 8].includes(orientation);
        let drawWidth = rotated ? height : width;
        let drawHeight = rotated ? width : height;

        // 4. Redimensionner si nécessaire
        if (drawWidth > maxSize || drawHeight > maxSize) {
          if (drawWidth > drawHeight) {
            drawHeight = (drawHeight / drawWidth) * maxSize;
            drawWidth = maxSize;
          } else {
            drawWidth = (drawWidth / drawHeight) * maxSize;
            drawHeight = maxSize;
          }
        }

        canvas.width = drawWidth;
        canvas.height = drawHeight;
        const ctx = canvas.getContext('2d')!;

        // 5. Appliquer la transformation selon l'orientation EXIF
        applyExifTransform(ctx, orientation, drawWidth, drawHeight);

        // 6. Dessiner l'image corrigée
        if (rotated) {
          ctx.drawImage(img, 0, 0, drawHeight, drawWidth);
        } else {
          ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = reject;
      img.src = url;
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file); // ← ArrayBuffer pour lire l'EXIF
  });
}

// Lit le tag EXIF Orientation depuis le binaire du fichier
function getExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xFFD8) return 1; // Pas un JPEG

  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint16(offset, false) === 0xFFE1) {
      const little = view.getUint16(offset + 10, false) === 0x4949;
      const tags = view.getUint16(offset + 14, little);
      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + 16 + i * 12, little) === 0x0112) {
          return view.getUint16(offset + 16 + i * 12 + 8, little);
        }
      }
    }
    offset += 2 + view.getUint16(offset + 2, false);
  }
  return 1; // Orientation par défaut : normale
}

// Applique la rotation/flip canvas selon la valeur EXIF
function applyExifTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
) {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, height, width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
    default: break; // orientation 1 = rien à faire
  }
}

// Réapplique une rotation manuelle (en degrés) sur une image déjà compressée.
// Conserve le ratio de l'image source.
export function recompressWithRotation(
  imgSrc: string,
  _file: File,
  rotation: number,
  maxSize = 800,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Si rotation 90° ou 270°, on inverse les dimensions de sortie
      const swap = Math.abs(rotation % 180) === 90;
      let outW = swap ? height : width;
      let outH = swap ? width : height;

      if (outW > maxSize || outH > maxSize) {
        if (outW > outH) {
          outH = (outH / outW) * maxSize;
          outW = maxSize;
        } else {
          outW = (outW / outH) * maxSize;
          outH = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d')!;

      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const drawW = swap ? outH : outW;
      const drawH = swap ? outW : outH;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
}
