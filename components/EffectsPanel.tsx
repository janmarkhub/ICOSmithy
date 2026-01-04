
import React, { useState } from 'react';
import { BatchEffects } from '../types';
import { DEFAULT_EFFECTS } from '../utils/imageProcessor';
import { 
  Info, Hammer, Palette, Sparkles, Box, 
  Cpu, Camera, Zap, X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
  const [isHammerHovered, setIsHammerHovered] = useState(false);
  const [lastState, setLastState] = useState<Partial<BatchEffects> | null>(null);

  const update = (key: keyof BatchEffects, val: any) => {
    setEffects(prev => ({ ...prev, [key]: val }));
  };

  const handleHammerClick = () => {
    if (lastState) {
        setEffects(prev => ({ ...prev, ...lastState }));
        setLastState(null);
    } else {
        const randomChanges: Partial<BatchEffects> = {
            rgbSplit: Math.random() * 8,
            tvNoise: Math.random() * 15,
            pixelSort: Math.random() * 20,
            chromaticAberration: Math.random() * 10
        };
        setLastState({
            rgbSplit: effects.rgbSplit,
            tvNoise: effects.tvNoise,
            pixelSort: effects.pixelSort,
            chromaticAberration: effects.chromaticAberration
        });
        setEffects(prev => ({ ...prev, ...randomChanges }));
    }
  };

  const handleInspireMe = async () => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const resp = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Propose a complete JSON for BatchEffects. Theme: 'Neo-Retro Cyber Forge'. Include high contrast, cyan and magenta accents, CRT scanlines, and 8-bit pixel depth. Return only the JSON object.",
            config: { responseMimeType: "application/json" }
        });
        const inspired = JSON.parse(resp.text || '{}');
        setEffects(prev => ({ ...prev, ...inspired }));
    } catch(e) { console.error("AI Inspiration failed", e); }
  };

  const ControlGroup = ({ title, icon: Icon, children, info }: any) => (
    <div className="flex flex-col h-full bg-[#c6c6c6] border-2 border-black shadow-[inset_2px_2px_0_#fff,inset_-2px_-2px_0_#555] p-3">
      <div className="flex items-center justify-between mb-3 border-b border-black/20 pb-1">
        <div className="flex items-center gap-2">
            <Icon size={14} className="text-[#333]" />
            <h4 className="text-[10px] font-bold uppercase text-[#333] tracking-wider">{title}</h4>
        </div>
        {info && (
            <div className="relative group/info">
                <Info size={12} className="text-[#333] opacity-40 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-black border-2 border-white text-[9px] text-white shadow-2xl opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-[100] uppercase font-bold leading-tight">
                    {info}
                </div>
            </div>
        )}
      </div>
      <div className="space-y-3 flex-1 overflow-visible">
        {children}
      </div>
    </div>
  );

  const SliderField = ({ label, value, min, max, onChange, step = 1, suffix = "", tooltipTitle, tooltipDesc }: any) => (
    <RetroTooltip title={tooltipTitle} description={tooltipDesc}>
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] text-[#333] font-bold uppercase">
          <span className="truncate pr-1">{label}</span>
          <span className="text-indigo-700">{value}{suffix}</span>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={e => onChange(+e.target.value)} 
          className="w-full h-1 bg-[#888] appearance-none cursor-pointer accent-indigo-600 border border-black" 
        />
      </div>
    </RetroTooltip>
  );

  const ToggleField = ({ label, active, onToggle, tooltipTitle, tooltipDesc }: any) => (
    <RetroTooltip title={tooltipTitle} description={tooltipDesc}>
      <div className="flex items-center justify-between p-1 bg-[#d6d6d6] border border-black/20">
          <span className="text-[8px] font-bold text-[#333] uppercase truncate pr-1">{label}</span>
          <button 
            onClick={onToggle} 
            className={`px-1.5 py-0.5 border text-[7px] font-black uppercase transition-all shadow-sm ${active ? 'bg-indigo-600 text-white border-white' : 'bg-[#bbb] border-black/40 text-[#444]'}`}
          >
              {active ? 'ON' : 'OFF'}
          </button>
      </div>
    </RetroTooltip>
  );

  return (
    <div className={`w-full bg-[#c6c6c6] border-2 border-black shadow-[4px_4px_0_#000,inset_2px_2px_0_#fff] p-4 mb-6 transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b-2 border-black/10 pb-4">
        <div className="flex items-center gap-4">
          <RetroTooltip title="The Chaos Hammer" description="Whack the table to randomize effects. If you don't like it, whack again to restore the previous state." position="right">
            <div 
              onMouseEnter={() => setIsHammerHovered(true)}
              onMouseLeave={() => setIsHammerHovered(false)}
              onClick={handleHammerClick}
              className={`win-button p-2 text-indigo-700 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md group`}
            >
              <Hammer size={24} className={isHammerHovered ? 'animate-mosh-sparkle' : ''} />
            </div>
          </RetroTooltip>
          <div>
            <h3 className="font-bold text-xl uppercase text-[#333] tracking-tighter">THE SMITHY</h3>
            <p className="text-[9px] text-[#666] font-bold uppercase tracking-widest">BATCH ASSET REFINER</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={handleInspireMe} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 border-2 border-black text-white text-[9px] font-bold uppercase shadow-[2px_2px_0_#000,inset_1px_1px_0_#fff] hover:bg-indigo-500 active:scale-95"
            >
                <Zap size={12} /> AI BLESSING
            </button>
            <button 
                onClick={() => setEffects(DEFAULT_EFFECTS)} 
                className="flex-1 sm:flex-none px-4 py-2 bg-[#f87171] border-2 border-black text-white text-[9px] font-bold uppercase shadow-[2px_2px_0_#000,inset_1px_1px_0_#fff] hover:bg-red-500 active:scale-95"
            >
                PURGE TABLE
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <ControlGroup title="FOUNDRY" icon={Box} info="Core geometry and pixel precision.">
             <div className="flex justify-between items-center text-[8px] text-[#333] font-bold uppercase mb-2">
                 <span>PIXEL DEPTH</span>
                 <select 
                    value={effects.pixelDepth} 
                    onChange={e => update('pixelDepth', e.target.value)} 
                    className="bg-[#eee] text-[8px] border border-black px-1 text-black uppercase font-bold outline-none cursor-pointer"
                 >
                   <option value="none">Lossless</option>
                   <option value="32-bit">32-Bit</option>
                   <option value="16-bit">16-Bit</option>
                   <option value="8-bit">8-Bit</option>
                 </select>
             </div>
             <SliderField label="Rounding" value={effects.cornerRadius} min={0} max={100} onChange={(v: any) => update('cornerRadius', v)} 
               tooltipTitle="Corner Radius" tooltipDesc="Smooths out the sharp edges of your icons for a modern look." />
             <ToggleField label="ASCII Mode" active={effects.asciiMode} onToggle={() => update('asciiMode', !effects.asciiMode)} 
               tooltipTitle="ASCII Terminal" tooltipDesc="Replaces gradients with text characters." />
             <ToggleField label="Creeper" active={effects.creeperOverlay} onToggle={() => update('creeperOverlay', !effects.creeperOverlay)} 
               tooltipTitle="Minecraft Pattern" tooltipDesc="Overlays a subtle creeper face pattern." />
        </ControlGroup>

        <ControlGroup title="CORE" icon={Cpu} info="Tools to normalize batch inputs.">
            <ToggleField label="Uniform" active={effects.normalizeInputs} onToggle={() => update('normalizeInputs', !effects.normalizeInputs)} 
              tooltipTitle="Input Normalization" tooltipDesc="Forces consistent bounding box sizing." />
            <ToggleField label="Scrub BG" active={effects.removeBackground} onToggle={() => update('removeBackground', !effects.removeBackground)} 
              tooltipTitle="Auto-Transparency" tooltipDesc="Strips pure white backgrounds." />
            <SliderField label="Upscale" value={effects.smartUpscaleIntensity} min={0} max={100} onChange={(v: any) => update('smartUpscaleIntensity', v)} 
              tooltipTitle="Bicubic Smoothing" tooltipDesc="Smooths low-res pixels for HD." />
            <ToggleField label="Auto-Fit" active={effects.autoFit} onToggle={() => update('autoFit', !effects.autoFit)} 
              tooltipTitle="Padding" tooltipDesc="Keeps icon within safe margins." />
        </ControlGroup>

        <ControlGroup title="ALCHEMY" icon={Sparkles} info="Materials and magical glints.">
          <ToggleField label="Enchant" active={effects.enchantmentGlint} onToggle={() => update('enchantmentGlint', !effects.enchantmentGlint)} 
            tooltipTitle="Glint" tooltipDesc="Moving purple glint effect." />
          <SliderField label="Metallic" value={effects.metallicIntensity} min={0} max={100} onChange={(v: any) => update('metallicIntensity', v)} 
            tooltipTitle="Metallic" tooltipDesc="Chrome-like reflective surface." />
          <div className="flex items-center gap-2 pt-1">
            <input type="color" value={effects.outlineColor} onChange={e => update('outlineColor', e.target.value)} className="w-6 h-6 border border-black cursor-pointer shadow-sm" />
            <div className="flex-1">
              <SliderField label="Outline" value={effects.outlineWidth} min={0} max={40} onChange={(v: any) => update('outlineWidth', v)} 
              tooltipTitle="Outline" tooltipDesc="Adds a thick border around icons." />
            </div>
          </div>
        </ControlGroup>

        <ControlGroup title="OPTICS" icon={Camera} info="Lens effects and rendering.">
            <ToggleField label="Dither" active={effects.dither} onToggle={() => update('dither', !effects.dither)} 
              tooltipTitle="Retro Dithering" tooltipDesc="Simulates old CRT monitor look." />
            <SliderField label="Aberration" value={effects.chromaticAberration} min={0} max={20} onChange={(v: any) => update('chromaticAberration', v)} 
              tooltipTitle="Lens Fringe" tooltipDesc="Splits colors at the edges." />
            <SliderField label="Halftone" value={effects.halftoneIntensity} min={0} max={100} onChange={(v: any) => update('halftoneIntensity', v)} 
              tooltipTitle="Halftone" tooltipDesc="Comic style printing dots." />
            <SliderField label="Vignette" value={effects.vignette} min={0} max={100} onChange={(v: any) => update('vignette', v)} 
              tooltipTitle="Vignette" tooltipDesc="Darkens the corners of the canvas." />
        </ControlGroup>
      </div>
    </div>
  );
};
