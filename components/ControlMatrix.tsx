
import React, { useState } from 'react';
import { 
  Scissors, Palette, RefreshCw, Wand2, Trash2, 
  HelpCircle, ChevronRight, MousePointer2, Target
} from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

interface ControlMatrixProps {
  selectedIds: string[];
  onAction: (action: string, payload?: any) => void;
  visible: boolean;
}

export const ControlMatrix: React.FC<ControlMatrixProps> = ({ selectedIds, onAction, visible }) => {
  const [activeInput, setActiveInput] = useState<'style' | 'guide' | null>(null);
  const [inputValue, setInputValue] = useState('');

  if (!visible) return null;

  const handleApply = () => {
    onAction(activeInput === 'style' ? 'change-style' : 'guide-prompt', inputValue);
    setActiveInput(null);
    setInputValue('');
  };

  const ActionButton = ({ icon: Icon, label, onClick, color = "bg-[#555]", tooltipTitle, tooltipDesc }: any) => (
    <RetroTooltip title={tooltipTitle} description={tooltipDesc} position="right">
      <button 
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center w-full h-20 border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] ${color} hover:brightness-110 transition-all active:scale-95 shadow-md`}
      >
        <Icon size={24} className="text-white group-hover:animate-mosh-shake" />
        <span className="text-[7px] font-black uppercase text-white mt-1 tracking-tighter">{label}</span>
      </button>
    </RetroTooltip>
  );

  return (
    <div className="flex flex-col gap-2 animate-in slide-in-from-left-8 duration-300">
      <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-2 shadow-2xl flex flex-col gap-2 relative w-24">
        
        <div className="absolute -top-12 left-0 w-full bg-indigo-600 text-white border-4 border-white px-2 py-1.5 text-[9px] font-black uppercase italic shadow-lg flex items-center justify-center gap-2">
            <MousePointer2 size={12}/> {selectedIds.length} FOCUS
        </div>

        <ActionButton 
          icon={Scissors} label="Alpha Scrub" onClick={() => onAction('make-transparent')} 
          tooltipTitle="Background Purge" tooltipDesc="Removes non-transparent color chunks around your asset. Perfect for 'dirty' AI generated icons."
        />
        <ActionButton 
          icon={Target} label="Recenter" onClick={() => onAction('center-icon')} color="bg-green-700"
          tooltipTitle="Smart Alignment" tooltipDesc="Analyzes pixel density and forcibly snaps the icon content to the absolute grid center."
        />
        <ActionButton 
          icon={Palette} label="Restyle" onClick={() => setActiveInput('style')} color="bg-indigo-700" 
          tooltipTitle="Aesthetic Overhaul" tooltipDesc="Updates the visual style of these assets using AI global restyling."
        />
        <ActionButton 
          icon={RefreshCw} label="Reroll" onClick={() => onAction('reroll')} 
          tooltipTitle="Divine Reroll" tooltipDesc="Generates fresh versions of these assets using their original metadata."
        />
        <ActionButton 
          icon={Wand2} label="Guide Edit" onClick={() => setActiveInput('guide')} 
          tooltipTitle="Guided Refinement" tooltipDesc="Directly tell the AI what structural changes you want for these specific items."
        />
        <ActionButton 
          icon={Trash2} label="Discard" onClick={() => onAction('delete')} color="bg-red-800" 
          tooltipTitle="Destroy Asset" tooltipDesc="Permanently wipes these items from your active inventory stash."
        />

        <div className="mt-4 p-2 bg-black/10 border-2 border-white/20 text-center">
            <HelpCircle size={14} className="mx-auto text-white/40" />
            <p className="text-[6px] text-black font-bold uppercase mt-1 leading-tight opacity-50">Multiselect<br/>Enabled</p>
        </div>
      </div>

      {activeInput && (
        <div className="fixed left-36 top-1/2 -translate-y-1/2 w-80 bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-6 shadow-2xl animate-in slide-in-from-left-6 duration-300">
             <div className="flex items-center justify-between mb-5 border-b-2 border-black/10 pb-3">
                <h4 className="text-[10px] font-black uppercase flex items-center gap-3">
                    {activeInput === 'style' ? <Palette size={16}/> : <Wand2 size={16}/>} 
                    {activeInput === 'style' ? 'Aesthetic Focus' : 'Guided Forge'}
                </h4>
                <button onClick={() => setActiveInput(null)} className="hover:text-red-600 transition-colors"><ChevronRight size={20}/></button>
             </div>
             <textarea 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={activeInput === 'style' ? 'e.g. 16-bit Sega Genesis style, high saturation...' : 'e.g. Add a glowing halo, make the base metallic...'}
                className="w-full h-32 bg-black/30 border-4 border-[#555] p-4 text-[11px] text-white font-bold uppercase outline-none focus:bg-black transition-all resize-none"
             />
             <button 
                onClick={handleApply}
                className="w-full mt-5 py-4 bg-indigo-600 border-4 border-white text-white text-[11px] font-black uppercase hover:bg-indigo-500 shadow-xl active:scale-95 transition-all"
             >
                Reforge {selectedIds.length} Assets
             </button>
        </div>
      )}
    </div>
  );
};
