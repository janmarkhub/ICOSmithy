
export interface ProcessedFile {
  id: string;
  originalName: string;
  newName: string;
  blob: Blob;
  previewUrl: string;
  status: 'processing' | 'completed' | 'error';
  width: number;
  height: number;
  isAiGenerated?: boolean;
  originalType: string;
  fidelityScore: number; 
}

export enum Resolution {
  SD = 256,
  HD = 512,
  FHD = 1024,
  UHD = 2048
}

export enum ExportFormat {
  ICO = 'ico',
  PNG = 'png',
  BMP = 'bmp',
  GIF = 'gif'
}

export type StickerTexture = 'none' | 'foil' | 'realistic' | 'holo' | 'gold' | 'silver';

export interface CustomSticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  texture: StickerTexture;
}

export interface BatchEffects {
  outlineWidth: number;
  outlineColor: string;
  outlineOpacity: number;
  outlineStyle: 'solid' | 'dotted' | 'wavy';
  outlineNoise: number;
  waveAmplitude: number;
  waveFrequency: number;
  dashPattern: number[];
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
  sharpness: number;
  edgeClamping: number;
  isPixelArt: boolean;
  pixelDepth: 'none' | '32-bit' | '16-bit' | '8-bit';
  autoFit: boolean;
  activeStickers: string[];
  customStickers: CustomSticker[];
  rgbCycle: boolean;
  rgbSplit: number;
  tvNoise: number;
  pixelSort: number;
  fisheye: number;
  duotone: boolean;
  duotoneColor1: string;
  duotoneColor2: string;
  dither: boolean;
  scanlines: number;
  chromaticAberration: number;
  sheenIntensity: number;
  sheenAngle: number;
  sparkleIntensity: number;
  halftoneIntensity: number;
  stickerMode: boolean;
  metallicIntensity: number;
  vignette: number;
  longShadowLength: number;
  longShadowOpacity: number;
  glassBlur: number;
  glassOpacity: number;
  finishType: string;
  finishOpacity: number;
  removeBackground: boolean;
  normalizeInputs: boolean;
  smartUpscaleIntensity: number;
  // Animation settings
  isAnimated: boolean;
  animationType: 'float' | 'pulse' | 'spin' | 'jitter' | 'bounce' | 'wave' | 'glitch' | 'swing';
  animationSpeed: number;
  animationIntensity: number;
  animationFrameCount: number;
  animationFrameMode: 'linear' | 'random' | 'vicinity';
  animationVicinityRange: number;
  // New Procedural Effects
  asciiMode: boolean;
  enchantmentGlint: boolean;
  crtEffect: boolean;
  creeperOverlay: boolean;
}

export interface DesktopAssignments {
  myPc?: string; 
  recycleBinEmpty?: string;
  recycleBinFull?: string;
  startButtonNormal?: string;
  startButtonHover?: string;
  startButtonClick?: string;
}
