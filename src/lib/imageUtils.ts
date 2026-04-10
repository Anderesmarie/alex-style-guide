function readExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) { resolve(1); return; }
      let offset = 2;
      while (offset < view.byteLength) {
        if (view.getUint16(offset, false) === 0xFFE1) {
          const exifOffset = offset + 10;
          const little = view.getUint16(exifOffset, false) === 0x4949;
          const tags = view.getUint16(exifOffset + 8, little);
          for (let i = 0; i < tags; i++) {
            const tagOffset = exifOffset + 10 + i * 12;
            if (tagOffset + 12 > view.byteLength) break;
            if (view.getUint16(tagOffset, little) === 0x0112) {
              resolve(view.getUint16(tagOffset + 8, little));
              return;
            }
          }
          resolve(1); return;
        }
        offset += 2 + view.getUint16(offset + 2, false);
      }
      resolve(1);
    };
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

function applyOrientation(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  orientation: number,
  size: number,
  sx: number,
  sy: number,
  cropSize: number,
  extraRotation: number,
) {
  canvas.width = size;
  canvas.height = size;

  ctx.save();
  ctx.translate(size / 2, size / 2);

  // EXIF rotation
  if (orientation === 3) ctx.rotate(Math.PI);
  else if (orientation === 6) ctx.rotate(Math.PI / 2);
  else if (orientation === 8) ctx.rotate(-Math.PI / 2);

  // Manual rotation
  if (extraRotation) ctx.rotate((extraRotation * Math.PI) / 180);

  ctx.filter = 'brightness(1.10) contrast(1.05) saturate(1.05)';
  ctx.drawImage(img, sx, sy, cropSize, cropSize, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function compressImage(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    readExifOrientation(file).then((orientation) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          // For orientation 6/8, swap dimensions
          if (orientation === 6 || orientation === 8) {
            [width, height] = [height, width];
          }

          // Square crop centered with 5% zoom
          let cropSize = Math.min(img.naturalWidth, img.naturalHeight);
          let sx = (img.naturalWidth - cropSize) / 2;
          let sy = (img.naturalHeight - cropSize) / 2;
          sx += cropSize * 0.025;
          sy += cropSize * 0.025;
          cropSize *= 0.95;

          const outSize = Math.min(maxSize, Math.min(width, height));

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          applyOrientation(canvas, ctx, img, orientation, outSize, sx, sy, cropSize, 0);

          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });
}

export function recompressWithRotation(
  imgSrc: string,
  file: File,
  rotation: number,
  maxSize = 800,
): Promise<string> {
  return new Promise((resolve, reject) => {
    readExifOrientation(file).then((orientation) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (orientation === 6 || orientation === 8) {
          [width, height] = [height, width];
        }

        let cropSize = Math.min(img.naturalWidth, img.naturalHeight);
        let sx = (img.naturalWidth - cropSize) / 2;
        let sy = (img.naturalHeight - cropSize) / 2;
        sx += cropSize * 0.025;
        sy += cropSize * 0.025;
        cropSize *= 0.95;

        const outSize = Math.min(maxSize, Math.min(width, height));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        applyOrientation(canvas, ctx, img, orientation, outSize, sx, sy, cropSize, rotation);

        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  });
}
