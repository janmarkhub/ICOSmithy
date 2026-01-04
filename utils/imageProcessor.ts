
export interface BatchEffects {
  outlineWidth: number;
  outlineColor: string;
  outlineOpacity: number;
  outlineStyle: 'solid' | 'dashed' | 'rough' | 'blob';
  outlineNoise: number;
  glowBlur: number;
  glowColor: string;
  glowOpacity: number;
  glowNoise: number;
  innerGlowBlur: number;
  innerGlowColor: string;
  innerGlowOpacity: number;
  bevelSize: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOpacity: number;
  cornerRadius: number;
  // Engine
  sharpness: number;
  edgeClamping: number;
  isPixelArt: boolean;
  autoFit: boolean; // NEW: Prevents clipping by shrinking the icon
  // Creative Suite
  longShadowLength: number;
  longShadowOpacity: number;
  glassBlur: number;
  glassOpacity: number;
  scanlines: number;
  chromaticAberration: number;
  sheenIntensity: number;
  sheenAngle: number;
  sparkleIntensity: number;
  halftoneIntensity: number; // Effect 1
  stickerMode: boolean; // Effect 2: Thick white border + hard shadow
  ditherIntensity: number; // Effect 3
  paperTexture: number; // Effect 4
  metallicIntensity: number; // Effect 5
  vignette: number; // Effect 6
  // Premium Finishes
  finishType: 'none' | 'gold' | 'silver' | 'foil' | 'holo';
  finishOpacity: number;
}

export const DEFAULT_EFFECTS: BatchEffects = {
  outlineWidth: 0,
  outlineColor: '#ffffff',
  outlineOpacity: 1,
  outlineStyle: 'solid',
  outlineNoise: 0,
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
  autoFit: true,
  longShadowLength: 0,
  longShadowOpacity: 0.3,
  glassBlur: 0,
  glassOpacity: 0,
  scanlines: 0,
  chromaticAberration: 0,
  sheenIntensity: 0,
  sheenAngle: 45,
  sparkleIntensity: 0,
  halftoneIntensity: 0,
  stickerMode: false,
  ditherIntensity: 0,
  paperTexture: 0,
  metallicIntensity: 0,
  vignette: 0,
  finishType: 'none',
  finishOpacity: 0.8
};

export async function upscaleAndEditImage(
  source: HTMLImageElement | Blob, 
  targetSize: number, 
  effects: BatchEffects,
  cropBox?: [number, number, number, number]
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    let img: HTMLImageElement;
    if (source instanceof Blob) {
      img = new Image();
      const url = URL.createObjectURL(source);
      await new Promise((res) => {
        img.onload = res;
        img.src = url;
      });
      URL.revokeObjectURL(url);
    } else {
      img = source;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context error'));

    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (cropBox) {
      sy = (cropBox[0] / 1000) * img.height;
      sx = (cropBox[1] / 1000) * img.width;
      sh = ((cropBox[2] - cropBox[0]) / 1000) * img.height;
      sw = ((cropBox[3] - cropBox[1]) / 1000) * img.width;
    }

    // CALC PADDING FOR AUTO-FIT
    let padding = 20;
    if (effects.autoFit) {
        const effectBuffer = Math.max(
            effects.outlineWidth,
            effects.glowBlur,
            effects.longShadowLength,
            Math.sqrt(effects.shadowX**2 + effects.shadowY**2) + effects.shadowBlur,
            effects.stickerMode ? 15 : 0
        );
        padding += effectBuffer * 2;
    }

    const drawSize = targetSize - padding * 2;
    const scale = Math.min(drawSize / sw, drawSize / sh);
    const dx = (targetSize - sw * scale) / 2;
    const dy = (targetSize - sh * scale) / 2;
    const dw = sw * scale;
    const dh = sh * scale;

    ctx.imageSmoothingEnabled = !effects.isPixelArt;

    // PRE-PROCESS ENHANCEMENT
    const enhanceCanvas = document.createElement('canvas');
    enhanceCanvas.width = targetSize;
    enhanceCanvas.height = targetSize;
    const ectx = enhanceCanvas.getContext('2d')!;
    ectx.imageSmoothingEnabled = !effects.isPixelArt;
    ectx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    
    if (!effects.isPixelArt) {
      if (effects.edgeClamping > 0) {
        ectx.filter = `blur(0.5px) contrast(${100 + effects.edgeClamping * 2}%)`;
        ectx.drawImage(enhanceCanvas, 0, 0);
        ectx.filter = 'none';
      }
      if (effects.sharpness > 0) {
        ectx.filter = `contrast(${100 + effects.sharpness}%) brightness(${100 - effects.sharpness / 10}%)`;
        ectx.drawImage(enhanceCanvas, 0, 0);
        ectx.filter = 'none';
      }
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetSize;
    maskCanvas.height = targetSize;
    const mctx = maskCanvas.getContext('2d')!;
    mctx.imageSmoothingEnabled = !effects.isPixelArt;
    
    if (effects.cornerRadius > 0) {
      const r = (effects.cornerRadius / 100) * (Math.min(dw, dh) / 2);
      mctx.beginPath();
      mctx.roundRect(dx, dy, dw, dh, r);
      mctx.clip();
    }
    mctx.drawImage(enhanceCanvas, 0, 0);

    // RENDERING
    // Long Shadow
    if (effects.longShadowLength > 0) {
      ctx.save();
      const length = effects.longShadowLength * scale;
      ctx.fillStyle = hexToRgba('#000000', effects.longShadowOpacity);
      for (let i = 1; i < length; i += 4) {
        ctx.drawImage(maskCanvas, i, i);
      }
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.restore();
    }

    // Shadow
    if (effects.shadowOpacity > 0) {
      ctx.save();
      ctx.shadowColor = hexToRgba(effects.shadowColor, effects.shadowOpacity);
      ctx.shadowBlur = effects.shadowBlur * scale;
      ctx.shadowOffsetX = effects.shadowX * scale;
      ctx.shadowOffsetY = effects.shadowY * scale;
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.restore();
    }

    // Glow with Noise Jitter
    if (effects.glowBlur > 0 && effects.glowOpacity > 0) {
      ctx.save();
      ctx.shadowColor = hexToRgba(effects.glowColor, effects.glowOpacity);
      ctx.shadowBlur = effects.glowBlur * scale;
      if (effects.glowNoise > 0) {
          const gn = effects.glowNoise * scale * 0.5;
          ctx.drawImage(maskCanvas, (Math.random()-0.5)*gn, (Math.random()-0.5)*gn);
      } else {
          ctx.drawImage(maskCanvas, 0, 0);
      }
      ctx.restore();
    }

    // Sticker Mode (Special Composite Effect)
    if (effects.stickerMode) {
        ctx.save();
        const sSize = 8 * scale;
        for (let i = 0; i < 360; i += 10) {
            const rad = (i * Math.PI) / 180;
            ctx.drawImage(maskCanvas, Math.cos(rad) * sSize, Math.sin(rad) * sSize);
        }
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.restore();
    }

    // Outline with Style & Noise
    if (effects.outlineWidth > 0 && effects.outlineOpacity > 0) {
      const thickness = effects.outlineWidth * scale;
      const noise = effects.outlineNoise * scale * 0.5;
      ctx.save();
      const steps = effects.outlineStyle === 'dashed' ? 12 : 36;
      for (let i = 0; i < 360; i += (360/steps)) {
        const angle = (i * Math.PI) / 180;
        const jitterX = noise > 0 ? (Math.random() - 0.5) * noise : 0;
        const jitterY = noise > 0 ? (Math.random() - 0.5) * noise : 0;
        ctx.drawImage(maskCanvas, Math.cos(angle) * thickness + jitterX, Math.sin(angle) * thickness + jitterY);
      }
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = hexToRgba(effects.outlineColor, effects.outlineOpacity);
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.restore();
    }

    // Chromatic Aberration
    if (effects.chromaticAberration > 0) {
        const off = effects.chromaticAberration * scale * 0.5;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.save(); ctx.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)'; ctx.drawImage(maskCanvas, -off, 0); ctx.restore();
        ctx.save(); ctx.filter = 'brightness(0.5) sepia(1) hue-rotate(180deg) saturate(5)'; ctx.drawImage(maskCanvas, off, 0); ctx.restore();
        ctx.restore();
    }

    // Core Image
    ctx.save();
    ctx.filter = `brightness(${effects.brightness}%) contrast(${effects.contrast}%) saturate(${effects.saturation}%) hue-rotate(${effects.hueRotate}deg)`;
    ctx.drawImage(maskCanvas, 0, 0);
    
    // Inner Glow
    if (effects.innerGlowOpacity > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.shadowBlur = effects.innerGlowBlur * scale;
        ctx.shadowColor = hexToRgba(effects.innerGlowColor, effects.innerGlowOpacity);
        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.strokeRect(dx, dy, dw, dh);
    }
    
    // Halftone / Dither / Paper Overlay
    if (effects.halftoneIntensity > 0) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for(let i=0; i<targetSize; i+=8) {
            for(let j=0; j<targetSize; j+=8) {
                if(Math.random() < effects.halftoneIntensity/100)
                    ctx.fillRect(i, j, 2, 2);
            }
        }
    }
    
    // Glassmorphism
    if (effects.glassOpacity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255, 255, 255, ${effects.glassOpacity})`;
        ctx.filter = `blur(${effects.glassBlur * scale}px)`;
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.restore();
    }

    // Metallic Shine
    if (effects.metallicIntensity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const mGrad = ctx.createLinearGradient(dx, dy, dx+dw, dy+dh);
        mGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
        mGrad.addColorStop(0.5, `rgba(255,255,255,${effects.metallicIntensity/100})`);
        mGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = mGrad;
        ctx.fillRect(dx, dy, dw, dh);
        ctx.restore();
    }

    // Finish
    if (effects.finishType !== 'none') {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = effects.finishOpacity;
      const gradient = ctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
      if (effects.finishType === 'gold') { gradient.addColorStop(0, '#bf953f'); gradient.addColorStop(0.5, '#fcf6ba'); gradient.addColorStop(1, '#aa771c'); }
      else if (effects.finishType === 'silver') { gradient.addColorStop(0, '#707070'); gradient.addColorStop(0.5, '#e0e0e0'); gradient.addColorStop(1, '#707070'); }
      else if (effects.finishType === 'foil' || effects.finishType === 'holo') { gradient.addColorStop(0, 'red'); gradient.addColorStop(0.5, 'green'); gradient.addColorStop(1, 'blue'); }
      ctx.fillStyle = gradient;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Vignette
    if (effects.vignette > 0) {
        const vGrad = ctx.createRadialGradient(targetSize/2, targetSize/2, targetSize/4, targetSize/2, targetSize/2, targetSize/2);
        vGrad.addColorStop(0, 'transparent');
        vGrad.addColorStop(1, `rgba(0,0,0,${effects.vignette/100})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, targetSize, targetSize);
    }

    // Sheen & Sparkles
    if (effects.sheenIntensity > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      const rads = (effects.sheenAngle * Math.PI) / 180;
      const sGrad = ctx.createLinearGradient(0,0, Math.cos(rads)*targetSize, Math.sin(rads)*targetSize);
      sGrad.addColorStop(0,'transparent'); sGrad.addColorStop(0.5,`rgba(255,255,255,${effects.sheenIntensity/100})`); sGrad.addColorStop(1,'transparent');
      ctx.fillStyle = sGrad; ctx.fillRect(0,0,targetSize,targetSize); ctx.restore();
    }

    if (effects.sparkleIntensity > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'white';
      for(let i=0; i<effects.sparkleIntensity/2; i++) {
        const sx = dx + Math.random()*dw; const sy = dy + Math.random()*dh; const sz = (2+Math.random()*5)*scale;
        ctx.fillRect(sx-sz, sy-0.5, sz*2, 1); ctx.fillRect(sx-0.5, sy-sz, 1, sz*2);
      }
      ctx.restore();
    }

    if (effects.bevelSize > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.shadowBlur = effects.bevelSize * scale;
      ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowOffsetX = -effects.bevelSize*scale/2; ctx.shadowOffsetY = -effects.bevelSize*scale/2;
      ctx.drawImage(maskCanvas, 0, 0); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetX = effects.bevelSize*scale/2; ctx.shadowOffsetY = effects.bevelSize*scale/2;
      ctx.drawImage(maskCanvas, 0, 0); ctx.restore();
    }

    canvas.toBlob((b) => b ? resolve(b) : reject('Blob failed'), 'image/png');
  });
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
