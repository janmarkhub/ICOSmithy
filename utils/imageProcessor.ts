
import { CustomSticker, BatchEffects, StickerTexture } from '../types';

export const DEFAULT_EFFECTS: BatchEffects = {
  outlineWidth: 0,
  outlineColor: '#ffffff',
  outlineOpacity: 1,
  outlineStyle: 'solid',
  outlineNoise: 0,
  waveAmplitude: 5,
  waveFrequency: 10,
  dashPattern: [10, 5],
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
  // Animation settings
  isAnimated: false,
  animationType: 'float',
  animationSpeed: 5,
  animationIntensity: 20,
  animationFrameCount: 12,
  animationFrameMode: 'linear',
  animationVicinityRange: 10,
  // Procedural
  asciiMode: false,
  enchantmentGlint: false,
  crtEffect: false,
  creeperOverlay: false
};

export function calculateFidelity(img: HTMLImageElement): number {
    const area = img.width * img.height;
    return Math.min(100, Math.sqrt(area) / 1024 * 100);
}

function applyTexture(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, texture: StickerTexture) {
  if (texture === 'none') return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  if (texture === 'foil') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#fff'); grad.addColorStop(0.5, '#888'); grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, w, h);
  } else if (texture === 'holo') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    for(let i=0; i<=1; i+=0.2) grad.addColorStop(i, `hsla(${i*360}, 70%, 50%, 0.4)`);
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
  } else if (texture === 'realistic') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
    for(let i=0; i<3; i++) {
        ctx.beginPath(); ctx.moveTo(x, y + Math.random()*h); ctx.lineTo(x+w, y + Math.random()*h); ctx.stroke();
    }
  }
  ctx.restore();
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

    const localSharpness = effects.normalizeInputs ? Math.max(0, 100 - fidelityFactor) : 0;
    
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (cropBox) {
      sy = (cropBox[0] / 1000) * img.height; sx = (cropBox[1] / 1000) * img.width;
      sh = ((cropBox[2] - cropBox[0]) / 1000) * img.height; sw = ((cropBox[3] - cropBox[1]) / 1000) * img.width;
    }

    const padding = targetSize * 0.12;
    const drawSize = targetSize - padding * 2;
    const scaleFactor = Math.min(drawSize / sw, drawSize / sh);
    
    let animScale = 1;
    let animRotate = 0;
    let animX = (targetSize - sw * scaleFactor) / 2;
    let animY = (targetSize - sh * scaleFactor) / 2;

    if (effects.isAnimated) {
      const time = Date.now() / 1000;
      const speed = effects.animationSpeed;
      const intensity = effects.animationIntensity / 100;

      if (effects.animationType === 'float') animY += Math.sin(time * speed) * 15 * intensity;
      else if (effects.animationType === 'pulse') animScale += Math.sin(time * speed) * 0.15 * intensity;
      else if (effects.animationType === 'spin') animRotate = time * speed * 30 * intensity;
      else if (effects.animationType === 'jitter') {
        animX += (Math.random() - 0.5) * 10 * intensity;
        animY += (Math.random() - 0.5) * 10 * intensity;
      }
      else if (effects.animationType === 'bounce') animY -= Math.abs(Math.sin(time * speed)) * 30 * intensity;
    }

    const dw = sw * scaleFactor * animScale;
    const dh = sh * scaleFactor * animScale;
    const dx = (targetSize - dw) / 2;
    const dy = (targetSize - dh) / 2;

    ctx.imageSmoothingEnabled = fidelityFactor > 20 && effects.pixelDepth === 'none'; 
    ctx.imageSmoothingQuality = 'high';

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetSize; maskCanvas.height = targetSize;
    const mctx = maskCanvas.getContext('2d')!;
    
    mctx.save();
    mctx.translate(targetSize/2, targetSize/2);
    mctx.rotate(animRotate * Math.PI / 180);
    mctx.translate(-targetSize/2, -targetSize/2);
    
    if (effects.cornerRadius > 0) {
        mctx.beginPath(); mctx.roundRect(dx, dy, dw, dh, (effects.cornerRadius/100)*(dw/2)); mctx.clip();
    }
    mctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    mctx.restore();

    ctx.save();
    let filterStr = `brightness(${effects.brightness}%) contrast(${effects.contrast}%) saturate(${effects.saturation}%) hue-rotate(${effects.hueRotate}deg)`;
    ctx.filter = filterStr;
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();

    if (effects.outlineWidth > 0) {
        ctx.save();
        const thickness = effects.outlineWidth * (targetSize / 512);
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = effects.outlineColor;
        ctx.globalAlpha = effects.outlineOpacity;
        for(let i=0; i<360; i += 15) {
            let a = (i * Math.PI) / 180;
            ctx.drawImage(maskCanvas, Math.cos(a)*thickness, Math.sin(a)*thickness);
        }
        ctx.restore();
    }

    // Enchantment Glint
    if (effects.enchantmentGlint) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        const time = Date.now() / 1500;
        const grad = ctx.createLinearGradient(0, 0, targetSize, targetSize);
        grad.addColorStop((time % 1), 'rgba(128, 0, 255, 0)');
        grad.addColorStop(((time + 0.1) % 1), 'rgba(200, 100, 255, 0.6)');
        grad.addColorStop(((time + 0.2) % 1), 'rgba(128, 0, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,targetSize,targetSize);
        ctx.restore();
    }

    // Creeper Face Overlay
    if (effects.creeperOverlay) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        const unit = targetSize / 10;
        // Eyes
        ctx.fillRect(unit*2, unit*2, unit*2, unit*2);
        ctx.fillRect(unit*6, unit*2, unit*2, unit*2);
        // Nose/Mouth
        ctx.fillRect(unit*4, unit*4, unit*2, unit*3);
        ctx.fillRect(unit*3, unit*5, unit*1, unit*3);
        ctx.fillRect(unit*6, unit*5, unit*1, unit*3);
        ctx.restore();
    }

    if (effects.crtEffect) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000';
        for (let i=0; i<targetSize; i+=4) ctx.fillRect(0, i, targetSize, 1);
        ctx.restore();
    }

    canvas.toBlob((b) => b ? resolve(b) : reject('Blob failed'), 'image/png');
  });
}
