import React, { useCallback, useState } from 'react';
import { Upload, FileType, FolderUp } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Explicitly cast to File[] to resolve 'unknown' type issues when accessing 'name'
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.name.toLowerCase().endsWith('.ico'));
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Explicitly cast to File[] to resolve 'unknown' type issues when accessing 'name'
    const files = (Array.from(e.target.files || []) as File[]).filter(f => f.name.toLowerCase().endsWith('.ico'));
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative group border-2 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
        }`}
    >
      <input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileInput}
        accept=".ico"
      />
      
      <div className={`p-4 rounded-full mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-105'} bg-indigo-100 text-indigo-600`}>
        <Upload size={32} />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-800 mb-1">
          Drag & drop ICO files here
        </p>
        <p className="text-sm text-slate-500 mb-4">
          or click to browse your computer
        </p>
        
        <div className="flex gap-4 justify-center text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <FileType size={14} /> Batch Processing
          </span>
          <span className="flex items-center gap-1">
            <FolderUp size={14} /> Folder Support
          </span>
        </div>
      </div>
    </div>
  );
};
