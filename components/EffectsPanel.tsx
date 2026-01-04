
import React from 'react';
import { BatchEffects } from '../types';
import { DEFAULT_EFFECTS } from '../utils/imageProcessor';
import { 
  Zap, ShieldCheck, Sun, Layers, Eraser, Sparkles
} from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

interface EffectsPanelProps {
  effects: BatchEffects;
  setEffects: React.Dispatch<React.SetStateAction<BatchEffects>>;
  disabled: boolean;
  onError: (msg: string, fix: string) => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ effects, setEffects, disabled, onError }) => {
  const update = (key: keyof BatchEffects, val: any) => {
    setEffects(prev => ({ ...prev, [key]: val }));
  };

  const Toggle = ({ label, active, onToggle }: any) => (
    <div className="flex items-center justify-between p-1 bg-[#d6d6d6] border border-black/10">
      <span className="text-[7px] font-black text-[#333] uppercase">{label}</span>
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }} 
        className={`px-1.5 py-0.5 border text-[6px] font-black transition-all ${active ? 'bg-indigo-600 text-white border-white' : 'bg-[#bbb] border-black/40 text-[#444]'}`}
      >
        {active ? 'ON' : 'OFF'}
      </button>
    </div>
  );

  const Slider = ({ label, value, min, max, step = 1, onChange, tipTitle, tipDesc }: any) => (
    <RetroTooltip title={tipTitle} description={tipDesc}>
      <div className="w-full">
        <div className="flex justify-between text-[7px] text-[#333] font-black uppercase mb-0.5">
          <span>{label}</span>
          <span>{value}</span>
        </div>
        <input 
          type="range" min={min} max={max} step={step} value={value} 
          onChange={e => onChange(+e.target.value)} className="w-full cursor-pointer" 
        />
      </div>
    </RetroTooltip>
  );

  return (
    <div className={`w-full retro-panel p-4 mb-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-2">
        <div className="flex items-center gap-3">
          <div className="win-btn p-2 text-indigo-700 cursor-default"><ShieldCheck size={18} /></div>
          <h3 className="font-bold text-lg uppercase text-[#333] tracking-tighter italic">THE_SMITHY_FORGE</h3>
        </div>
        <button onClick={() => setEffects(DEFAULT_EFFECTS)} className="win-btn bg-red-600 text-white">RE-IGNITE</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cleanup Column */}
        <div className="space-y-3 p-3 bg-black/5 rounded">
            <h4 className="text-[8px] font-black uppercase flex items-center gap-1"><Eraser size={10}/> Cleanup Tools</h4>
            <Toggle label="Denoise Engine" active={effects.cleanupEnabled} onToggle={() => update('cleanupEnabled', !effects.cleanupEnabled)} />
            <Slider label="Intensify" value={effects.cleanupIntensity} min={0} max={100} onChange={v => update('cleanupIntensity', v)} tipTitle="Cleanup Power" tipDesc="Removes noise while protecting icon edges." />
            <Toggle label="Alpha Scrub" active={effects.removeBackground} onToggle={() => update('removeBackground', !effects.removeBackground)} />
            <Slider label="Aggression" value={effects.scrubAggression} min={0} max={200} onChange={v => update('scrubAggression', v)} tipTitle="BG Extraction" tipDesc="Controls how aggressively similar background colors are purged." />
        </div>

        {/* Outline Column */}
        <div className="space-y-3 p-3 bg-black/5 rounded">
            <h4 className="text-[8px] font-black uppercase flex items-center gap-1"><Layers size={10}/> Outlines</h4>
            <Toggle label="Enable" active={effects.outlineEnabled} onToggle={() => update('outlineEnabled', !effects.outlineEnabled)} />
            <Slider label="Width" value={effects.outlineWidth} min={1} max={50} onChange={v => update('outlineWidth', v)} />
            <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                <span className="text-[7px] font-black uppercase">Color</span>
                <input type="color" value={effects.outlineColor} onChange={e => update('outlineColor', e.target.value)} className="flex-1 h-5 cursor-pointer border-2 border-black" />
            </div>
        </div>

        {/* Glow Column */}
        <div className="space-y-3 p-3 bg-black/5 rounded">
            <h4 className="text-[8px] font-black uppercase flex items-center gap-1"><Sun size={10}/> Effects</h4>
            <Toggle label="Aura Glow" active={effects.glowEnabled} onToggle={() => update('glowEnabled', !effects.glowEnabled)} />
            <Slider label="Aura Radius" value={effects.glowBlur} min={0} max={100} onChange={v => update('glowBlur', v)} />
            <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                <span className="text-[7px] font-black uppercase">Color</span>
                <input type="color" value={effects.glowColor} onChange={e => update('glowColor', e.target.value)} className="flex-1 h-5 cursor-pointer border-2 border-black" />
            </div>
        </div>

        {/* Global Modes Column */}
        <div className="space-y-3 p-3 bg-black/5 rounded">
            <h4 className="text-[8px] font-black uppercase flex items-center gap-1"><Zap size={10}/> Logic</h4>
            <Toggle label="Pixel Art Mode" active={effects.isPixelArt} onToggle={() => update('isPixelArt', !effects.isPixelArt)} />
            <Toggle label="Auto-Fit" active={effects.autoFit} onToggle={() => update('autoFit', !effects.autoFit)} />
            <Slider label="Contrast" value={effects.contrast} min={50} max={200} onChange={v => update('contrast', v)} />
            <Slider label="Brightness" value={effects.brightness} min={50} max={200} onChange={v => update('brightness', v)} />
        </div>
      </div>
    </div>
  );
};
