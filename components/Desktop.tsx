
import React, { useState } from 'react';
import { 
  Monitor, Trash2, LayoutGrid, Settings, X, HardDrive, Network, Folder, Box 
} from 'lucide-react';
import { ProcessedFile, DesktopAssignments } from '../types';

interface DesktopProps {
  files: ProcessedFile[];
  assignments: DesktopAssignments;
  onAssign: (slot: keyof DesktopAssignments, fileId: string) => void;
  onTeleport: (name: string) => Promise<void>;
  currentPerson: any;
  isProcessing: boolean;
}

export const Desktop: React.FC<DesktopProps> = ({ files, assignments, onAssign }) => {
  const [activeModal, setActiveModal] = useState<'config' | null>(null);
  const [activeSlot, setActiveSlot] = useState<keyof DesktopAssignments | null>(null);

  const getIcon = (fileId?: string, FallbackIcon?: any) => {
    const file = files.find(f => f.id === fileId);
    return file ? <img src={file.previewUrl} className="w-12 h-12 object-contain pixelated drop-shadow-lg" /> : <FallbackIcon className="text-white/70" size={32} />;
  };

  const DesktopIcon = ({ slot, label, icon: Icon, pos }: { slot: keyof DesktopAssignments, label: string, icon: any, pos: string }) => (
    <div 
        className={`absolute flex flex-col items-center gap-1 w-20 p-2 hover:bg-white/10 border border-transparent hover:border-white/20 transition-all cursor-pointer group ${pos}`}
        onContextMenu={e => { e.preventDefault(); setActiveSlot(slot); setActiveModal('config'); }}
        onClick={() => { setActiveSlot(slot); setActiveModal('config'); }}
    >
        <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
            {getIcon(assignments[slot], Icon)}
        </div>
        <span className="text-[7px] text-white font-black drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)] uppercase text-center leading-tight">
            {label}
        </span>
    </div>
  );

  return (
    <div className="relative w-full aspect-video retro-panel overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-950 to-black">
      {/* Grid of Icons */}
      <div className="absolute inset-0 p-8">
        <DesktopIcon slot="myPc" label="THIS PC" icon={HardDrive} pos="top-4 left-4" />
        <DesktopIcon slot="recycleBinEmpty" label="TRASH (E)" icon={Trash2} pos="top-28 left-4" />
        <DesktopIcon slot="recycleBinFull" label="TRASH (F)" icon={Trash2} pos="top-52 left-4" />
        
        <DesktopIcon slot="network" label="NETWORK" icon={Network} pos="top-4 left-28" />
        <DesktopIcon slot="folder" label="STASH" icon={Folder} pos="top-28 left-28" />
        <DesktopIcon slot="settings" label="SMITHY" icon={Settings} pos="top-4 left-52" />
        
        <DesktopIcon slot="extra1" label="ASSET_PRO" icon={Box} pos="top-28 left-52" />
      </div>

      {/* Win 11 Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/10 backdrop-blur-md border-t border-white/10 flex items-center justify-center px-4 z-20">
        <div className="flex items-center gap-1 bg-black/20 p-1 px-4 rounded-xl border border-white/5 shadow-2xl">
            <button className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition-colors">
              <LayoutGrid size={20}/>
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            {assignments.folder && <div className="p-2 opacity-80">{getIcon(assignments.folder, Folder)}</div>}
            {assignments.network && <div className="p-2 opacity-80">{getIcon(assignments.network, Network)}</div>}
            {assignments.settings && <div className="p-2 opacity-80">{getIcon(assignments.settings, Settings)}</div>}
        </div>
      </div>

      {/* Context info */}
      <div className="absolute top-4 right-4 text-[8px] font-black text-white/40 uppercase tracking-widest">
        Visualization Matrix: Win 11 Preview
      </div>

      {/* Slot Config Modal */}
      {activeModal === 'config' && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="retro-panel p-6 w-full max-w-2xl max-h-[80%] flex flex-col gap-4">
                <div className="flex justify-between items-center border-b-2 border-black/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-tighter italic">Map Slot: {activeSlot}</h3>
                    <X size={20} className="cursor-pointer hover:text-red-600" onClick={()=>setActiveModal(null)}/>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto custom-scrollbar p-3 retro-inset bg-white">
                    {files.map(f => (
                        <div key={f.id} onClick={() => { onAssign(activeSlot!, f.id); setActiveModal(null); }} className="aspect-square bg-slate-100 hover:bg-indigo-100 border border-black/10 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-sm">
                            <img src={f.previewUrl} className="w-14 h-14 object-contain pixelated" />
                        </div>
                    ))}
                    {files.length === 0 && <p className="col-span-full text-center py-20 opacity-30 text-[10px] uppercase font-black">NO_ASSETS_IN_SMITHY</p>}
                </div>
                <div className="flex justify-end pt-2">
                    <button onClick={()=>setActiveModal(null)} className="win-btn bg-indigo-600 text-white px-8">DISMISS</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
