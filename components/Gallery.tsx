
import React from 'react';
import { ProcessedFile } from '../types';
import { CheckCircle2, AlertCircle, Loader2, Maximize2, Split } from 'lucide-react';

interface GalleryProps {
  files: ProcessedFile[];
  comparisonMode?: boolean;
  sources?: Map<string, any>;
}

export const Gallery: React.FC<GalleryProps> = ({ files, comparisonMode, sources }) => {
  if (files.length === 0) return null;

  return (
    <div className={`grid gap-4 mt-8 ${comparisonMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
      {files.map((file) => (
        <div 
          key={file.id} 
          className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col">
            <div className={`relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100`}>
              {file.status === 'processing' ? (
                <Loader2 size={24} className="text-indigo-500 animate-spin" />
              ) : file.status === 'error' ? (
                <AlertCircle size={32} className="text-red-400" />
              ) : (
                <>
                  {comparisonMode && sources?.has(file.id) && (
                    <div className="absolute inset-0 z-10 flex border-r border-indigo-500/30">
                        <div className="w-1/2 h-full border-r border-white relative overflow-hidden bg-slate-200">
                             <img 
                                src={sources.get(file.id).rawUrl} 
                                className="w-full h-full object-contain p-2 grayscale opacity-50"
                                style={{ imageRendering: 'pixelated' }}
                                alt="original"
                            />
                            <span className="absolute bottom-1 left-1 bg-black/60 text-[8px] text-white px-1 uppercase rounded">Original</span>
                        </div>
                        <div className="w-1/2 h-full relative overflow-hidden bg-white">
                             <img 
                                src={file.previewUrl} 
                                className="w-full h-full object-contain p-2"
                                alt="processed"
                            />
                            <span className="absolute bottom-1 right-1 bg-indigo-600 text-[8px] text-white px-1 uppercase rounded">Pro</span>
                        </div>
                    </div>
                  )}
                  {!comparisonMode && (
                      <img 
                        src={file.previewUrl} 
                        alt={file.newName} 
                        className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                  )}
                </>
              )}
            </div>
            
            <div className="p-3 bg-white">
                <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-700 truncate block flex-1">
                    {file.newName}
                </span>
                {file.status === 'completed' && (
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                )}
                </div>
                <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 uppercase font-mono">
                    {file.width}px ICO
                </span>
                <div className="flex gap-1">
                    <a 
                        href={file.previewUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-slate-400 hover:text-indigo-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View Full"
                    >
                        <Maximize2 size={12} />
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
