
import React from 'react';
import { Resolution } from '../types';
import { Download, Loader2, RotateCcw } from 'lucide-react';

interface ControlsProps {
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  onDownload: () => void;
  onReset: () => void;
  isProcessing: boolean;
  canDownload: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  resolution,
  setResolution,
  onDownload,
  onReset,
  isProcessing,
  canDownload
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm mb-6">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <label htmlFor="resolution" className="text-sm font-medium text-slate-700 whitespace-nowrap">
          Target Size:
        </label>
        <select
          id="resolution"
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none transition-colors"
          disabled={isProcessing}
        >
          <option value={Resolution.SD}>256 x 256</option>
          <option value={Resolution.HD}>512 x 512</option>
          <option value={Resolution.FHD}>1024 x 1024 (HD)</option>
          <option value={Resolution.UHD}>2048 x 2048 (4K)</option>
        </select>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <button
          onClick={onReset}
          disabled={isProcessing || !canDownload}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
        >
          <RotateCcw size={18} />
          Clear
        </button>
        
        <button
          onClick={onDownload}
          disabled={isProcessing || !canDownload}
          className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-indigo-100 transition-all"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download size={18} />
              Download ZIP
            </>
          )}
        </button>
      </div>
    </div>
  );
};
