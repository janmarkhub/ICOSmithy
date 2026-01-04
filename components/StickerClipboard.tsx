
import React, { useState } from 'react';
import { 
  Package, Plus, Trash2, MousePointer2, Hammer, X, 
  Sparkles, Wand2, CloudRain, Monitor, Scissors 
} from 'lucide-react';
import { CustomSticker, StickerTexture, ProcessedFile } from '../types';

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
  const [isOpen, setIsOpen] = useState(true);
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
    { id: 'none', label: 'Raw' },
    { id: 'foil', label: 'Foil' },
    { id: 'holo', label: 'Holo' },
    { id: 'gold', label: 'Gold' },
    { id: 'realistic', label: 'Real' }
  ];

  // Combined inventory logic: show stickers first, then icons
  const inventorySlots = Array.from({ length: 30 }).map((_, i) => {
    const sticker = stickers[i];
    const icon = !sticker ? processedIcons[i - stickers.length] : null;
    return { sticker, icon };
  });

  return (
    <div className="fixed right-6 bottom-6 z-50 flex items-end gap-4 pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto w-[440px] bg-[#c6c6c6] border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] p-4 font-mono">
          <div className="flex items-center justify-between mb-4 bg-[#8b8b8b] p-2 border-2 border-b-[#555555] border-r-[#555555] border-t-[#ffffff] border-l-[#ffffff]">
            <h4 className="text-xs text-white font-bold uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <Hammer size={14} /> Global Bag
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-red-400 transition-colors"><X size={16}/></button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Enchanting Area */}
            <div 
              className="bg-[#8b8b8b] border-4 border-[#3c3c3c] flex flex-col items-center justify-center relative p-2 h-44"
              onDragOver={e => e.preventDefault()}
              onDrop={handleWorkbenchDrop}
            >
                {workbenchSticker ? (
                    <div className="flex flex-col items-center w-full">
                        <img src={workbenchSticker.url} className="w-12 h-12 object-contain mb-2 pixelated" />
                        <div className="grid grid-cols-2 gap-1 w-full">
                            {textureList.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => {
                                        onApplyTexture(workbenchSticker.id, t.id);
                                        setWorkbenchSticker(null);
                                    }}
                                    className={`text-[8px] p-1 border border-black uppercase font-bold transition-all ${workbenchSticker.texture === t.id ? 'bg-[#ffca28] border-white text-black' : 'bg-[#ddd] hover:bg-white text-[#333]'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-[9px] text-white opacity-40 text-center animate-pulse uppercase font-bold">Enchant Sticker Slot</p>
                )}
            </div>

            {/* Quick Spell Bar */}
            <div className="bg-[#8b8b8b] p-2 border-2 border-t-[#555555] border-l-[#555555] border-b-[#ffffff] border-r-[#ffffff] flex flex-col gap-1">
                <p className="text-[8px] text-white uppercase font-bold mb-1 opacity-60">Icon Magic</p>
                <div className="grid grid-cols-2 gap-1 flex-1">
                    <button onClick={() => onGenerate('random')} className="p-1 bg-[#555] border-2 border-white hover:bg-[#666] flex flex-col items-center justify-center text-white">
                        <Sparkles size={12}/><span className="text-[7px] uppercase font-bold">Chaos</span>
                    </button>
                    <button onClick={() => onGenerate('based')} className="p-1 bg-[#555] border-2 border-white hover:bg-[#666] flex flex-col items-center justify-center text-white">
                        <Monitor size={12}/><span className="text-[7px] uppercase font-bold">Set Gen</span>
                    </button>
                    <button onClick={() => onGenerate('hat')} className="p-1 bg-[#555] border-2 border-white hover:bg-[#666] flex flex-col items-center justify-center text-white">
                        <Package size={12}/><span className="text-[7px] uppercase font-bold">Style</span>
                    </button>
                    <button onClick={() => onGenerate('weather')} className="p-1 bg-[#555] border-2 border-white hover:bg-[#666] flex flex-col items-center justify-center text-white">
                        <CloudRain size={12}/><span className="text-[7px] uppercase font-bold">Weather</span>
                    </button>
                </div>
            </div>
          </div>

          {/* Main Slots */}
          <div className="bg-[#8b8b8b] p-1 border-2 border-t-[#555555] border-l-[#555555] border-b-[#ffffff] border-r-[#ffffff]">
            <div className="grid grid-cols-5 gap-1 max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
              {inventorySlots.map((slot, i) => (
                  <div 
                    key={i} 
                    draggable={!!(slot.sticker || slot.icon)}
                    onDragStart={e => {
                      if (slot.sticker) e.dataTransfer.setData('stickerId', slot.sticker.id);
                      if (slot.icon) e.dataTransfer.setData('fileId', slot.icon.id);
                    }}
                    className="aspect-square bg-[#8b8b8b] border-2 border-b-[#ffffff] border-r-[#ffffff] border-t-[#555555] border-l-[#555555] flex flex-col items-center justify-center relative group overflow-hidden"
                  >
                    {slot.sticker ? (
                      <>
                        <img src={slot.sticker.url} className="w-8 h-8 object-contain pixelated" />
                        <span className="text-[6px] text-yellow-400 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] font-bold uppercase mt-1">Sticker</span>
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1">
                            <button onClick={() => onBatchApply(slot.sticker!)} className="p-1 bg-green-700 text-white border-2 border-white rounded"><MousePointer2 size={10}/></button>
                            <button onClick={() => onRemoveSticker(slot.sticker!.id)} className="p-1 bg-red-700 text-white border-2 border-white rounded"><Trash2 size={10}/></button>
                        </div>
                      </>
                    ) : slot.icon ? (
                      <>
                        <img src={slot.icon.previewUrl} className="w-8 h-8 object-contain pixelated" />
                        <span className="text-[6px] text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] font-bold uppercase mt-1">Icon</span>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <span className="text-[5px] text-white font-bold uppercase bg-black/60 px-1">Draggable</span>
                        </div>
                      </>
                    ) : (
                      <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/10">
                        <Plus size={14} className="text-white opacity-20" />
                        <input type="file" className="hidden" onChange={e => handleSlotUpload(e, i)} accept="image/*" />
                      </label>
                    )}
                  </div>
              ))}
            </div>
          </div>
          <p className="text-[8px] text-[#333] mt-2 italic text-center uppercase font-bold opacity-60">Inventory space: {stickers.length + processedIcons.length} / 30 slots used</p>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-20 h-20 bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] shadow-2xl rounded-sm flex items-center justify-center text-[#555] hover:scale-105 active:scale-95 transition-all"
      >
        <Package size={40} className="drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]" />
      </button>
    </div>
  );
};
