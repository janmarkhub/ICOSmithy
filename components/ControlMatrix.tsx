
import React, { useState } from 'react';
import { 
  Scissors, Palette, RefreshCw, Wand2, Trash2, 
  HelpCircle, ChevronRight, Binary, Sparkles, MessageSquare,
  MousePointer2
} from 'lucide-react';

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

  const ActionButton = ({ icon: Icon, label, onClick, color = "bg-[#555]" }: any) => (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center w-20 h-20 border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] ${color} hover:bg-[#666] transition-all active:scale-95`}
    >
      <Icon size={24} className="text-white group-hover:animate-mosh-shake" />
      <span className="text-[7px] font-black uppercase text-white mt-1 tracking-tighter">{label}</span>
      
      {/* Tooltip */}
      <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        <div className="bg-black text-white text-[8px] p-2 border-2 border-white uppercase font-black whitespace-nowrap shadow-xl">
           {label} {selectedIds.length} item(s)
        </div>
      </div>
    </button>
  );

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[1500] flex flex-col gap-2 animate-in slide-in-from-left-12 duration-500">
      <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-2 shadow-2xl flex flex-col gap-2 relative">
        
        {/* Selection Counter Badge */}
        <div className="absolute -top-10 left-0 bg-indigo-600 text-white border-4 border-white px-3 py-1 text-[9px] font-black uppercase italic shadow-lg flex items-center gap-2">
            <MousePointer2 size={12}/> {selectedIds.length} SELECTED
        </div>

        <ActionButton icon={Scissors} label="Transparent" onClick={() => onAction('make-transparent')} />
        <ActionButton icon={Palette} label="Change Style" onClick={() => setActiveInput('style')} color="bg-indigo-700" />
        <ActionButton icon={RefreshCw} label="Reroll" onClick={() => onAction('reroll')} />
        <ActionButton icon={Wand2} label="Guide" onClick={() => setActiveInput('guide')} />
        <ActionButton icon={Trash2} label="Delete" onClick={() => onAction('delete')} color="bg-red-800" />

        <div className="mt-4 p-2 bg-black/10 border-2 border-white/20 text-center">
            <HelpCircle size={14} className="mx-auto text-white/40" />
            <p className="text-[6px] text-black font-bold uppercase mt-1 leading-tight opacity-50">Shift+Click<br/>to multi-select</p>
        </div>
      </div>

      {activeInput && (
        <div className="absolute left-full ml-6 top-0 w-64 bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-4 shadow-2xl animate-in slide-in-from-left-4">
             <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-2">
                <h4 className="text-[9px] font-black uppercase flex items-center gap-2">
                    {activeInput === 'style' ? <Palette size={12}/> : <Wand2 size={12}/>} 
                    {activeInput === 'style' ? 'Global Styling' : 'Structural Guide'}
                </h4>
                <button onClick={() => setActiveInput(null)}><ChevronRight size={16}/></button>
             </div>
             <textarea 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={activeInput === 'style' ? 'e.g. 8-bit, glowing neon edges...' : 'e.g. Change to a dragon shape...'}
                className="w-full h-24 bg-black/20 border-4 border-[#555] p-3 text-[10px] text-white font-bold uppercase outline-none focus:bg-black transition-all"
             />
             <button 
                onClick={handleApply}
                className="w-full mt-4 py-3 bg-indigo-600 border-4 border-white text-white text-[10px] font-black uppercase hover:bg-indigo-500 shadow-xl"
             >
                Apply to {selectedIds.length} Items
             </button>
        </div>
      )}
    </div>
  );
};
