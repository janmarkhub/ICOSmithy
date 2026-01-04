
import React from 'react';
import { BatchEffects, DEFAULT_EFFECTS } from '../utils/imageProcessor';
import { 
  Sliders, Shield, Zap, Sparkles, 
  Moon, Palette, Maximize,
  Wand2, Gem, Stars, Monitor,
  Ghost, Frame, Type, Layers, Box, Sticker, Newspaper, Grid, Droplet
} from 'lucide-react';

interface EffectsPanelProps {
  effects: BatchEffects;
  setEffects: React.Dispatch<React.SetStateAction<BatchEffects>>;
  disabled: boolean;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ effects, setEffects, disabled }) => {
  const update = (key: keyof BatchEffects, val: any) => setEffects(prev => ({ ...prev, [key]: val }));

  const ControlGroup = ({ title, icon: Icon, children }: any) => (
    <div className="space-y-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 hover:border-indigo-500/30 transition-colors">
      <div className="flex items-center gap-2 text-indigo-400 mb-2">
        <Icon size={16} />
        <h4 className="text-[11px] font-bold uppercase tracking-widest">{title}</h4>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const SliderField = ({ label, value, min, max, onChange, step = 1 }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className="text-indigo-300 font-mono">{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={e => onChange(+e.target.value)} 
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
      />
    </div>
  );

  const Toggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
      <span className="text-[10px] font-bold uppercase">{label}</span>
      <button 
        onClick={onClick}
        className={`w-10 h-5 rounded-full transition-all relative ${active ? 'bg-indigo-500' : 'bg-slate-600'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className={`bg-slate-900 text-white p-6 rounded-2xl mb-6 shadow-2xl transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-6 border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600/20 p-1.5 rounded-lg text-indigo-400"><Sliders size={18} /></div>
          <div>
            <h3 className="font-bold text-lg tracking-tight">Studio Workbench</h3>
            <p className="text-[10px] text-slate-500">Automated High-Fidelity Icon Editing</p>
          </div>
        </div>
        <button 
          onClick={() => setEffects(DEFAULT_EFFECTS)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400 hover:text-white transition-all uppercase font-bold border border-slate-700"
        >
          Factory Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <ControlGroup title="Engine Config" icon={Wand2}>
          <Toggle label="Pixel Art Mode" active={effects.isPixelArt} onClick={() => update('isPixelArt', !effects.isPixelArt)} />
          <Toggle label="Auto-Fit Bounds" active={effects.autoFit} onClick={() => update('autoFit', !effects.autoFit)} />
          {!effects.isPixelArt && (
            <>
              <SliderField label="Vector Clamp" value={effects.edgeClamping} min={0} max={100} onChange={(v: any) => update('edgeClamping', v)} />
              <SliderField label="Detail Sharp" value={effects.sharpness} min={0} max={100} onChange={(v: any) => update('sharpness', v)} />
            </>
          )}
          <SliderField label="Rounding" value={effects.cornerRadius} min={0} max={100} onChange={(v: any) => update('cornerRadius', v)} />
        </ControlGroup>

        <ControlGroup title="Silhouettes" icon={Shield}>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase">Style</span>
              <select value={effects.outlineStyle} onChange={e => update('outlineStyle', e.target.value)} className="w-full bg-slate-800 text-[10px] p-1 rounded border border-slate-700">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="rough">Rough</option>
                <option value="blob">Blobby</option>
              </select>
            </div>
            <SliderField label="Outline Noise" value={effects.outlineNoise} min={0} max={40} onChange={(v: any) => update('outlineNoise', v)} />
          </div>
          <SliderField label="Width" value={effects.outlineWidth} min={0} max={30} onChange={(v: any) => update('outlineWidth', v)} />
          <div className="flex items-center gap-2">
            <input type="color" value={effects.outlineColor} onChange={e => update('outlineColor', e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-none" />
            <div className="flex-1"><SliderField label="Alpha" value={effects.outlineOpacity} min={0} max={1} step={0.1} onChange={(v: any) => update('outlineOpacity', v)} /></div>
          </div>
          <Toggle label="Sticker Mode" active={effects.stickerMode} onClick={() => update('stickerMode', !effects.stickerMode)} />
        </ControlGroup>

        <ControlGroup title="Atmosphere" icon={Monitor}>
          <SliderField label="Glow Noise" value={effects.glowNoise} min={0} max={50} onChange={(v: any) => update('glowNoise', v)} />
          <SliderField label="Aberration" value={effects.chromaticAberration} min={0} max={20} onChange={(v: any) => update('chromaticAberration', v)} />
          <SliderField label="Long Shadow" value={effects.longShadowLength} min={0} max={100} onChange={(v: any) => update('longShadowLength', v)} />
          <SliderField label="Vignette" value={effects.vignette} min={0} max={100} onChange={(v: any) => update('vignette', v)} />
        </ControlGroup>

        <ControlGroup title="Materials" icon={Gem}>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {(['gold', 'silver', 'holo', 'none'] as const).map(f => (
                <button key={f} onClick={() => update('finishType', f)} className={`px-1 py-1 rounded text-[8px] uppercase font-bold border ${effects.finishType === f ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>{f}</button>
              ))}
            </div>
            <SliderField label="Metallic" value={effects.metallicIntensity} min={0} max={100} onChange={(v: any) => update('metallicIntensity', v)} />
            <SliderField label="Glass Blur" value={effects.glassBlur} min={0} max={20} onChange={(v: any) => update('glassBlur', v)} />
            <SliderField label="Glass Opacity" value={effects.glassOpacity} min={0} max={1} step={0.1} onChange={(v: any) => update('glassOpacity', v)} />
        </ControlGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ControlGroup title="Shadow & Glow" icon={Moon}>
          <div className="grid grid-cols-2 gap-2">
            <SliderField label="X" value={effects.shadowX} min={-20} max={20} onChange={(v: any) => update('shadowX', v)} />
            <SliderField label="Y" value={effects.shadowY} min={-20} max={20} onChange={(v: any) => update('shadowY', v)} />
          </div>
          <SliderField label="Glow Size" value={effects.glowBlur} min={0} max={50} onChange={(v: any) => update('glowBlur', v)} />
          <div className="flex items-center gap-2">
            <input type="color" value={effects.innerGlowColor} onChange={e => update('innerGlowColor', e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-none" />
            <div className="flex-1"><SliderField label="Inner Glow" value={effects.innerGlowOpacity} min={0} max={1} step={0.1} onChange={(v: any) => update('innerGlowOpacity', v)} /></div>
          </div>
        </ControlGroup>

        <ControlGroup title="Finish FX" icon={Stars}>
          <SliderField label="Sheen" value={effects.sheenIntensity} min={0} max={100} onChange={(v: any) => update('sheenIntensity', v)} />
          <SliderField label="Sparkles" value={effects.sparkleIntensity} min={0} max={100} onChange={(v: any) => update('sparkleIntensity', v)} />
          <SliderField label="Retro Halftone" value={effects.halftoneIntensity} min={0} max={100} onChange={(v: any) => update('halftoneIntensity', v)} />
        </ControlGroup>

        <ControlGroup title="Color Lab" icon={Palette}>
          <div className="grid grid-cols-2 gap-2">
            <SliderField label="Bright" value={effects.brightness} min={50} max={150} onChange={(v: any) => update('brightness', v)} />
            <SliderField label="Contrast" value={effects.contrast} min={50} max={150} onChange={(v: any) => update('contrast', v)} />
            <SliderField label="Sat" value={effects.saturation} min={0} max={200} onChange={(v: any) => update('saturation', v)} />
            <SliderField label="Hue" value={effects.hueRotate} min={0} max={360} onChange={(v: any) => update('hueRotate', v)} />
          </div>
        </ControlGroup>
      </div>
    </div>
  );
};
