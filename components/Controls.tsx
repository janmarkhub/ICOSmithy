
import React from 'react';
import { Resolution, ExportFormat } from '../types';
import { Download, Loader2, RotateCcw } from 'lucide-react';

interface ControlsProps {
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  exportFormat: ExportFormat;
  setExportFormat: (fmt: ExportFormat) => void;
  onDownload: () => void;
  onReset: () => void;
  isProcessing: boolean;
  canDownload: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  resolution,
  setResolution,
  exportFormat,
  setExportFormat,
  onDownload,
  onReset,
  isProcessing,
  canDownload
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#c6c6c6] border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] rounded-sm shadow-sm mb-6 font-mono">
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[9px] font-bold text-[#555] uppercase tracking-widest px-1">Quality</label>
        <select
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          className="bg-[#8b8b8b] border-2 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff] text-white text-[10px] uppercase font-bold p-2 outline-none"
          disabled={isProcessing}
        >
          <option value={Resolution.SD}>256x256</option>
          <option value={Resolution.HD}>512x512</option>
          <option value={Resolution.FHD}>1024x1024</option>
          <option value={Resolution.UHD}>2048x2048</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[9px] font-bold text-[#555] uppercase tracking-widest px-1">Type</label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          className="bg-[#8b8b8b] border-2 border-t-[#555555] border-l-[#555555] border-r-[#ffffff] border-b-[#ffffff] text-white text-[10px] uppercase font-bold p-2 outline-none"
          disabled={isProcessing}
        >
          <option value={ExportFormat.ICO}>ICO Icon</option>
          <option value={ExportFormat.PNG}>PNG Image</option>
          <option value={ExportFormat.BMP}>BMP Bitmap</option>
        </select>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto self-end">
        <button
          onClick={onReset}
          disabled={isProcessing || !canDownload}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold text-white bg-[#555555] border-2 border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#000] border-b-[#000] hover:bg-[#666] disabled:opacity-50 uppercase"
        >
          <RotateCcw size={12} /> Wipe
        </button>
        
        <button
          onClick={onDownload}
          disabled={isProcessing || !canDownload}
          className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-[10px] font-bold text-white bg-indigo-600 border-2 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 hover:bg-indigo-500 disabled:bg-slate-500 disabled:border-slate-600 shadow-md transition-all uppercase"
        >
          {isProcessing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Download size={14} /> Export Collection
            </>
          )}
        </button>
      </div>
    </div>
  );
};
