
import React, { useState } from 'react';
import { BatchEffects, CustomSticker } from '../types';
import { DEFAULT_EFFECTS } from '../utils/imageProcessor';
import { 
  Sliders, Shield, Zap, Sparkles, 
  Wand2, Gem, Stars, 
  Monitor, Crosshair, Skull, Heart, 
  Joystick, Flame, Tv, Box, Undo2, 
  Dice5, Layers, Activity, Info, Hammer, Compass,
  Trophy, Cloud, Ghost, Wind, Play, Palette, Terminal, Cpu, Camera, Binary
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface EffectsPanelProps {
  effects: BatchEffects;
  setEffects: React.Dispatch<React.SetStateAction<BatchEffects>>;
  disabled: boolean;
  onUndo: () => void;
  canUndo: boolean;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ effects, setEffects, disabled, onUndo, canUndo }) => {
  const [isHammerHovered, setIsHammerHovered] = useState(false);
  const [lastState, setLastState] = useState<Partial<BatchEffects> | null>(null);

  const update = (key: keyof BatchEffects, val: any) => {
    setEffects(prev => ({ ...prev, [key]: val }));
  };

  const updateSticker = (id: string, key: keyof CustomSticker, val: any) => {
    setEffects(prev => ({
        ...prev,
        customStickers: prev.customStickers.map(s => s.id === id ? { ...s, [key]: val } : s)
    }));
  };

  const handleHammerClick = () => {
    if (lastState) {
        setEffects(prev => ({ ...prev, ...lastState }));
        setLastState(null);
    } else {
        const randomChanges: Partial<BatchEffects> = {
            rgbSplit: Math.random() * 10,
            pixelSort: Math.random() * 50,
            tvNoise: Math.random() * 20
        };
        setLastState({
            rgbSplit: effects.rgbSplit,
            pixelSort: effects.pixelSort,
            tvNoise: effects.tvNoise
        });
        setEffects(prev => ({ ...prev, ...randomChanges }));
    }
  };

  const handleInspireMe = async () => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const resp = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Propose a complete JSON for BatchEffects. Theme: 'Minecraft Enchanting Table Glow'. Colors: Purple, Cyan. Return only the JSON object.",
            config: { responseMimeType: "application/json" }
        });
        const inspired = JSON.parse(resp.text || '{}');
        setEffects(prev => ({ ...prev, ...inspired }));
    } catch(e) { console.error("AI Inspiration failed", e); }
  };

  const ControlGroup = ({ title, icon: Icon, children, info }: any) => (
    <div className="space-y-4 bg-[#8b8b8b] p-4 border-4 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff] relative flex flex-col h-full group">
      <div className="flex items-center justify-between text-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
            <Icon size={14} className="group-hover:animate-mosh-shake" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest">{title}</h4>
        </div>
        {info && (
            <div className="relative group/info">
                <Info size={12} className="text-white opacity-50 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-[#000] border-2 border-white text-[9px] text-white rounded shadow-xl opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 uppercase font-bold">
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
      <div className="flex justify-between text-[8px] text-white font-bold uppercase drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        <span>{label}</span>
        <span className="text-yellow-400 font-mono">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} 
        className="w-full h-1.5 bg-[#333] appearance-none cursor-pointer accent-yellow-500 border-2 border-black" />
    </div>
  );

  const ToggleField = ({ label, active, onToggle }: any) => (
    <div className="flex items-center justify-between p-2 bg-[#555] border-2 border-black">
        <span className="text-[9px] font-bold text-white uppercase drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{label}</span>
        <button onClick={onToggle} className={`px-2 py-0.5 border-2 text-[8px] font-bold uppercase ${active ? 'bg-[#ffca28] border-white text-black' : 'bg-[#333] border-white text-white'}`}>
            {active ? 'ON' : 'OFF'}
        </button>
    </div>
  );

  return (
    <div className={`bg-[#c6c6c6] p-6 border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] mb-6 shadow-2xl transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-8 border-b-4 border-[#555555] pb-4">
        <div className="flex items-center gap-3 relative">
          <div 
            onMouseEnter={() => setIsHammerHovered(true)}
            onMouseLeave={() => setIsHammerHovered(false)}
            onClick={handleHammerClick}
            className="bg-[#555] p-2 border-4 border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#222] border-b-[#222] text-yellow-500 cursor-pointer hover:scale-110 active:rotate-12 transition-all relative"
          >
            <Hammer size={32} />
            {isHammerHovered && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bubble whitespace-nowrap z-50">HIT ME!</div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-2xl tracking-tight uppercase text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] [text-shadow:2px_2px_0_#555]">Arts and Crafts</h3>
            <p className="text-[10px] text-[#555] font-bold tracking-[0.2em] uppercase">The Block Smithy Station</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleInspireMe} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border-4 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 text-white text-[10px] font-bold uppercase shadow-lg">
                <Dice5 size={14} /> Enchant
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ControlGroup title="The Forge" icon={Wand2} info="Fundamental geometry changes.">
             <div className="flex justify-between items-center text-[10px] text-white font-bold uppercase drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] mb-2">
               <span>PIXEL DEPTH</span>
               <select value={effects.pixelDepth} onChange={e => update('pixelDepth', e.target.value)} className="bg-[#333] text-[9px] border-2 border-white px-1 text-white uppercase font-bold outline-none">
                 <option value="none">Perfect</option>
                 <option value="32-bit">32-Bit</option>
                 <option value="16-bit">16-Bit</option>
                 <option value="8-bit">8-Bit</option>
               </select>
             </div>
             <SliderField label="Rounding" value={effects.cornerRadius} min={0} max={100} onChange={(v: any) => update('cornerRadius', v)} />
             <ToggleField label="ASCII Mode" active={effects.asciiMode} onToggle={() => update('asciiMode', !effects.asciiMode)} />
             <ToggleField label="Creeper Face" active={effects.creeperOverlay} onToggle={() => update('creeperOverlay', !effects.creeperOverlay)} />
        </ControlGroup>

        <ControlGroup title="Alteration" icon={Activity} info="Glitch and Distortion.">
            <SliderField label="Melt" value={effects.pixelSort} min={0} max={100} onChange={(v: any) => update('pixelSort', v)} />
            <SliderField label="RGB Split" value={effects.rgbSplit} min={0} max={20} onChange={(v: any) => update('rgbSplit', v)} />
            <ToggleField label="CRT Lines" active={effects.crtEffect} onToggle={() => update('crtEffect', !effects.crtEffect)} />
            <SliderField label="TV Noise" value={effects.tvNoise} min={0} max={100} onChange={(v: any) => update('tvNoise', v)} />
        </ControlGroup>

        <ControlGroup title="Magic Finish" icon={Palette} info="Overlays and textures.">
          <ToggleField label="Glint" active={effects.enchantmentGlint} onToggle={() => update('enchantmentGlint', !effects.enchantmentGlint)} />
          <SliderField label="Halftone" value={effects.halftoneIntensity} min={0} max={100} onChange={(v: any) => update('halftoneIntensity', v)} />
          <SliderField label="Saturation" value={effects.saturation} min={0} max={200} onChange={(v: any) => update('saturation', v)} />
          <div className="flex items-center gap-2">
            <input type="color" value={effects.outlineColor} onChange={e => update('outlineColor', e.target.value)} className="w-8 h-8 border-2 border-white" />
            <div className="flex-1"><SliderField label="Outline" value={effects.outlineWidth} min={0} max={40} onChange={(v: any) => update('outlineWidth', v)} /></div>
          </div>
        </ControlGroup>

        <ControlGroup title="Animation Engine" icon={Play} info="Control the movement. Switch to GIF export for these!">
           <ToggleField label="Enable Motion" active={effects.isAnimated} onToggle={() => update('isAnimated', !effects.isAnimated)} />
           {effects.isAnimated && (
             <div className="space-y-4 pt-2 border-t-2 border-black/20 animate-in slide-in-from-top-2">
                <select value={effects.animationType} onChange={e => update('animationType', e.target.value)} className="w-full bg-[#333] text-[10px] p-1 border-2 border-white text-white uppercase font-bold outline-none">
                  <option value="float">Hover</option>
                  <option value="pulse">Heartbeat</option>
                  <option value="spin">Inventory Spin</option>
                  <option value="jitter">Enderman Jitter</option>
                  <option value="bounce">Slime Bounce</option>
                  <option value="wave">Sea Wave</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                    <SliderField label="Speed" value={effects.animationSpeed} min={1} max={15} onChange={(v: any) => update('animationSpeed', v)} />
                    <SliderField label="Power" value={effects.animationIntensity} min={1} max={100} onChange={(v: any) => update('animationIntensity', v)} />
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between text-[8px] text-white font-bold uppercase">
                     <span>FRAME MODE</span>
                     <span className="text-indigo-300">{effects.animationFrameMode}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-1">
                     {['linear', 'random', 'vicinity'].map(m => (
                        <button key={m} onClick={() => update('animationFrameMode', m)} className={`text-[7px] py-1 border-2 font-bold uppercase ${effects.animationFrameMode === m ? 'bg-indigo-600 text-white border-white' : 'bg-[#333] text-white/50 border-black'}`}>{m}</button>
                     ))}
                   </div>
                </div>
             </div>
           )}
        </ControlGroup>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#8b8b8b] p-4 border-4 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff]">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <Terminal size={14} /> Custom Overlays
            </h4>
            <div className="flex flex-wrap gap-2">
                {['hitmarker', 'crosshair', 'vhs_static', 'gameboy_green', 'night_vision', 'wither_bloom'].map(fx => (
                    <button key={fx} className="px-3 py-1.5 bg-[#555] border-4 border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#222] border-b-[#222] text-[9px] text-white uppercase font-bold hover:bg-[#666] active:translate-y-1 transition-all">
                        {fx.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
        <div className="bg-[#8b8b8b] p-4 border-4 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff]">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <Cpu size={14} /> AI Alteration Tools
            </h4>
            <div className="grid grid-cols-3 gap-2">
                <button className="flex flex-col items-center gap-1 p-2 bg-[#4f46e5] border-4 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 text-white">
                    <Binary size={16} /> <span className="text-[8px] uppercase font-bold">Pixelize</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 bg-[#9333ea] border-4 border-t-purple-400 border-l-purple-400 border-r-purple-900 border-b-purple-900 text-white">
                    <Stars size={16} /> <span className="text-[8px] uppercase font-bold">Stylize</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 bg-[#db2777] border-4 border-t-pink-400 border-l-pink-400 border-r-pink-900 border-b-pink-900 text-white">
                    <Camera size={16} /> <span className="text-[8px] uppercase font-bold">Rescale</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
