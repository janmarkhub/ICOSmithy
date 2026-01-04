
import React from 'react';
import { ProcessedFile } from '../types';
import { CheckCircle2, AlertCircle, Loader2, Maximize2 } from 'lucide-react';

interface GalleryProps {
  files: ProcessedFile[];
  comparisonMode?: boolean;
  sources?: Map<string, any>;
}

export const Gallery: React.FC<GalleryProps> = ({ files, comparisonMode, sources }) => {
  if (files.length === 0) return null;

  return (
    <div className={`grid gap-4 mt-8 ${comparisonMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
      {files.map((file) => (
        <div 
          key={file.id} 
          draggable
          onDragStart={e => e.dataTransfer.setData('fileId', file.id)}
          className="group relative bg-[#c6c6c6] border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] rounded-sm overflow-hidden shadow-sm hover:shadow-lg transition-all"
        >
          <div className="flex flex-col">
            <div className={`relative aspect-square bg-[#8b8b8b] flex items-center justify-center overflow-hidden border-b-4 border-[#555555]`}>
              {file.status === 'processing' ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : file.status === 'error' ? (
                <AlertCircle size={32} className="text-red-400" />
              ) : (
                <>
                  {comparisonMode && sources?.has(file.id) && (
                    <div className="absolute inset-0 z-10 flex">
                        <div className="w-1/2 h-full border-r-2 border-white/20 relative overflow-hidden bg-[#333]">
                             <img 
                                src={sources.get(file.id).rawUrl} 
                                className="w-full h-full object-contain p-2 grayscale opacity-40 pixelated"
                                alt="original"
                            />
                            <span className="absolute bottom-1 left-1 bg-black/60 text-[6px] text-white px-1 uppercase rounded">Old</span>
                        </div>
                        <div className="w-1/2 h-full relative overflow-hidden bg-[#8b8b8b]">
                             <img 
                                src={file.previewUrl} 
                                className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110"
                                alt="processed"
                            />
                            <span className="absolute bottom-1 right-1 bg-indigo-600 text-[6px] text-white px-1 uppercase rounded">New</span>
                        </div>
                    </div>
                  )}
                  {!comparisonMode && (
                      <img 
                        src={file.previewUrl} 
                        alt={file.newName} 
                        className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                      />
                  )}
                </>
              )}
            </div>
            
            <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[8px] font-bold text-[#333] truncate block flex-1 uppercase tracking-tighter">
                      {file.newName}
                  </span>
                  {file.status === 'completed' && (
                      <CheckCircle2 size={10} className="text-green-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[7px] text-[#555] uppercase font-bold tracking-widest">
                      {file.width}PX {file.fidelityScore > 70 ? "HD" : "SD"}
                  </span>
                  <div className="flex gap-1">
                      <a 
                          href={file.previewUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#555] hover:text-indigo-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View Full"
                      >
                          <Maximize2 size={10} />
                      </a>
                  </div>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
