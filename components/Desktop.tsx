
import React, { useState, useEffect } from 'react';
import { Monitor, Trash2, LayoutGrid, Settings, X, Search, Check, Zap, Wand2, Maximize, MousePointer2, Copy, Trash } from 'lucide-react';
import { ProcessedFile, DesktopAssignments } from '../types';

interface DesktopProps {
  files: ProcessedFile[];
  assignments: DesktopAssignments;
  onAssign: (slot: keyof DesktopAssignments, fileId: string) => void;
}

export const Desktop: React.FC<DesktopProps> = ({ files, assignments, onAssign }) => {
  const [isRecycleFull, setIsRecycleFull] = useState(false);
  const [startState, setStartState] = useState<'normal' | 'hover' | 'click'>('normal');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, asset: 'myPc' | 'recycle' | 'start' | null } | null>(null);
  const [activeModal, setActiveModal] = useState<'myPc' | 'recycle' | 'start' | null>(null);

  const getUrl = (fileId?: string, fallbackIcon?: React.ReactNode) => {
    const file = files.find(f => f.id === fileId);
    return file ? <img src={file.previewUrl} className="w-12 h-12 object-contain pixelated" /> : fallbackIcon;
  };

  const handleRightClick = (e: React.MouseEvent, asset: 'myPc' | 'recycle' | 'start') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, asset });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const DesktopAssetConfigModal = ({ asset }: { asset: 'myPc' | 'recycle' | 'start' }) => {
    const [search, setSearch] = useState('');
    const [selectingSlot, setSelectingSlot] = useState<keyof DesktopAssignments | null>(null);
    const [quickEffects, setQuickEffects] = useState({ scale: 1, brightness: 1, saturation: 1, rotate: 0, outline: 0 });

    const slots: { id: keyof DesktopAssignments, label: string }[] = 
      asset === 'myPc' ? [{ id: 'myPc', label: 'Main Icon' }] :
      asset === 'recycle' ? [{ id: 'recycleBinEmpty', label: 'Empty Bin' }, { id: 'recycleBinFull', label: 'Full Bin' }] :
      [{ id: 'startButtonNormal', label: 'Normal' }, { id: 'startButtonHover', label: 'Hover' }, { id: 'startButtonClick', label: 'Press' }];

    const filtered = files.filter(f => f.newName.toLowerCase().includes(search.toLowerCase()));

    const handleUseForAll = (fileId: string) => {
      slots.forEach(s => onAssign(s.id, fileId));
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono">
        <div className="w-full max-w-5xl bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-8 shadow-[20px_20px_0px_rgba(0,0,0,0.8)] flex flex-col md:flex-row gap-8 animate-in zoom-in duration-200">
          
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between bg-[#8b8b8b] p-3 border-4 border-b-[#555555] border-r-[#555555] border-t-[#ffffff] border-l-[#ffffff]">
              <h3 className="text-md text-white font-bold uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                <Settings size={20} className="animate-spin-slow" /> {asset.toUpperCase()} MULTI-STATE SMITHY
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-white hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {slots.map(slot => (
                <div key={slot.id} className={`bg-[#8b8b8b] p-4 border-4 transition-all duration-300 ${selectingSlot === slot.id ? 'border-yellow-400 scale-[1.02]' : 'border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555]'} flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black/40 flex items-center justify-center border-4 border-black/60 relative overflow-hidden group">
                      {getUrl(assignments[slot.id], <Wand2 size={24} className="opacity-10" />)}
                      {assignments[slot.id] && (
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize size={20} className="text-white"/>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-white font-bold uppercase tracking-widest">{slot.label}</p>
                      <p className="text-[10px] text-white/50 uppercase font-bold">{assignments[slot.id] ? "Assigned" : "Required"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectingSlot(slot.id)}
                      className={`px-4 py-2 text-[10px] font-bold uppercase border-4 transition-all ${selectingSlot === slot.id ? 'bg-yellow-400 text-black border-white' : 'bg-[#555] text-white border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-black border-b-black hover:bg-[#666]'}`}
                    >
                      {selectingSlot === slot.id ? "Assigning..." : "Choose Icon"}
                    </button>
                    {assignments[slot.id] && (
                      <button 
                        onClick={() => handleUseForAll(assignments[slot.id]!)}
                        className="px-3 py-2 bg-indigo-600 text-white border-4 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 text-[9px] font-bold uppercase flex items-center gap-1.5"
                        title="Clone to all states"
                      >
                        <Copy size={12}/> Globalize
                      </button>
                    )}
                    <button onClick={() => onAssign(slot.id, "")} className="p-2 bg-red-800 border-4 border-t-red-600 border-l-red-600 border-r-red-950 border-b-red-950"><Trash size={14}/></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#333] p-4 border-4 border-black space-y-4">
              <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2 border-b-2 border-white/10 pb-2">
                <Zap size={14} className="animate-pulse" /> Live Interaction Toolkit
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-white/80 font-bold uppercase"><span>Size</span><span>{quickEffects.scale}x</span></div>
                  <input type="range" min="0.5" max="2.5" step="0.1" value={quickEffects.scale} onChange={e => setQuickEffects({...quickEffects, scale: +e.target.value})} className="w-full h-1.5 bg-black accent-yellow-500 cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-white/80 font-bold uppercase"><span>Bright</span><span>{quickEffects.brightness}</span></div>
                  <input type="range" min="0" max="2" step="0.1" value={quickEffects.brightness} onChange={e => setQuickEffects({...quickEffects, brightness: +e.target.value})} className="w-full h-1.5 bg-black accent-yellow-500 cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-white/80 font-bold uppercase"><span>Color</span><span>{quickEffects.saturation}</span></div>
                  <input type="range" min="0" max="2" step="0.1" value={quickEffects.saturation} onChange={e => setQuickEffects({...quickEffects, saturation: +e.target.value})} className="w-full h-1.5 bg-black accent-yellow-500 cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-white/80 font-bold uppercase"><span>Rotate</span><span>{quickEffects.rotate}°</span></div>
                  <input type="range" min="-180" max="180" step="5" value={quickEffects.rotate} onChange={e => setQuickEffects({...quickEffects, rotate: +e.target.value})} className="w-full h-1.5 bg-black accent-yellow-500 cursor-pointer" />
                </div>
              </div>
              <p className="text-[9px] text-[#ffca28] text-center uppercase font-bold tracking-tighter animate-pulse">Preview only: Tweak to visualize movement effects</p>
            </div>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-white/50" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH FORGED ITEMS..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#8b8b8b] border-4 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff] p-3 pl-10 text-[10px] text-white placeholder-white/40 outline-none uppercase font-bold"
              />
            </div>
            <div className="flex-1 bg-black/60 border-4 border-black p-3 grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar h-[500px]">
              {filtered.map(file => (
                <div 
                  key={file.id} 
                  onClick={() => {
                    if (selectingSlot) {
                      onAssign(selectingSlot, file.id);
                      setSelectingSlot(null);
                    }
                  }}
                  className={`group aspect-square bg-[#8b8b8b] border-4 cursor-pointer hover:bg-white/10 p-2 flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95
                    ${selectingSlot && filtered.length > 0 ? 'border-yellow-500' : 'border-t-white border-l-white border-r-[#333] border-b-[#333]'}
                  `}
                >
                  <img 
                    src={file.previewUrl} 
                    className="w-full h-full object-contain pixelated" 
                    style={{ 
                      transform: `scale(${quickEffects.scale}) rotate(${quickEffects.rotate}deg)`,
                      filter: `brightness(${quickEffects.brightness}) saturate(${quickEffects.saturation})`
                    }}
                  />
                  {selectingSlot && <div className="absolute inset-0 bg-yellow-400/20 opacity-0 group-hover:opacity-100 flex items-center justify-center border-2 border-yellow-400"><Check size={24} className="text-white drop-shadow-md"/></div>}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 flex flex-col items-center justify-center h-full opacity-20">
                    <Wand2 size={48} />
                    <p className="text-[10px] font-bold uppercase mt-4">Inventory Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-video bg-[#2c3e50] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] rounded-sm overflow-hidden shadow-2xl group/desktop">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d] opacity-40 mix-blend-overlay" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-8">
        <div 
          className="flex flex-col items-center gap-1 w-20 p-2 hover:bg-white/10 rounded cursor-pointer border-2 border-transparent hover:border-white/20 transition-all hover:translate-x-1"
          onContextMenu={e => handleRightClick(e, 'myPc')}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            {getUrl(assignments.myPc, <Monitor className="text-white opacity-80" size={32} />)}
          </div>
          <span className="text-[9px] text-white font-bold drop-shadow-[1px_1px_1px_rgba(0,0,0,1)] uppercase">This PC</span>
        </div>

        <div 
          className="flex flex-col items-center gap-1 w-20 p-2 hover:bg-white/10 rounded cursor-pointer border-2 border-transparent hover:border-white/20 transition-all hover:translate-x-1"
          onContextMenu={e => handleRightClick(e, 'recycle')}
          onClick={() => setIsRecycleFull(!isRecycleFull)}
        >
          <div className="w-12 h-12 flex items-center justify-center animate-mosh-float" style={{ animationDelay: '0.2s' }}>
            {isRecycleFull 
              ? getUrl(assignments.recycleBinFull, <Trash2 className="text-indigo-300" size={32} />)
              : getUrl(assignments.recycleBinEmpty, <Trash2 className="text-white opacity-80" size={32} />)
            }
          </div>
          <span className="text-[9px] text-white font-bold drop-shadow-[1px_1px_1px_rgba(0,0,0,1)] uppercase text-center">
            Recycle Bin<br/>{isRecycleFull ? '(Full)' : '(Empty)'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/50 backdrop-blur-xl flex items-center justify-center px-4 border-t-2 border-white/10">
        <div 
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all cursor-pointer border-2 group
            ${startState === 'click' ? 'bg-white/30 border-white/50 scale-90' : 'bg-white/10 border-transparent hover:bg-white/20 hover:scale-110'}
          `}
          onMouseEnter={() => setStartState('hover')}
          onMouseLeave={() => setStartState('normal')}
          onMouseDown={() => setStartState('click')}
          onMouseUp={() => setStartState('hover')}
          onContextMenu={e => handleRightClick(e, 'start')}
        >
          <div className="group-hover:animate-mosh-sparkle transition-all">
              {startState === 'normal' && getUrl(assignments.startButtonNormal, <LayoutGrid className="text-white" size={18} />)}
              {startState === 'hover' && getUrl(assignments.startButtonHover || assignments.startButtonNormal, <LayoutGrid className="text-indigo-400" size={18} />)}
              {startState === 'click' && getUrl(assignments.startButtonClick || assignments.startButtonHover || assignments.startButtonNormal, <LayoutGrid className="text-indigo-600" size={18} />)}
          </div>
        </div>
      </div>

      {contextMenu && (
        <div 
          className="fixed z-[200] w-56 bg-[#c6c6c6] border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] shadow-[10px_10px_0px_rgba(0,0,0,0.8)] font-mono text-[10px] p-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button 
            onClick={() => setActiveModal(contextMenu.asset)}
            className="w-full text-left px-4 py-3 hover:bg-indigo-600 hover:text-white uppercase font-bold flex items-center gap-3 transition-colors group"
          >
            <Settings size={14} className="group-hover:rotate-90 transition-transform" /> Advanced Forge
          </button>
          <div className="h-1 bg-[#555] border-t-2 border-white/10" />
          <button className="w-full text-left px-4 py-3 opacity-30 cursor-not-allowed uppercase font-bold flex items-center gap-3">
             <MousePointer2 size={14}/> Properties
          </button>
        </div>
      )}

      {activeModal && <DesktopAssetConfigModal asset={activeModal} />}

      <div className="absolute top-2 right-2 bg-black/60 p-2 rounded text-[8px] text-indigo-300 uppercase font-bold tracking-tighter opacity-0 group-hover/desktop:opacity-100 transition-opacity">
        Advanced: Right-Click icon to Forge States
      </div>
    </div>
  );
};
