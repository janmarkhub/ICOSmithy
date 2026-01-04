
import React, { useState } from 'react';
import { HelpCircle, Wand2, Monitor, Package, X } from 'lucide-react';

interface FloatingHelpProps {
  onNav: (path: 'upscale' | 'test' | 'cauldron') => void;
}

export const FloatingHelp: React.FC<FloatingHelpProps> = ({ onNav }) => {
  const [isOpen, setIsOpen] = useState(false);

  const paths = [
    { id: 'cauldron', label: 'AI Icon Pack Generator', icon: Package, text: 'Use The Cauldron to summon complete 10-icon sets from a single source or dynamic theme.' },
    { id: 'upscale', label: 'Bulk Edit & Upscale', icon: Wand2, text: 'Use The Smithy to refine existing assets with high-fidelity smoothing and batch effects.' },
    { id: 'test', label: 'Test Your Setup', icon: Monitor, text: 'Use Desktop Forge to simulate real-world usage and visit themed digital workstations.' }
  ];

  return (
    <div className="fixed left-6 bottom-6 z-[1000]">
      {isOpen && (
        <div className="absolute bottom-24 left-0 w-80 bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-6 shadow-2xl animate-in slide-in-from-bottom-8 font-mono">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase italic">Smithy Grimoire</h3>
                <button onClick={()=>setIsOpen(false)}><X size={20} className="text-[#333]"/></button>
            </div>
            <div className="space-y-6">
                {paths.map(p => (
                    <div key={p.id} className="group cursor-pointer" onClick={() => { onNav(p.id as any); setIsOpen(false); }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1 bg-indigo-600 text-white border-2 border-white group-hover:scale-110 transition-transform"><p.icon size={16}/></div>
                            <span className="text-[10px] font-black uppercase group-hover:text-indigo-600 transition-colors">{p.label}</span>
                        </div>
                        <p className="text-[9px] text-[#555] font-bold uppercase leading-relaxed">{p.text}</p>
                    </div>
                ))}
            </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] flex items-center justify-center text-[#333] shadow-2xl hover:scale-110 active:scale-95 transition-all ${isOpen ? 'rotate-90' : ''}`}
      >
        <HelpCircle size={32} />
      </button>
    </div>
  );
};
