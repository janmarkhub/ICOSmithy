
import React, { useCallback, useState } from 'react';
import { FileType, FolderUp, ImageIcon, UploadCloud } from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => 
      ['.ico', '.png', '.jpg', '.jpeg', '.bmp', '.webp'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (files.length > 0) onFilesSelected(files);
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (Array.from(e.target.files || []) as File[]).filter(f => 
      ['.ico', '.png', '.jpg', '.jpeg', '.bmp', '.webp'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (files.length > 0) onFilesSelected(files);
  };

  return (
    <RetroTooltip title="Import Portal" description="Drag ICO files or image folders here for batch processing." position="top">
      <div
        onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        className={`relative w-full border-4 border-dashed transition-all duration-300 p-10 flex flex-col items-center justify-center cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
          }`}
      >
        <input 
          type="file" 
          multiple 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={handleFileInput} 
          accept=".ico,.png,.jpg,.jpeg,.bmp,.webp" 
        />
        <div className={`p-5 rounded-full mb-4 transition-all duration-300 ${isDragging ? 'scale-110 bg-indigo-600 text-white' : 'bg-white/10 text-white/40'}`}>
          <UploadCloud size={48} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-white uppercase tracking-tight">Drop Assets Here</p>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">ICO, PNG, JPG, BMP Supported</p>
          
          <div className="flex gap-4 justify-center pt-4 text-[8px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
            <span className="flex items-center gap-1.5"><FileType size={12}/> AUTO-EXTRACT</span>
            <span className="flex items-center gap-1.5"><FolderUp size={12}/> BULK LOADER</span>
          </div>
        </div>
      </div>
    </RetroTooltip>
  );
};
