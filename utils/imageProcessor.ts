
import { CustomSticker, BatchEffects, StickerTexture } from '../types';

export const DEFAULT_EFFECTS: BatchEffects = {
  outlineWidth: 0,
  outlineColor: '#ffffff',
  outlineOpacity: 1,
  outlineStyle: 'solid',
  outlineNoise: 0,
  waveAmplitude: 5,
  waveFrequency: 10,
  dashPattern: [10, 10],
  glowBlur: 0,
  glowColor: '#4f46e5',
  glowOpacity: 0.5,
  glowNoise: 0,
  innerGlowBlur: 0,
  innerGlowColor: '#ffffff',
  innerGlowOpacity: 0.5,
  bevelSize: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  shadowX: 0,
  shadowY: 4,
  shadowBlur: 10,
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  cornerRadius: 0,
  sharpness: 0,
  edgeClamping: 0,
  isPixelArt: false,
  pixelDepth: 'none',
  autoFit: true,
  activeStickers: [],
  customStickers: [],
  rgbCycle: false,
  rgbSplit: 0,
  tvNoise: 0,
  pixelSort: 0,
  fisheye: 0,
  duotone: false,
  duotoneColor1: '#000000',
  duotoneColor2: '#ffffff',
  dither: false,
  scanlines: 0,
  chromaticAberration: 0,
  sheenIntensity: 0,
  sheenAngle: 45,
  sparkleIntensity: 0,
  halftoneIntensity: 0,
  stickerMode: false,
  metallicIntensity: 0,
  vignette: 0,
  longShadowLength: 0,
  longShadowOpacity: 0.3,
  glassBlur: 0,
  glassOpacity: 0,
  finishType: 'none',
  finishOpacity: 0.8,
  removeBackground: true, 
  normalizeInputs: true,
  smartUpscaleIntensity: 50,
  isAnimated: false,
  animationType: 'float',
  animationSpeed: 5,
  animationIntensity: 20,
  animationFrameCount: 12,
  animationFrameMode: 'linear',
  animationVicinityRange: 10,
  asciiMode: false,
  enchantmentGlint: false,
  crtEffect: false,
  creeperOverlay: false,
  sepiaTone: 0,
  blurIntensity: 0,
  cleanupIntensity: 30, // Default to a moderate cleanup
  lineartMode: false
};

export function calculateFidelity(img: HTMLImageElement): number {
    const area = img.width * img.height;
    return Math.min(100, Math.sqrt(area) / 1024 * 100);
}

/**
 * High-precision alpha scrubbing with noise island removal.
 */
export async function removeBgAndCenter(img: HTMLImageElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const edgeColors: {r:number, g:number, b:number}[] = [];
    const step = Math.max(1, Math.floor(canvas.width / 40));
    for (let x=0; x<canvas.width; x+=step) {
      const t = x*4; edgeColors.push({r:data[t], g:data[t+1], b:data[t+2]});
      const b = ((canvas.height-1)*canvas.width+x)*4; edgeColors.push({r:data[b], g:data[b+1], b:data[b+2]});
    }
    for (let y=0; y<canvas.height; y+=step) {
      const l = (y*canvas.width)*4; edgeColors.push({r:data[l], g:data[l+1], b:data[l+2]});
      const r = (y*canvas.width+(canvas.width-1))*4; edgeColors.push({r:data[r], g:data[r+1], b:data[r+2]});
    }

    const med = edgeColors.sort((a,b) => (a.r+a.g+a.b) - (b.r+b.g+b.b))[Math.floor(edgeColors.length/2)];
    const bgR = med.r, bgG = med.g, bgB = med.b;

    // First pass: Basic thresholding
    const tolerance = 95; 
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasContent = false;

    for (let i = 0; i < data.length; i += 4) {
        const d = Math.sqrt(Math.pow(data[i]-bgR,2) + Math.pow(data[i+1]-bgG,2) + Math.pow(data[i+2]-bgB,2));
        if (data[i+3] > 10 && d > tolerance) {
            const x = (i/4) % canvas.width;
            const y = Math.floor((i/4) / canvas.width);
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            hasContent = true;
        } else {
            data[i+3] = 0;
        }
    }

    // Second pass: Island removal (removes isolated noise pixels)
    if (hasContent) {
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
                const i = (y * canvas.width + x) * 4;
                if (data[i+3] > 0) {
                    // Check neighbors
                    let neighbors = 0;
                    if (data[i-4+3] > 0) neighbors++;
                    if (data[i+4+3] > 0) neighbors++;
                    if (data[i-(canvas.width*4)+3] > 0) neighbors++;
                    if (data[i+(canvas.width*4)+3] > 0) neighbors++;
                    // If no neighbors, it's noise
                    if (neighbors === 0) data[i+3] = 0;
                }
            }
        }
    }

    if (!hasContent) return new Promise((res) => canvas.toBlob(b => res(b!), 'image/png'));

    const contentW = maxX - minX + 1;
    const contentH = maxY - minY + 1;
    const final = document.createElement('canvas');
    const size = 1024;
    final.width = size;
    final.height = size;
    const fctx = final.getContext('2d')!;
    fctx.imageSmoothingEnabled = false;

    const drawArea = size * 0.9;
    const scale = Math.min(drawArea / contentW, drawArea / contentH);
    const dw = contentW * scale;
    const dh = contentH * scale;
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;

    const temp = document.createElement('canvas');
    temp.width = img.width; temp.height = img.height;
    temp.getContext('2d')!.putImageData(imageData, 0, 0);

    fctx.clearRect(0, 0, size, size);
    fctx.drawImage(temp, minX, minY, contentW, contentH, dx, dy, dw, dh);

    return new Promise((res) => final.toBlob(b => res(b!), 'image/png'));
}

/**
 * Smart Denoise: Smooths flat areas while preserving high-contrast edges.
 */
function smartDenoise(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
    if (intensity <= 0) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);
    
    // Simple 3x3 selective median/blur
    const threshold = 15 + (intensity * 0.5); // Color difference threshold
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            if (data[i+3] === 0) continue;

            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            const rRef = data[i], gRef = data[i+1], bRef = data[i+2];

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ni = ((y + dy) * width + (x + dx)) * 4;
                    const nr = copy[ni], ng = copy[ni+1], nb = copy[ni+2];
                    
                    const diff = Math.abs(nr - rRef) + Math.abs(ng - gRef) + Math.abs(nb - bRef);
                    if (diff < threshold) {
                        rSum += nr; gSum += ng; bSum += nb; count++;
                    }
                }
            }

            if (count > 0) {
                data[i] = rSum / count;
                data[i+1] = gSum / count;
                data[i+2] = bSum / count;
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

export async function upscaleAndEditImage(
  source: HTMLImageElement | Blob, 
  targetSize: number, 
  effects: BatchEffects,
  cropBox?: [number, number, number, number],
  fidelityFactor: number = 100
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    let img: HTMLImageElement;
    if (source instanceof Blob) {
      img = new Image();
      const url = URL.createObjectURL(source);
      await new Promise((res) => { img.onload = res; img.src = url; });
      URL.revokeObjectURL(url);
    } else { img = source; }

    const canvas = document.createElement('canvas');
    canvas.width = targetSize; canvas.height = targetSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = !effects.isPixelArt;
    if (!effects.isPixelArt && ctx.imageSmoothingEnabled) {
        ctx.imageSmoothingQuality = 'high';
    }

    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (cropBox) {
      sy = (cropBox[0] / 1000) * img.height; sx = (cropBox[1] / 1000) * img.width;
      sh = ((cropBox[2] - cropBox[0]) / 1000) * img.height; sw = ((cropBox[3] - cropBox[1]) / 1000) * img.width;
    }

    let margin = targetSize * 0.15;
    if (effects.autoFit) {
      const extra = Math.max(effects.outlineWidth, effects.glowBlur, effects.shadowBlur);
      margin += extra * (targetSize / 512);
    }

    const drawSize = targetSize - margin * 2;
    const scaleFactor = Math.min(drawSize / sw, drawSize / sh);
    const dw = sw * scaleFactor;
    const dh = sh * scaleFactor;
    const dx = (targetSize - dw) / 2;
    const dy = (targetSize - dh) / 2;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetSize; maskCanvas.height = targetSize;
    const mctx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
    mctx.imageSmoothingEnabled = !effects.isPixelArt;
    mctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    if (effects.removeBackground) {
        const mData = mctx.getImageData(0,0,targetSize,targetSize);
        const d = mData.data;
        const br = d[0], bg = d[1], bb = d[2];
        const tol = 110; 
        for (let i=0; i<d.length; i+=4) {
            const dist = Math.sqrt(Math.pow(d[i]-br,2) + Math.pow(d[i+1]-bg,2) + Math.pow(d[i+2]-bb,2));
            if (dist < tol) d[i+3] = 0;
        }
        mctx.putImageData(mData, 0, 0);
    }

    if (effects.lineartMode) {
        const mData = mctx.getImageData(0,0,targetSize,targetSize);
        const d = mData.data;
        const out = new Uint8ClampedArray(d.length);
        for (let y=1; y<targetSize-1; y++) {
            for (let x=1; x<targetSize-1; x++) {
                const i = (y * targetSize + x) * 4;
                if (d[i+3] < 10) continue;
                // Sobel-like edge detection
                const dx = Math.abs(d[i+4] - d[i-4]) + Math.abs(d[i+4+3] - d[i-4+3]);
                const dy = Math.abs(d[i+targetSize*4] - d[i-targetSize*4]) + Math.abs(d[i+targetSize*4+3] - d[i-targetSize*4+3]);
                if (dx + dy > 120) {
                   out[i] = 0; out[i+1] = 0; out[i+2] = 0; out[i+3] = 255;
                }
            }
        }
        mctx.putImageData(new ImageData(out, targetSize, targetSize), 0, 0);
    }

    if (effects.cleanupIntensity > 0) {
        smartDenoise(mctx, targetSize, targetSize, effects.cleanupIntensity);
    }

    ctx.save();
    if (effects.shadowOpacity > 0) {
        ctx.shadowBlur = effects.shadowBlur * (targetSize / 512);
        ctx.shadowColor = effects.shadowColor;
        ctx.shadowOffsetX = effects.shadowX * (targetSize / 512);
        ctx.shadowOffsetY = effects.shadowY * (targetSize / 512);
        ctx.globalAlpha = effects.shadowOpacity;
        ctx.drawImage(maskCanvas, 0, 0);
    }
    if (effects.glowOpacity > 0) {
        ctx.shadowBlur = effects.glowBlur * (targetSize / 512);
        ctx.shadowColor = effects.glowColor;
        ctx.globalAlpha = effects.glowOpacity;
        for(let i=0; i<2; i++) ctx.drawImage(maskCanvas, 0, 0);
    }
    ctx.restore();

    if (effects.outlineWidth > 0) {
        ctx.save();
        const thickness = effects.outlineWidth * (targetSize / 512);
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = effects.outlineColor;
        ctx.globalAlpha = effects.outlineOpacity;
        for(let i=0; i<360; i += 20) {
            let a = (i * Math.PI) / 180;
            ctx.drawImage(maskCanvas, Math.cos(a) * thickness, Math.sin(a) * thickness);
        }
        ctx.restore();
    }

    ctx.save();
    ctx.filter = `brightness(${effects.brightness}%) contrast(${effects.contrast}%) saturate(${effects.saturation}%) hue-rotate(${effects.hueRotate}deg)`;
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();

    canvas.toBlob((b) => b ? resolve(b) : reject('Blob failed'), 'image/png');
  });
}
