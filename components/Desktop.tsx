
import React, { useState, useEffect } from 'react';
// Import Box icon from lucide-react
import { Monitor, Trash2, LayoutGrid, Settings, X, Search, Check, Zap, Wand2, Maximize, MousePointer2, Copy, Trash, Eye, Layers, User, Globe, RefreshCw, Loader2, Folder, HardDrive, Network, UserCircle, Briefcase, Box } from 'lucide-react';
import { ProcessedFile, DesktopAssignments, PersonBio } from '../types';
import { getPersonProfile } from '../utils/aiVision';

interface DesktopProps {
  files: ProcessedFile[];
  assignments: DesktopAssignments;
  onAssign: (slot: keyof DesktopAssignments, fileId: string) => void;
  onError: (msg: string, fix: string) => void;
}

export const Desktop: React.FC<DesktopProps> = ({ files, assignments, onAssign, onError }) => {
  const [isRecycleFull, setIsRecycleFull] = useState(false);
  const [startState, setStartState] = useState<'normal' | 'hover' | 'click'>('normal');
  const [activeModal, setActiveModal] = useState<'config' | 'visit' | null>(null);
  const [activeSlot, setActiveSlot] = useState<keyof DesktopAssignments | null>(null);
  
  // Person Visit State
  const [searchPerson, setSearchPerson] = useState('');
  const [currentPerson, setCurrentPerson] = useState<PersonBio | null>(null);
  const [isVisiting, setIsVisiting] = useState(false);

  const getUrl = (fileId?: string, fallbackIcon?: React.ReactNode) => {
    const file = files.find(f => f.id === fileId);
    return file ? <img src={file.previewUrl} className="w-12 h-12 object-contain pixelated drop-shadow-lg" /> : fallbackIcon;
  };

  const handleVisit = async () => {
    if (!searchPerson.trim()) return;
    setIsVisiting(true);
    try {
      const profile = await getPersonProfile(searchPerson);
      if (!profile) {
        onError("Host not found!", "The specified user has no detectable digital footprint. WAT DO? Try a more famous person, like 'Steve Jobs' or 'SpongeBob SquarePants'.");
      } else {
        setCurrentPerson(profile);
        setActiveModal(null);
      }
    } catch (e) {
      onError("Visit Interrupted!", "A firewall blocked our teleportation. Try a first and last name basis.");
    } finally {
      setIsVisiting(false);
    }
  };

  const DesktopIcon = ({ slot, label, icon: Icon, delay = "0s", pos }: { slot: keyof DesktopAssignments, label: string, icon: any, delay?: string, pos: string }) => (
    <div 
        className={`absolute flex flex-col items-center gap-2 w-24 p-3 hover:bg-white/10 rounded-sm cursor-pointer border-2 border-transparent hover:border-white/20 transition-all hover:translate-x-1 active:scale-95 z-10 ${pos}`}
        onContextMenu={e => { e.preventDefault(); setActiveSlot(slot); setActiveModal('config'); }}
        onClick={() => slot.includes('recycle') && setIsRecycleFull(!isRecycleFull)}
    >
        <div className="w-14 h-14 flex items-center justify-center animate-mosh-float" style={{ animationDelay: delay }}>
            {slot === 'recycleBinEmpty' && isRecycleFull ? getUrl(assignments.recycleBinFull, <Trash2 className="text-indigo-300" size={40} />) : getUrl(assignments[slot], <Icon className="text-white opacity-80" size={40} />)}
        </div>
        <span className="text-[9px] text-white font-black drop-shadow-[2px_2px_1px_rgba(0,0,0,1)] uppercase tracking-tight text-center leading-tight">
            {label}
            {slot.includes('recycle') && <><br/><span className="text-[7px] opacity-60 italic">{isRecycleFull ? '[FULL]' : '[EMPTY]'}</span></>}
        </span>
    </div>
  );

  const ConfigModal = () => {
    const [search, setSearch] = useState('');
    const filtered = files.filter(f => f.newName.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-lg p-6 font-mono">
        <div className="w-full max-w-4xl bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-8 shadow-2xl flex flex-col gap-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between bg-[#8b8b8b] p-4 border-4 border-white/20">
                <h3 className="text-lg text-white font-bold uppercase flex items-center gap-4"><Settings size={24}/> Forge Slot: {activeSlot?.toUpperCase()}</h3>
                <button onClick={() => setActiveModal(null)} className="text-white hover:text-red-500"><X size={32} /></button>
            </div>
            
            <div className="flex gap-8 flex-1">
                <div className="w-64 bg-black/20 p-6 border-4 border-black/40 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-white/40 uppercase font-black mb-4">Current Asset</p>
                    <div className="w-24 h-24 bg-white/5 border-2 border-white/10 flex items-center justify-center mb-6">
                        {getUrl(assignments[activeSlot!], <Wand2 size={40} className="opacity-10"/>)}
                    </div>
                    <button onClick={() => onAssign(activeSlot!, "")} className="w-full py-2 bg-red-900 border-2 border-white text-[9px] font-black uppercase text-white hover:bg-red-800">Clear Slot</button>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="relative">
                        <input type="text" placeholder="FILTER LOOT CHEST..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-[#333] border-4 border-[#555] p-4 text-xs text-white uppercase outline-none" />
                        <Search className="absolute right-4 top-4 text-white/30" size={18} />
                    </div>
                    <div className="flex-1 bg-black/40 border-4 border-black p-4 grid grid-cols-4 gap-3 overflow-y-auto custom-scrollbar h-[400px]">
                        {filtered.map(f => (
                            <div key={f.id} onClick={() => { onAssign(activeSlot!, f.id); setActiveModal(null); }} className="aspect-square bg-[#8b8b8b] border-2 border-white/10 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all">
                                <img src={f.previewUrl} className="w-full h-full object-contain pixelated" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-video bg-[#222] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] rounded-sm overflow-hidden shadow-2xl group/desktop">
      <div className="absolute inset-0 transition-all duration-1000" style={{ 
          background: currentPerson ? `linear-gradient(135deg, ${currentPerson.wallpaperColors[0] || '#1a1a1a'} 0%, ${currentPerson.wallpaperColors[1] || '#4d2a7c'} 100%)` : 'linear-gradient(135deg, #1d1d1d 0%, #4d2a7c 100%)',
          opacity: 0.6
      }} />
      
      {/* Dynamic Grid Layout for Icons */}
      <div className="absolute inset-0 p-8">
        <DesktopIcon slot="myPc" label="My Terminal" icon={HardDrive} pos="top-6 left-6" />
        <DesktopIcon slot="recycleBinEmpty" label="Recycle Slot" icon={Trash2} pos="top-36 left-6" delay="0.2s" />
        <DesktopIcon slot="controlPanel" label="Control Pad" icon={Briefcase} pos="top-6 left-32" delay="0.4s" />
        <DesktopIcon slot="network" label="Grid Access" icon={Network} pos="top-36 left-32" delay="0.6s" />
        <DesktopIcon slot="account" label="Avatar" icon={UserCircle} pos="top-6 left-56" delay="0.8s" />
        <DesktopIcon slot="folder" label="Stash Box" icon={Folder} pos="top-36 left-56" delay="1s" />
        
        {/* Extra Slots */}
        <DesktopIcon slot="extra1" label="Loot A" icon={Box} pos="top-6 left-80" delay="1.2s" />
        <DesktopIcon slot="extra2" label="Loot B" icon={Box} pos="top-36 left-80" delay="1.4s" />
        <DesktopIcon slot="extra3" label="Loot C" icon={Box} pos="top-6 left-[416px]" delay="1.6s" />
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/60 backdrop-blur-3xl flex items-center justify-center px-6 border-t-4 border-white/5 z-20">
        <div 
            className={`flex items-center justify-center w-11 h-11 border-4 transition-all cursor-pointer ${startState === 'click' ? 'bg-white/40 border-white/60 scale-90' : 'bg-white/10 border-transparent hover:bg-indigo-600/40 hover:border-indigo-400'}`} 
            onMouseEnter={()=>setStartState('hover')} 
            onMouseLeave={()=>setStartState('normal')} 
            onMouseDown={()=>setStartState('click')} 
            onMouseUp={()=>setStartState('hover')} 
            onContextMenu={e=>{e.preventDefault(); setActiveSlot('startButtonNormal'); setActiveModal('config');}}
        >
          {getUrl(assignments.startButtonNormal, <LayoutGrid className="text-white" size={24} />)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-6 right-6 z-30 flex gap-4">
          <button onClick={() => setActiveModal('visit')} className="bg-indigo-600 border-4 border-white px-5 py-2.5 text-[11px] font-black uppercase flex items-center gap-3 hover:bg-indigo-500 shadow-xl active:scale-95 transition-all">
              <Globe size={18}/> Visit Someone's PC
          </button>
          {currentPerson && (
              <button onClick={() => { setCurrentPerson(null); setSearchPerson(''); }} className="bg-red-800 border-4 border-white px-5 py-2.5 text-[11px] font-black uppercase flex items-center gap-3 hover:bg-red-700 shadow-xl active:scale-95 transition-all">
                  <RefreshCw size={18}/> Reset
              </button>
          )}
      </div>

      {/* Profile Bio Card */}
      {currentPerson && (
        <div className="absolute bottom-20 right-8 w-80 bg-black/90 border-4 border-indigo-400 p-6 animate-in slide-in-from-right-12 z-40 shadow-[20px_20px_0_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-600 p-2 border-2 border-white"><User size={24}/></div>
                <button onClick={()=>setCurrentPerson(null)} className="text-white/40 hover:text-white"><X size={20}/></button>
            </div>
            <h4 className="text-lg font-black uppercase text-white tracking-tighter drop-shadow-sm">{currentPerson.name}</h4>
            <div className="h-1 w-12 bg-indigo-500 my-2" />
            <p className="text-[10px] text-indigo-300 font-bold uppercase mb-4 leading-tight">{currentPerson.knownFor}</p>
            <div className="bg-white/5 p-4 border-l-4 border-indigo-400 italic">
                <p className="text-[11px] text-white/80 leading-relaxed uppercase font-black">Vibe: {currentPerson.vibe}</p>
            </div>
        </div>
      )}

      {/* Visit Modal */}
      {activeModal === 'visit' && (
          <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
              <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-12 w-full max-w-lg shadow-2xl font-mono relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12 scale-[3]"><Globe size={100}/></div>
                  <div className="flex items-center gap-5 mb-10 relative">
                      <div className="p-4 bg-indigo-900 border-4 border-white shadow-lg"><Globe size={40} className="text-white"/></div>
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Teleportation Hub</h2>
                        <p className="text-[9px] font-bold text-[#555] uppercase mt-1 tracking-widest">Connect to a distant terminal</p>
                      </div>
                  </div>
                  <div className="space-y-8 relative">
                      <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-[#333]">Enter First & Last Name:</label>
                          <div className="relative">
                            <input 
                                type="text" 
                                value={searchPerson} 
                                onChange={e=>setSearchPerson(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleVisit()}
                                placeholder="e.g. Satoshi Nakamoto" 
                                className="w-full bg-[#333] border-4 border-indigo-400 p-5 text-white uppercase font-black outline-none placeholder:text-white/20 focus:bg-black transition-all" 
                            />
                            {isVisiting && <Loader2 className="absolute right-5 top-5 animate-spin text-indigo-400" size={24}/>}
                          </div>
                          <p className="text-[8px] text-[#8b8b8b] uppercase font-bold italic">* Leave blank to summon an inspire me preset</p>
                      </div>
                      <div className="flex gap-4">
                          <button onClick={handleVisit} disabled={isVisiting} className="flex-1 py-5 bg-indigo-600 border-4 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 text-white font-black uppercase text-lg shadow-2xl hover:bg-indigo-500 disabled:opacity-50 active:scale-95 transition-all">Initiate Warp</button>
                          <button onClick={()=>setActiveModal(null)} className="px-10 py-5 bg-[#555] border-4 border-black text-white font-black uppercase hover:bg-red-800 transition-colors">Abort</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeModal === 'config' && <ConfigModal />}
    </div>
  );
};
