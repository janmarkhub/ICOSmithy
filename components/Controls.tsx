
import React from 'react';
import { Resolution, ExportFormat } from '../types';
import { Download, Loader2, RotateCcw } from 'lucide-react';
import { RetroTooltip } from './RetroTooltip';

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
    <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-[#c6c6c6] border-2 border-black shadow-[4px_4px_0_#000,inset_2px_2px_0_#fff] mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
        <RetroTooltip title="Output Size" description="Canvas dimensions for export. FHD (1024) is standard for Win11." position="bottom">
          <div className="flex flex-col gap-1 w-full sm:w-56">
            <label className="text-[9px] font-bold text-[#333] uppercase tracking-widest px-1">QUALITY</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
              className="bg-[#eee] border border-black text-black text-[10px] uppercase font-bold p-2 outline-none w-full shadow-sm"
              disabled={isProcessing}
            >
              <option value={Resolution.SD}>256x256 (SD)</option>
              <option value={Resolution.HD}>512x512 (HD)</option>
              <option value={Resolution.FHD}>1024x1024 (FHD)</option>
              <option value={Resolution.UHD}>2048x2048 (UHD)</option>
            </select>
          </div>
        </RetroTooltip>

        <RetroTooltip title="File Format" description="ICO for Windows. PNG for Web. BMP for chunky legacy." position="bottom">
          <div className="flex flex-col gap-1 w-full sm:w-56">
            <label className="text-[9px] font-bold text-[#333] uppercase tracking-widest px-1">FORMAT</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="bg-[#eee] border border-black text-black text-[10px] uppercase font-bold p-2 outline-none w-full shadow-sm"
              disabled={isProcessing}
            >
              <option value={ExportFormat.ICO}>ICO Container</option>
              <option value={ExportFormat.PNG}>PNG Image</option>
              <option value={ExportFormat.BMP}>BMP Bitmap</option>
            </select>
          </div>
        </RetroTooltip>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto md:self-end pt-4 md:pt-0">
        <RetroTooltip title="Reset" description="Permanently wipes the session stashed assets.">
          <button
            onClick={onReset}
            disabled={isProcessing || !canDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-bold text-white bg-[#555] border-2 border-black shadow-[2px_2px_0_#000,inset_1px_1px_0_#888] hover:bg-[#666] disabled:opacity-50 uppercase"
          >
            <RotateCcw size={14} /> WIPE
          </button>
        </RetroTooltip>
        
        <RetroTooltip title="Export" description="Bundles your inventory into a single ZIP." position="left">
          <button
            onClick={onDownload}
            disabled={isProcessing || !canDownload}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 text-[10px] font-bold text-white bg-indigo-600 border-2 border-black shadow-[2px_2px_0_#000,inset_1px_1px_0_#818cf8] hover:bg-indigo-500 disabled:bg-slate-500 disabled:shadow-none uppercase transition-all"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Download size={16} /> EXPORT ALL
              </>
            )}
          </button>
        </RetroTooltip>
      </div>
    </div>
  );
};
