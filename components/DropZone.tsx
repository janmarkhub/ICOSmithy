
import React, { useCallback, useState } from 'react';
import { Upload, FileType, FolderUp, ImageIcon } from 'lucide-react';

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
    // Cast Array.from result to File[] to ensure the filter callback can access 'name' property
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => 
      ['.ico', '.png', '.jpg', '.jpeg', '.bmp', '.webp'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (files.length > 0) onFilesSelected(files);
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cast Array.from result to File[] to ensure the filter callback can access 'name' property
    const files = (Array.from(e.target.files || []) as File[]).filter(f => 
      ['.ico', '.png', '.jpg', '.jpeg', '.bmp', '.webp'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (files.length > 0) onFilesSelected(files);
  };

  return (
    <div
      onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
      className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-2xl' 
          : 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
        }`}
    >
      <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileInput} accept=".ico,.png,.jpg,.jpeg,.bmp,.webp" />
      <div className={`p-6 rounded-full mb-6 transition-all duration-500 ${isDragging ? 'scale-125 bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-400 group-hover:scale-110'}`}>
        <ImageIcon size={40} />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold mb-2 tracking-tight">Drop any image or icon</p>
        <p className="text-sm text-slate-500 mb-6 uppercase tracking-widest font-mono">JPG, PNG, WEBP, BMP, ICO SUPPORTED</p>
        <div className="flex gap-6 justify-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><FileType size={14}/> Auto-Normalize</span>
          <span className="flex items-center gap-1.5"><FolderUp size={14}/> Batch Studio</span>
        </div>
      </div>
    </div>
  );
};
