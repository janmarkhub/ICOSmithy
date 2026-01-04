
import React, { useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

interface PaletteForgeProps {
  onApplyPalette: (colors: string[]) => void;
  visible: boolean;
  onClose?: () => void;
}

export const PaletteForge: React.FC<PaletteForgeProps> = ({ onApplyPalette, visible, onClose }) => {
  const [colors, setColors] = useState<string[]>(['#4f46e5', '#ffca28', '#f43f5e', '#10b981']);
  
  if (!visible) return null;

  return (
    <div className="fixed left-20 bottom-24 z-[1500] animate-in slide-in-from-left-4">
      <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-6 shadow-2xl w-64 relative font-mono">
        {onClose && (
          <button onClick={onClose} className="absolute -top-4 -right-4 bg-red-600 text-white p-2 border-2 border-black rounded-full hover:bg-red-500 z-50 shadow-xl">
            <X size={14} />
          </button>
        )}
        
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <Palette size={20} className="text-indigo-900"/>
            <h4 className="text-[12px] font-black uppercase tracking-tighter">Color Forge</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            {colors.map((c, i) => (
                <div key={i} onClick={e => e.stopPropagation()} className="space-y-1">
                    <span className="text-[8px] font-black uppercase block">Slot {i+1}</span>
                    <input 
                        type="color" 
                        value={c} 
                        onChange={e => {
                            const next = [...colors];
                            next[i] = e.target.value;
                            setColors(next);
                        }}
                        className="w-full h-12 border-4 border-black cursor-pointer shadow-md"
                    />
                </div>
            ))}
        </div>
        
        <button 
            onClick={() => onApplyPalette(colors)}
            className="w-full py-4 bg-indigo-600 border-4 border-white text-white text-[12px] font-black uppercase hover:bg-indigo-500 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
            <Check size={18}/> ENFORCE PALETTE
        </button>
      </div>
    </div>
  );
};
