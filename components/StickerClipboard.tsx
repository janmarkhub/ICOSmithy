
import React, { useState } from 'react';
import { 
  Package, Plus, Trash2, MousePointer2, Hammer, X, 
  Sparkles, Wand2, CloudRain, Monitor, LayoutGrid 
} from 'lucide-react';
import { CustomSticker, StickerTexture, ProcessedFile } from '../types';
import { RetroTooltip } from './RetroTooltip';

interface StickerClipboardProps {
  onAddSticker: (url: string, slotIndex: number) => void;
  onRemoveSticker: (id: string) => void;
  stickers: CustomSticker[];
  processedIcons: ProcessedFile[];
  onBatchApply: (sticker: CustomSticker) => void;
  onGenerate: (type: string) => void;
  onApplyTexture: (stickerId: string, texture: StickerTexture) => void;
}

export const StickerClipboard: React.FC<StickerClipboardProps> = ({ 
  onAddSticker, onRemoveSticker, stickers, processedIcons, onBatchApply, onGenerate, onApplyTexture
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [workbenchSticker, setWorkbenchSticker] = useState<CustomSticker | null>(null);

  const handleSlotUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (file) onAddSticker(URL.createObjectURL(file), slotIndex);
  };

  const handleWorkbenchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('stickerId');
    const stick = stickers.find(s => s.id === id);
    if (stick) setWorkbenchSticker(stick);
  };

  const textureList: { id: StickerTexture, label: string }[] = [
    { id: 'none', label: 'RAW' },
    { id: 'foil', label: 'FOIL' },
    { id: 'holo', label: 'HOLO' },
    { id: 'gold', label: 'GOLD' },
    { id: 'realistic', label: 'REAL' }
  ];

  const inventorySlots = Array.from({ length: 30 }).map((_, i) => {
    const sticker = stickers[i];
    const icon = !sticker ? processedIcons[i - stickers.length] : null;
    return { sticker, icon };
  });

  return (
    <div className="fixed right-6 bottom-6 z-[2000] flex items-end gap-4 pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto w-[400px] bg-[#c6c6c6] border-2 border-black shadow-[8px_8px_0_#000,inset_2px_2px_0_#fff] p-3 animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center justify-between bg-[#000080] p-1.5 mb-4 border border-black shadow-[inset_1px_1px_0_#ffffff22]">
            <h4 className="text-[10px] text-white font-bold uppercase flex items-center gap-2">
                <Package size={14} /> GLOBAL_BAG.EXE
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-red-600 p-0.5"><X size={14}/></button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Enchanting Slot */}
            <div 
              className="bg-[#eee] border-2 border-black shadow-[inset_2px_2px_0_#888] flex flex-col items-center justify-center p-2 h-40 relative group"
              onDragOver={e => e.preventDefault()}
              onDrop={handleWorkbenchDrop}
            >
                {workbenchSticker ? (
                    <div className="flex flex-col items-center w-full animate-in zoom-in duration-150">
                        <img src={workbenchSticker.url} className="w-10 h-10 object-contain mb-3 pixelated" />
                        <div className="grid grid-cols-2 gap-1 w-full">
                            {textureList.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => {
                                        onApplyTexture(workbenchSticker.id, t.id);
                                        setWorkbenchSticker(null);
                                    }}
                                    className={`text-[7px] p-1 border border-black uppercase font-bold shadow-sm transition-all ${workbenchSticker.texture === t.id ? 'bg-indigo-600 text-white' : 'bg-[#ddd] hover:bg-white text-[#333]'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={()=>setWorkbenchSticker(null)} className="absolute top-1 right-1 text-[#333] hover:text-red-600"><X size={12}/></button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-30">
                        <Hammer size={24} className="text-[#333]" />
                        <p className="text-[8px] text-[#333] text-center uppercase font-bold">DROP_ASSET_TO_ENCHANT</p>
                    </div>
                )}
            </div>

            {/* AI Spell Casting */}
            <div className="bg-[#eee] border-2 border-black shadow-[inset_2px_2px_0_#888] p-2 flex flex-col gap-2">
                <p className="text-[8px] text-[#333] uppercase font-bold border-b border-black/10 pb-1">AI SPELLS</p>
                <div className="grid grid-cols-2 gap-1.5 flex-1">
                    {[
                        { id: 'random', label: 'CHAOS', icon: Sparkles, color: 'hover:bg-amber-400' },
                        { id: 'based', label: 'THEME', icon: LayoutGrid, color: 'hover:bg-blue-400' },
                        { id: 'hat', label: 'STYLE', icon: Wand2, color: 'hover:bg-purple-400' },
                        { id: 'weather', label: 'FLUX', icon: CloudRain, color: 'hover:bg-cyan-400' }
                    ].map(spell => (
                        <button 
                            key={spell.id}
                            onClick={() => onGenerate(spell.id)} 
                            className={`p-1 bg-[#ccc] border border-black shadow-[1px_1px_0_#fff] flex flex-col items-center justify-center text-[#333] transition-colors ${spell.color}`}
                        >
                            <spell.icon size={12}/><span className="text-[7px] uppercase font-bold mt-0.5">{spell.label}</span>
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="bg-[#8b8b8b] border-2 border-black shadow-[inset_2px_2px_0_#333] p-1">
            <div className="grid grid-cols-5 gap-1 max-h-[160px] overflow-y-auto p-1 custom-scrollbar">
              {inventorySlots.map((slot, i) => (
                  <div 
                    key={i} 
                    draggable={!!(slot.sticker || slot.icon)}
                    onDragStart={e => {
                      if (slot.sticker) e.dataTransfer.setData('stickerId', slot.sticker.id);
                      if (slot.icon) e.dataTransfer.setData('fileId', slot.icon.id);
                    }}
                    className="aspect-square bg-[#eee] border border-black flex flex-col items-center justify-center relative group overflow-hidden shadow-inner"
                  >
                    {slot.sticker ? (
                      <>
                        <img src={slot.sticker.url} className="w-8 h-8 object-contain pixelated" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                            <button onClick={() => onBatchApply(slot.sticker!)} className="p-1 text-white hover:text-green-400"><MousePointer2 size={12}/></button>
                            <button onClick={() => onRemoveSticker(slot.sticker!.id)} className="p-1 text-white hover:text-red-400"><Trash2 size={12}/></button>
                        </div>
                      </>
                    ) : slot.icon ? (
                      <>
                        <img src={slot.icon.previewUrl} className="w-8 h-8 object-contain pixelated" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <span className="text-[5px] text-white font-bold uppercase bg-black px-1">DRAG</span>
                        </div>
                      </>
                    ) : (
                      <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors">
                        <Plus size={12} className="text-[#333] opacity-20" />
                        <input type="file" className="hidden" onChange={e => handleSlotUpload(e, i)} accept="image/*" />
                      </label>
                    )}
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <RetroTooltip title="Inventory" description="Access your global bag of stashed assets and AI stickers." position="left">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="pointer-events-auto w-16 h-16 bg-[#c6c6c6] border-2 border-black shadow-[4px_4px_0_#000,inset_2px_2px_0_#fff] flex items-center justify-center text-[#333] hover:scale-105 active:scale-95 transition-all"
        >
          <Package size={32} className={isOpen ? 'text-indigo-600' : 'text-[#333]'} />
        </button>
      </RetroTooltip>
    </div>
  );
};
