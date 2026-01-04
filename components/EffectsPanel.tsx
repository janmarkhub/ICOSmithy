import React, { useState } from 'react';
import { BatchEffects } from '../types';
import { DEFAULT_EFFECTS } from '../utils/imageProcessor';
import { 
  Wand2, Dice5, Activity, Info, Hammer, Palette, Play, 
  Maximize, Layers, Shield, Sparkles, Box, Sun, Moon, 
  Scissors, Droplets, Binary, Monitor, Zap, Frame, 
  Wind, Ghost, Cpu, Camera, RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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
    <div className="space-y-4 bg-[#8b8b8b] p-4 border-4 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff] relative flex flex-col h-full group hover:bg-[#999] transition-all">
      <div className="flex items-center justify-between text-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
            <Icon size={14} className="group-hover:animate-mosh-shake" />
            <h4 className="text-[9px] font-black uppercase tracking-widest">{title}</h4>
        </div>
        {info && (
            <div className="relative group/info">
                <Info size={12} className="text-white opacity-50 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-black border-4 border-white text-[9px] text-white rounded-sm shadow-2xl opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 uppercase font-bold leading-tight">
                    {info}
                </div>
            </div>
        )}
      </div>
      <div className="space-y-4 flex-1">{children}</div>
    </div>
  );

  const SliderField = ({ label, value, min, max, onChange, step = 1, suffix = "" }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[7px] text-white font-black uppercase drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        <span>{label}</span>
        <span className="text-yellow-400 font-mono">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} 
        className="w-full h-1.5 bg-[#333] appearance-none cursor-pointer accent-yellow-500 border-2 border-black" />
    </div>
  );

  const ToggleField = ({ label, active, onToggle }: any) => (
    <div className="flex items-center justify-between p-1.5 bg-[#555] border-2 border-black hover:border-white transition-colors">
        <span className="text-[8px] font-black text-white uppercase drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{label}</span>
        <button onClick={onToggle} className={`px-2 py-0.5 border-2 text-[7px] font-black uppercase transition-all ${active ? 'bg-[#ffca28] border-white text-black scale-105' : 'bg-[#333] border-white text-white opacity-60'}`}>
            {active ? 'ON' : 'OFF'}
        </button>
    </div>
  );

  return (
    <div className={`bg-[#c6c6c6] p-6 border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] mb-6 shadow-2xl transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-8 border-b-4 border-[#555555] pb-4">
        <div className="flex items-center gap-4 relative">
          <div 
            onMouseEnter={() => setIsHammerHovered(true)}
            onMouseLeave={() => setIsHammerHovered(false)}
            onClick={handleHammerClick}
            className={`bg-[#555] p-3 border-4 border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#222] border-b-[#222] text-yellow-500 cursor-pointer hover:scale-110 active:rotate-12 transition-all relative group shadow-xl`}
          >
            <Hammer size={32} className={isHammerHovered ? 'animate-mosh-sparkle' : ''} />
            {isHammerHovered && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bubble whitespace-nowrap z-50 animate-bounce">
                    {lastState ? 'RESTORE!' : 'HIT ME!'}
                </div>
            )}
          </div>
          <div>
            <h3 className="font-black text-3xl tracking-tighter uppercase text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">The Smithy</h3>
            <p className="text-[10px] text-[#555] font-black tracking-[0.3em] uppercase">Professional Batch Refiner</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button onClick={handleInspireMe} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 border-4 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 text-white text-[10px] font-black uppercase shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">
                <Zap size={14} /> AI Blessing
            </button>
            <button onClick={() => setEffects(DEFAULT_EFFECTS)} className="px-6 py-2 bg-red-700 border-4 border-t-red-500 border-l-red-500 border-r-red-950 border-b-red-950 text-white text-[10px] font-black uppercase hover:bg-red-600 active:scale-95 transition-all">
                Purge Table
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Module 1: The Foundry (Geometry) */}
        <ControlGroup title="The Foundry" icon={Box} info="Core geometry and pixel precision.">
             <div className="flex justify-between items-center text-[10px] text-white font-black uppercase drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] mb-2">
               <span>PIXEL DEPTH</span>
               <select value={effects.pixelDepth} onChange={e => update('pixelDepth', e.target.value)} className="bg-[#333] text-[9px] border-2 border-white px-2 text-white uppercase font-black outline-none smith-select cursor-pointer">
                 <option value="none">Lossless</option>
                 <option value="32-bit">32-Bit</option>
                 <option value="16-bit">16-Bit</option>
                 <option value="8-bit">8-Bit</option>
               </select>
             </div>
             <SliderField label="Rounding" value={effects.cornerRadius} min={0} max={100} onChange={(v: any) => update('cornerRadius', v)} />
             <ToggleField label="ASCII Mode" active={effects.asciiMode} onToggle={() => update('asciiMode', !effects.asciiMode)} />
             <ToggleField label="Creeper Face" active={effects.creeperOverlay} onToggle={() => update('creeperOverlay', !effects.creeperOverlay)} />
        </ControlGroup>

        {/* Module 2: Recontextualizer (Uniformity/Upscaling) */}
        <ControlGroup title="Recontextualizer" icon={Cpu} info="Tools to normalize batch inputs and improve consistency.">
            <ToggleField label="Uniform Inputs" active={effects.normalizeInputs} onToggle={() => update('normalizeInputs', !effects.normalizeInputs)} />
            <ToggleField label="Remove Background" active={effects.removeBackground} onToggle={() => update('removeBackground', !effects.removeBackground)} />
            <SliderField label="Smart Upscale" value={effects.smartUpscaleIntensity} min={0} max={100} onChange={(v: any) => update('smartUpscaleIntensity', v)} />
            <ToggleField label="Auto-Fit" active={effects.autoFit} onToggle={() => update('autoFit', !effects.autoFit)} />
        </ControlGroup>

        {/* Module 3: Alchemy (Materials) */}
        <ControlGroup title="Alchemy" icon={Palette} info="Surface materials and magical glints.">
          <ToggleField label="Enchant Glint" active={effects.enchantmentGlint} onToggle={() => update('enchantmentGlint', !effects.enchantmentGlint)} />
          <SliderField label="Metallic" value={effects.metallicIntensity} min={0} max={100} onChange={(v: any) => update('metallicIntensity', v)} />
          <SliderField label="Sheen Angle" value={effects.sheenAngle} min={0} max={360} onChange={(v: any) => update('sheenAngle', v)} />
          <div className="flex items-center gap-2 pt-1">
            <input type="color" value={effects.outlineColor} onChange={e => update('outlineColor', e.target.value)} className="w-8 h-8 border-2 border-black cursor-pointer hover:scale-110 transition-transform" />
            <div className="flex-1"><SliderField label="Outline" value={effects.outlineWidth} min={0} max={40} onChange={(v: any) => update('outlineWidth', v)} /></div>
          </div>
        </ControlGroup>

        {/* Module 4: Optics (Visual Artifacts) */}
        <ControlGroup title="Optics" icon={Camera} info="Lens effects and vintage rendering styles.">
            <ToggleField label="Dither Path" active={effects.dither} onToggle={() => update('dither', !effects.dither)} />
            <SliderField label="Aberration" value={effects.chromaticAberration} min={0} max={20} onChange={(v: any) => update('chromaticAberration', v)} />
            <SliderField label="Halftone" value={effects.halftoneIntensity} min={0} max={100} onChange={(v: any) => update('halftoneIntensity', v)} />
            <SliderField label="Vignette" value={effects.vignette} min={0} max={100} onChange={(v: any) => update('vignette', v)} />
        </ControlGroup>

        {/* Module 5: Chaos Lab (Distortion) */}
        <ControlGroup title="Chaos Lab" icon={Activity} info="Digital destruction and glitch aesthetics.">
            <SliderField label="Pixel Sorting" value={effects.pixelSort} min={0} max={100} onChange={(v: any) => update('pixelSort', v)} />
            <SliderField label="RGB Splitting" value={effects.rgbSplit} min={0} max={20} onChange={(v: any) => update('rgbSplit', v)} />
            <ToggleField label="CRT Scan" active={effects.crtEffect} onToggle={() => update('crtEffect', !effects.crtEffect)} />
            <SliderField label="Static Noise" value={effects.tvNoise} min={0} max={100} onChange={(v: any) => update('tvNoise', v)} />
        </ControlGroup>

        {/* Module 6: Shadow Forge (Depth) */}
        <ControlGroup title="Shadow Forge" icon={Layers} info="Depth management and shadow casting.">
            <SliderField label="Blur Radius" value={effects.shadowBlur} min={0} max={40} onChange={(v: any) => update('shadowBlur', v)} />
            <SliderField label="Long Shadow" value={effects.longShadowLength} min={0} max={100} onChange={(v: any) => update('longShadowLength', v)} />
            <SliderField label="Opacity" value={effects.shadowOpacity} min={0} max={1} step={0.1} onChange={(v: any) => update('shadowOpacity', v)} />
            <input type="color" value={effects.shadowColor} onChange={e => update('shadowColor', e.target.value)} className="w-full h-4 border-2 border-black cursor-pointer" />
        </ControlGroup>

        {/* Module 7: Glass Works (Transparency) */}
        <ControlGroup title="Glass Works" icon={Droplets} info="Modern OS transparency and acrylic effects.">
            <SliderField label="Glass Blur" value={effects.glassBlur} min={0} max={100} onChange={(v: any) => update('glassBlur', v)} />
            <SliderField label="Glass Opacity" value={effects.glassOpacity} min={0} max={100} onChange={(v: any) => update('glassOpacity', v)} />
            <SliderField label="Inner Glow" value={effects.innerGlowBlur} min={0} max={50} onChange={(v: any) => update('innerGlowBlur', v)} />
            <ToggleField label="Duotone" active={effects.duotone} onToggle={() => update('duotone', !effects.duotone)} />
        </ControlGroup>

        {/* Module 8: Motion Forge (GIF Prep) */}
        <ControlGroup title="Motion Forge" icon={Play} info="Configure looping animations. Set Export to GIF to see results.">
           <ToggleField label="Enable Loop" active={effects.isAnimated} onToggle={() => update('isAnimated', !effects.isAnimated)} />
           {effects.isAnimated && (
             <div className="space-y-4 pt-2 border-t-2 border-black/10 animate-in slide-in-from-top-1">
                <select value={effects.animationType} onChange={e => update('animationType', e.target.value)} className="w-full bg-[#333] text-[9px] p-2 border-2 border-white text-white uppercase font-black outline-none smith-select cursor-pointer">
                  <option value="float">Floating</option>
                  <option value="pulse">Heartbeat</option>
                  <option value="spin">Rotating</option>
                  <option value="jitter">Ender Jitter</option>
                  <option value="bounce">Slime Bounce</option>
                  <option value="swing">Bell Swing</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                    <SliderField label="Ticks" value={effects.animationSpeed} min={1} max={15} onChange={(v: any) => update('animationSpeed', v)} />
                    <SliderField label="Amplify" value={effects.animationIntensity} min={1} max={100} onChange={(v: any) => update('animationIntensity', v)} />
                </div>
             </div>
           )}
        </ControlGroup>

      </div>
    </div>
  );
};