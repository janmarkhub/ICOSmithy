
import React, { useState } from 'react';
import { BatchEffects } from '../types';
import { DEFAULT_EFFECTS } from '../utils/imageProcessor';
import { 
  Info, Hammer, Palette, Sparkles, Box, 
  Cpu, Camera, Zap, Sun, Moon, Layers, Wand2, ShieldCheck, Eraser
} from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

interface EffectsPanelProps {
  effects: BatchEffects;
  setEffects: React.Dispatch<React.SetStateAction<BatchEffects>>;
  disabled: boolean;
  onUndo: () => void;
  canUndo: boolean;
  onError: (msg: string, fix: string) => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ effects, setEffects, disabled, onUndo, canUndo, onError }) => {
  const update = (key: keyof BatchEffects, val: any) => {
    setEffects(prev => ({ ...prev, [key]: val }));
  };

  const handleHammerClick = () => {
    const randomChanges: Partial<BatchEffects> = {
        glowBlur: Math.random() * 20,
        glowColor: `hsl(${Math.random()*360}, 70%, 50%)`,
        glowOpacity: 0.5 + Math.random() * 0.5,
        outlineWidth: 2 + Math.random() * 8,
        outlineColor: '#ffffff'
    };
    setEffects(prev => ({ ...prev, ...randomChanges }));
  };

  const ControlGroup = ({ title, icon: Icon, children, info }: any) => (
    <div className="retro-panel p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-black/20 pb-1">
        <div className="flex items-center gap-1.5">
            <Icon size={12} className="text-[#333]" />
            <h4 className="text-[9px] font-bold uppercase text-[#333] tracking-tighter">{title}</h4>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const SliderField = ({ label, value, min, max, onChange, step = 1, suffix = "", tooltipTitle, tooltipDesc }: any) => (
    <RetroTooltip title={tooltipTitle} description={tooltipDesc}>
      <div className="w-full">
        <div className="flex justify-between text-[7px] text-[#333] font-bold uppercase mb-0.5">
          <span className="truncate">{label}</span>
          <span>{value}{suffix}</span>
        </div>
        <input 
          type="range" min={min} max={max} step={step} value={value} 
          onChange={e => onChange(+e.target.value)} className="w-full cursor-pointer" 
        />
      </div>
    </RetroTooltip>
  );

  const ToggleField = ({ label, active, onToggle, tooltipTitle, tooltipDesc }: any) => (
    <RetroTooltip title={tooltipTitle} description={tooltipDesc}>
      <div className="flex items-center justify-between p-1 bg-[#d6d6d6] border border-black/10">
          <span className="text-[7px] font-bold text-[#333] uppercase truncate">{label}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }} 
            className={`px-1.5 py-0.5 border text-[6px] font-black uppercase transition-all ${active ? 'bg-indigo-600 text-white border-white' : 'bg-[#bbb] border-black/40 text-[#444]'}`}
          >
              {active ? 'ON' : 'OFF'}
          </button>
      </div>
    </RetroTooltip>
  );

  return (
    <div className={`w-full retro-panel p-4 mb-4 transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-2">
        <div className="flex items-center gap-3">
          <div onClick={handleHammerClick} className="win-btn p-2 text-indigo-700 cursor-pointer">
            <Hammer size={18} />
          </div>
          <div>
            <h3 className="font-bold text-lg uppercase text-[#333] tracking-tighter">EFFECTS_FORGE</h3>
          </div>
        </div>
        <button onClick={() => setEffects(DEFAULT_EFFECTS)} className="win-btn bg-red-600 text-white">RESET_ALL</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <ControlGroup title="CLEANUP" icon={ShieldCheck}>
             <SliderField label="Denoise" value={effects.cleanupIntensity} min={0} max={100} onChange={v => update('cleanupIntensity', v)} tooltipTitle="Cleanup" tooltipDesc="Advanced Bilateral Denoising. Smooths noise while keeping edges sharp." />
             <ToggleField label="Lineart" active={effects.lineartMode} onToggle={() => update('lineartMode', !effects.lineartMode)} tooltipTitle="Lineart Mode" tooltipDesc="Turns icon into clean high-contrast contours." />
             <ToggleField label="Scrub BG" active={effects.removeBackground} onToggle={() => update('removeBackground', !effects.removeBackground)} />
        </ControlGroup>

        <ControlGroup title="GLOW" icon={Sun}>
            <SliderField label="Blur" value={effects.glowBlur} min={0} max={100} onChange={v => update('glowBlur', v)} />
            <SliderField label="Opacity" value={effects.glowOpacity} min={0} max={1} step={0.1} onChange={v => update('glowOpacity', v)} />
            <div onClick={e => e.stopPropagation()}>
              <input type="color" value={effects.glowColor} onChange={e => update('glowColor', e.target.value)} className="w-full h-4 border border-black cursor-pointer" />
            </div>
        </ControlGroup>

        <ControlGroup title="OUTLINE" icon={Box}>
          <div className="flex justify-between items-center text-[7px] font-bold text-[#333] mb-1">
              <span>STYLE</span>
              <select value={effects.outlineStyle} onChange={e => update('outlineStyle', e.target.value as any)} className="bg-[#eee] border border-black px-1 text-[7px] font-black uppercase">
                <option value="solid">Solid</option>
                <option value="dotted">Dotted</option>
                <option value="wavy">Wavy</option>
                <option value="pixelated">Pixel</option>
              </select>
          </div>
          <SliderField label="Width" value={effects.outlineWidth} min={0} max={40} onChange={v => update('outlineWidth', v)} />
          <div onClick={e => e.stopPropagation()}>
            <input type="color" value={effects.outlineColor} onChange={e => update('outlineColor', e.target.value)} className="w-full h-4 border border-black cursor-pointer" />
          </div>
        </ControlGroup>

        <ControlGroup title="MODES" icon={Layers}>
            <ToggleField label="Auto-Fit" active={effects.autoFit} onToggle={() => update('autoFit', !effects.autoFit)} />
            <ToggleField label="Pixel Art" active={effects.isPixelArt} onToggle={() => update('isPixelArt', !effects.isPixelArt)} />
            <SliderField label="Contrast" value={effects.contrast} min={50} max={200} onChange={v => update('contrast', v)} />
        </ControlGroup>
      </div>
    </div>
  );
};
