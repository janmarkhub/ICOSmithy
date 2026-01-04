
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
  removeBackground: false,
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
  blurIntensity: 0
};

export function calculateFidelity(img: HTMLImageElement): number {
    const area = img.width * img.height;
    return Math.min(100, Math.sqrt(area) / 1024 * 100);
}

/**
 * Aggressive Alpha Scrubbing.
 * Sampler iterates entire image to find most common background "island" 
 * then flood-replaces or color-keys based on distance.
 */
export async function removeBgAndCenter(img: HTMLImageElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample several points along the edges to find the most likely background color
    const samples: { r: number, g: number, b: number }[] = [];
    const step = 4;
    for (let x = 0; x < canvas.width; x += step) {
        let i = x * 4;
        samples.push({ r: data[i], g: data[i+1], b: data[i+2] });
        i = ((canvas.height - 1) * canvas.width + x) * 4;
        samples.push({ r: data[i], g: data[i+1], b: data[i+2] });
    }
    for (let y = 0; y < canvas.height; y += step) {
        let i = (y * canvas.width) * 4;
        samples.push({ r: data[i], g: data[i+1], b: data[i+2] });
        i = (y * canvas.width + (canvas.width - 1)) * 4;
        samples.push({ r: data[i], g: data[i+1], b: data[i+2] });
    }

    // Find the median-ish color to avoid outlier noise
    const medianColor = samples.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b))[Math.floor(samples.length / 2)];
    const bgR = medianColor.r, bgG = medianColor.g, bgB = medianColor.b;

    const tolerance = 80; // High tolerance for noisy JPEG sprite sheets
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasContent = false;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            
            const diff = Math.sqrt(
                Math.pow(r - bgR, 2) + 
                Math.pow(g - bgG, 2) + 
                Math.pow(b - bgB, 2)
            );

            // If we are far enough from the background color
            if (a > 10 && diff > tolerance) {
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
                hasContent = true;
            } else {
                data[i+3] = 0; // Scrub
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

    // For pixel art, we disable smoothing during the recenter/rescale process
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

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
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

    // Pixel Art Mode: Disable all smoothing
    if (effects.isPixelArt) {
        ctx.imageSmoothingEnabled = false;
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
    if (effects.isPixelArt) mctx.imageSmoothingEnabled = false;

    mctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    // Alpha Scrub during process if enabled
    if (effects.removeBackground) {
        const mData = mctx.getImageData(0,0,targetSize,targetSize);
        const d = mData.data;
        const br = d[0], bg = d[1], bb = d[2];
        const tol = 100; // Aggressive
        for (let i=0; i<d.length; i+=4) {
            const dist = Math.sqrt(Math.pow(d[i]-br,2) + Math.pow(d[i+1]-bg,2) + Math.pow(d[i+2]-bb,2));
            if (dist < tol) d[i+3] = 0;
        }
        mctx.putImageData(mData, 0, 0);
    }

    // 1. Draw Shadows & Glow
    if (effects.shadowOpacity > 0 || effects.glowOpacity > 0) {
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
            for(let i=0; i<3; i++) ctx.drawImage(maskCanvas, 0, 0);
        }
        ctx.restore();
    }

    // 2. Draw Outlines
    if (effects.outlineWidth > 0) {
        ctx.save();
        const thickness = effects.outlineWidth * (targetSize / 512);
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = effects.outlineColor;
        ctx.globalAlpha = effects.outlineOpacity;
        
        const steps = 360 / 15;
        for(let i=0; i<360; i += 15) {
            let a = (i * Math.PI) / 180;
            let ox = Math.cos(a) * thickness;
            let oy = Math.sin(a) * thickness;
            
            if (effects.outlineStyle === 'wavy') {
                const wave = Math.sin((i / 360) * Math.PI * 2 * effects.waveFrequency) * effects.waveAmplitude;
                ox += Math.cos(a) * wave;
                oy += Math.sin(a) * wave;
            } else if (effects.outlineStyle === 'dotted') {
                if (Math.floor(i / 30) % 2 === 0) continue; 
            } else if (effects.outlineStyle === 'pixelated') {
                ox = Math.round(ox / 4) * 4;
                oy = Math.round(oy / 4) * 4;
            }
            
            ctx.drawImage(maskCanvas, ox, oy);
        }
        ctx.restore();
    }

    // 3. Final Composite
    ctx.save();
    ctx.filter = `brightness(${effects.brightness}%) contrast(${effects.contrast}%) saturate(${effects.saturation}%) hue-rotate(${effects.hueRotate}deg)`;
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();

    canvas.toBlob((b) => b ? resolve(b) : reject('Blob failed'), 'image/png');
  });
}
