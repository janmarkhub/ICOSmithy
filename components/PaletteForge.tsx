
import React, { useState } from 'react';
import { Palette, RefreshCw, X, Check, Droplets } from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

interface PaletteForgeProps {
  onApplyPalette: (colors: string[]) => void;
  visible: boolean;
}

export const PaletteForge: React.FC<PaletteForgeProps> = ({ onApplyPalette, visible }) => {
  const [colors, setColors] = useState<string[]>(['#4f46e5', '#ffca28', '#f43f5e', '#10b981']);
  
  if (!visible) return null;

  const handleApply = () => onApplyPalette(colors);

  return (
    <div className="fixed left-6 bottom-24 z-[1500] animate-in slide-in-from-left-8">
      <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-4 shadow-2xl w-48 font-mono">
        <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-2">
            <h4 className="text-[9px] font-black uppercase flex items-center gap-2"><Palette size={12}/> Color Forge</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
            {colors.map((c, i) => (
                <RetroTooltip key={i} title={`Color Channel ${i+1}`} description="Select a dominant color for the enforcement palette.">
                  <input 
                      type="color" 
                      value={c} 
                      onChange={e => {
                          const next = [...colors];
                          next[i] = e.target.value;
                          setColors(next);
                      }}
                      className="w-full h-8 border-2 border-black cursor-pointer hover:scale-105 transition-transform"
                  />
                </RetroTooltip>
            ))}
        </div>
        
        <RetroTooltip title="Enforce Scheme" description="Actively re-maps the selected icons' colors to follow this 4-color palette using duotone and tint logic." position="top">
          <button 
              onClick={handleApply}
              className="w-full py-3 bg-indigo-600 border-4 border-white text-white text-[9px] font-black uppercase hover:bg-indigo-500 shadow-xl flex items-center justify-center gap-2"
          >
              <Check size={14}/> Enforce Scheme
          </button>
        </RetroTooltip>
      </div>
    </div>
  );
};
