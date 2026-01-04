
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { EffectsPanel } from './components/EffectsPanel';
import { StickerClipboard } from './components/StickerClipboard';
import { Desktop } from './components/Desktop';
import { Cauldron } from './components/Cauldron';
import { FloatingHelp } from './components/FloatingHelp';
import { ControlMatrix } from './components/ControlMatrix';
import { PaletteForge } from './components/PaletteForge';
import { RetroTooltip } from './components/RetroTooltip';
import { ProcessedFile, Resolution, ExportFormat, BatchEffects, DesktopAssignments, GeneratedPackItem } from './types';
import { parseIcoAndGetLargestImage } from './utils/icoParser';
import { upscaleAndEditImage, DEFAULT_EFFECTS, calculateFidelity, removeBgAndCenter } from './utils/imageProcessor';
import { wrapPngInIco } from './utils/icoEncoder';
import { generateIconImage } from './utils/aiVision';
import { Hammer, Wand2, Monitor, AlertTriangle, Coffee, Sun, Moon, Sparkles, LayoutGrid } from 'lucide-react';

declare var JSZip: any;
declare var saveAs: any;

interface FileSource {
  id: string;
  image: HTMLImageElement;
  rawUrl: string; 
  cropBox?: [number, number, number, number];
  fidelity: number;
  prompt?: string;
  label?: string;
}

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mode, setMode] = useState<'upscale' | 'test' | 'cauldron'>('upscale');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [resolution, setResolution] = useState<Resolution>(Resolution.FHD);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.ICO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [effects, setEffects] = useState<BatchEffects>(DEFAULT_EFFECTS);
  const [showComparison, setShowComparison] = useState(false);
  const [desktopAssignments, setDesktopAssignments] = useState<DesktopAssignments>({});
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ msg: string, fix: string } | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const sourceCache = useRef<Map<string, FileSource>>(new Map());

  const applyEffectsToFiles = useCallback(async () => {
    if (files.length === 0) return;
    const updatedFiles = await Promise.all(files.map(async (file) => {
      const source = sourceCache.current.get(file.id);
      if (!source) return file;
      try {
        const editedPngBlob = await upscaleAndEditImage(source.image, resolution, effects, source.cropBox, source.fidelity);
        let finalBlob = editedPngBlob;
        if (exportFormat === ExportFormat.ICO) finalBlob = await wrapPngInIco(editedPngBlob);
        const newName = file.originalName.replace(/\.[^/.]+$/, "") + `.${exportFormat}`;
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        return { ...file, blob: finalBlob, newName, previewUrl: URL.createObjectURL(editedPngBlob), status: 'completed' as const };
      } catch (err) { return file; }
    }));
    setFiles(updatedFiles);
    triggerGratification('LOOT REFORGED');
  }, [effects, resolution, exportFormat, files.length]);

  const triggerGratification = (action: string) => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(applyEffectsToFiles, 300);
    return () => clearTimeout(timer);
  }, [effects, resolution, exportFormat, files.length]);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setIsProcessing(true);
    const newFiles = [];
    for (const file of selectedFiles) {
      const id = crypto.randomUUID();
      try {
        let rawBlob: Blob;
        if (file.name.toLowerCase().endsWith('.ico')) {
          rawBlob = await parseIcoAndGetLargestImage(file);
        } else {
          rawBlob = file;
        }
        const rawUrl = URL.createObjectURL(rawBlob);
        const tempImg = new Image();
        await new Promise(res => { tempImg.onload = res; tempImg.src = rawUrl; });
        const fidelity = calculateFidelity(tempImg);
        sourceCache.current.set(id, { id, image: tempImg, rawUrl, fidelity });
        const initialPng = await upscaleAndEditImage(tempImg, resolution, effects, undefined, fidelity);
        newFiles.push({
          id, originalName: file.name, newName: file.name.replace(/\.[^/.]+$/, "") + "." + exportFormat,
          blob: initialPng, previewUrl: URL.createObjectURL(initialPng), status: 'completed' as const, width: resolution, height: resolution,
          originalType: file.type, fidelityScore: fidelity
        });
      } catch (e) { 
        setErrorInfo({ msg: `Failed to process image: ${file.name}`, fix: "Try a standard PNG or JPG file." });
      }
    }
    setFiles(prev => [...newFiles, ...prev]);
    setIsProcessing(false);
    triggerGratification(`FOUND ${newFiles.length} NEW ITEMS`);
  }, [resolution, effects, exportFormat]);

  const handleImportPackToSmithy = useCallback(async (pack: GeneratedPackItem[]) => {
    setIsProcessing(true);
    const newFiles = [];
    for (const item of pack) {
      const id = crypto.randomUUID();
      if (!item.blob) continue;
      
      const tempImg = new Image();
      const url = URL.createObjectURL(item.blob);
      await new Promise(res => { tempImg.onload = res; tempImg.src = url; });
      
      const fidelity = 100; 
      sourceCache.current.set(id, { id, image: tempImg, rawUrl: url, fidelity, prompt: item.prompt, label: item.label });
      
      const initialPng = await upscaleAndEditImage(tempImg, resolution, effects, undefined, fidelity);
      newFiles.push({
        id, originalName: `${item.label}.png`, newName: `${item.label}.${exportFormat}`,
        blob: initialPng, previewUrl: URL.createObjectURL(initialPng), status: 'completed' as const, width: resolution, height: resolution,
        originalType: 'image/png', fidelityScore: fidelity, isAiGenerated: true
      });
    }
    setFiles(prev => [...newFiles, ...prev]);
    setIsProcessing(false);
    setMode('upscale');
    triggerGratification('PACK SMELTED SUCCESS');
  }, [resolution, effects, exportFormat]);

  const handleToggleSelect = (id: string, isShift: boolean) => {
    if (isShift && lastSelectedId) {
      const allIds = files.map(f => f.id);
      const start = allIds.indexOf(lastSelectedId);
      const end = allIds.indexOf(id);
      const range = allIds.slice(Math.min(start, end), Math.max(start, end) + 1);
      setSelectedIds(prev => Array.from(new Set([...prev, ...range])));
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      setLastSelectedId(id);
    }
  };

  const handleBulkAction = async (action: string, payload?: any) => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    const originalCount = selectedIds.length;
    
    try {
      if (action === 'delete') {
        setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
        triggerGratification(`${originalCount} ITEMS DELETED`);
      } 
      else if (action === 'make-transparent' || action === 'center-icon') {
        const updatedFiles = [...files];
        for (const id of selectedIds) {
            const idx = updatedFiles.findIndex(f => f.id === id);
            const src = sourceCache.current.get(id);
            if (idx === -1 || !src) continue;
            
            const cleanBlob = await removeBgAndCenter(src.image);
            const cleanUrl = URL.createObjectURL(cleanBlob);
            const cleanImg = new Image();
            await new Promise(res => { cleanImg.onload = res; cleanImg.src = cleanUrl; });
            
            sourceCache.current.set(id, { ...src, image: cleanImg, rawUrl: cleanUrl });
            updatedFiles[idx] = { ...updatedFiles[idx], previewUrl: cleanUrl, blob: cleanBlob };
        }
        setFiles(updatedFiles);
        triggerGratification(action === 'make-transparent' ? 'ALPHA SCRUBBED' : 'ALIGNMENT FIXED');
      }
      else if (action === 'reroll' || action === 'change-style' || action === 'guide-prompt') {
        const updatedFiles = [...files];
        for (const id of selectedIds) {
          const fileIdx = updatedFiles.findIndex(f => f.id === id);
          const source = sourceCache.current.get(id);
          if (fileIdx === -1 || !source || !source.prompt) continue;

          updatedFiles[fileIdx] = { ...updatedFiles[fileIdx], status: 'processing' };
          setFiles([...updatedFiles]);

          let finalPrompt = source.prompt;
          if (action === 'change-style') finalPrompt = `Icon: ${source.label}. Style: ${payload}. Clean professional icon.`;
          else if (action === 'guide-prompt') finalPrompt = `Icon: ${payload}. ${source.label} theme. High detail.`;

          const newDataUrl = await generateIconImage(finalPrompt);
          const tempImg = new Image();
          await new Promise(r => { tempImg.onload = r; tempImg.src = newDataUrl; });
          
          const cleanBlob = await removeBgAndCenter(tempImg);
          const cleanUrl = URL.createObjectURL(cleanBlob);
          const cleanImg = new Image();
          await new Promise(r => { cleanImg.onload = r; cleanImg.src = cleanUrl; });

          sourceCache.current.set(id, { ...source, image: cleanImg, rawUrl: cleanUrl });
          updatedFiles[fileIdx] = {
            ...updatedFiles[fileIdx], blob: cleanBlob, previewUrl: cleanUrl, status: 'completed'
          };
          setFiles([...updatedFiles]);
        }
        triggerGratification('AI BLESSING APPLIED');
      }
    } catch (e) {
      setErrorInfo({ msg: "Forge Operation Failed", fix: "Try again or check API limits." });
    } finally {
      setSelectedIds([]);
      setIsProcessing(false);
    }
  };

  const handleApplyPalette = (colors: string[]) => {
    setEffects(prev => ({ 
        ...prev, duotone: true, duotoneColor1: colors[0], duotoneColor2: colors[1],
        glowColor: colors[2], outlineColor: colors[3]
    }));
    triggerGratification('PALETTE SYNCHRONIZED');
    setSelectedIds([]);
  };

  const handleDownloadZip = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      files.forEach((file) => {
        if (file.blob) zip.file(file.newName, file.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'smithy-stash.zip');
      triggerGratification('STASH EXPORTED');
    } catch (err) {
      setErrorInfo({ msg: "Export Error", fix: "Batch might be too large. Try fewer files." });
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  return (
    <div className={`min-h-screen transition-all duration-500 flex flex-col items-center ${isDarkMode ? 'bg-[#121212] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Gratification Overlay */}
      {lastAction && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] bg-yellow-400 border-2 border-black px-10 py-4 shadow-[8px_8px_0_rgba(0,0,0,0.8)] flex items-center gap-6 animate-success-pop pointer-events-none">
          <div className="p-2 bg-black text-yellow-400 animate-mosh-sparkle">
             <Sparkles size={32} />
          </div>
          <div className="flex flex-col">
            <span className="text-black font-black uppercase text-xl tracking-tighter leading-none">{lastAction}</span>
            <span className="text-black/60 text-[8px] font-bold uppercase mt-1 tracking-widest">ICOSMITHY_OS: OP_COMPLETE</span>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorInfo && (
        <div className="fixed inset-0 z-[5000] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#c6c6c6] border-4 border-black p-8 shadow-[12px_12px_0_#000] animate-error-shake">
                <div className="flex items-center gap-4 mb-6 text-red-700">
                    <AlertTriangle size={48} />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">FORGE ERROR</h2>
                </div>
                <div className="bg-white p-6 border-2 border-black mb-8 shadow-inner">
                    <p className="text-[10px] text-slate-800 font-bold uppercase leading-relaxed">{errorInfo.fix}</p>
                </div>
                <button onClick={() => setErrorInfo(null)} className="w-full py-4 bg-red-600 text-white font-black uppercase text-xl border-2 border-black shadow-[4px_4px_0_#000] hover:brightness-110 active:scale-95 transition-all">DISMISS ALARM</button>
            </div>
        </div>
      )}

      {/* Toolboxes - Fixed Position Sidebar Container */}
      <div className="toolbox-container">
        {selectedIds.length > 0 && mode !== 'test' && (
          <>
            <ControlMatrix selectedIds={selectedIds} onAction={handleBulkAction} visible={true} />
            <PaletteForge onApplyPalette={handleApplyPalette} visible={true} />
          </>
        )}
      </div>

      <div className="w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <Header />
            <div className="flex gap-4">
              {selectedIds.length > 0 && (
                <RetroTooltip title="Batch Deselect" description="Clears current selection focus.">
                  <button onClick={() => setSelectedIds([])} className="px-6 py-3 bg-red-700 border-2 border-black text-white text-[10px] font-bold uppercase shadow-[4px_4px_0_#000] hover:bg-red-600 active:scale-95 transition-all">DESELECT ({selectedIds.length})</button>
                </RetroTooltip>
              )}
              <RetroTooltip title="Light/Dark" description="Switch interface contrast mode.">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-[#c6c6c6] border-2 border-black shadow-[4px_4px_0_#000,inset_1px_1px_0_#fff] hover:scale-105 active:scale-95 transition-all">
                    {isDarkMode ? <Sun className="text-amber-500" size={24} /> : <Moon className="text-indigo-600" size={24} />}
                </button>
              </RetroTooltip>
            </div>
        </div>

        <main className="w-full">
          {/* Main Navigation Tabs */}
          <div className="flex justify-center gap-3 mb-10">
              {[
                { id: 'upscale', label: 'THE SMITHY', icon: Hammer },
                { id: 'cauldron', label: 'THE CAULDRON', icon: Coffee },
                { id: 'test', label: 'PREVIEW', icon: Monitor }
              ].map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setMode(tab.id as any)} 
                    className={`flex-1 md:flex-none px-8 py-4 text-[11px] font-black border-2 border-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 justify-center
                        ${mode === tab.id 
                            ? 'bg-[#8b8b8b] text-white shadow-[4px_4px_0_#000,inset_2px_2px_0_#fff]' 
                            : 'bg-[#555] text-white/50 hover:text-white shadow-[2px_2px_0_#000]'
                        }`}
                >
                  <tab.icon size={16}/> {tab.label}
                </button>
              ))}
          </div>

          <div className="min-h-[600px]">
            {mode === 'cauldron' ? (
              <div className="space-y-12 animate-in slide-in-from-bottom-4">
                <Cauldron onPackGenerated={() => triggerGratification('PACK BREWED')} onImportToSmithy={handleImportPackToSmithy} onError={(msg, fix) => setErrorInfo({msg, fix})} />
                {files.length > 0 && (
                  <div className="mt-12 bg-[#222] p-6 border-2 border-black">
                    <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-6 border-b border-white/5 pb-2">STASHED ASSETS</h3>
                    <Gallery files={files} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />
                  </div>
                )}
              </div>
            ) : mode === 'test' ? (
              <div className="bg-[#c6c6c6] border-2 border-black shadow-[8px_8px_0_#000] p-8 animate-in zoom-in duration-300">
                 <Desktop files={files} assignments={desktopAssignments} onAssign={(s, id) => setDesktopAssignments(prev => ({ ...prev, [s]: id }))} onError={(msg, fix) => setErrorInfo({msg, fix})} />
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <EffectsPanel effects={effects} setEffects={setEffects} disabled={isProcessing} onUndo={() => {}} canUndo={false} onError={(msg, fix) => setErrorInfo({ msg, fix })} />
                <Controls resolution={resolution} setResolution={setResolution} exportFormat={exportFormat} setExportFormat={setExportFormat} onDownload={handleDownloadZip} onReset={() => setFiles([])} isProcessing={isProcessing} canDownload={files.length > 0} />
                <DropZone onFilesSelected={handleFilesSelected} />
                
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6 border-b-2 border-white/10 pb-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">INVENTORY</h3>
                      <button 
                        onClick={() => setShowComparison(!showComparison)} 
                        className="bg-[#333] border-2 border-black shadow-[2px_2px_0_#000] px-6 py-2 text-[9px] uppercase font-bold text-white hover:bg-black transition-all"
                      >
                        {showComparison ? "Gallery Mode" : "Comparison Mode"}
                      </button>
                    </div>
                    <Gallery files={files} comparisonMode={showComparison} sources={sourceCache.current} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />
                </div>
              </div>
            )}
          </div>
        </main>
        
        <StickerClipboard stickers={effects.customStickers} processedIcons={files.filter(f => f.status === 'completed')} onAddSticker={(url) => setEffects(prev => ({ ...prev, customStickers: [...prev.customStickers, { id: crypto.randomUUID(), url, x: 50, y: 50, scale: 30, rotation: 0, texture: 'none' }] }))} onRemoveSticker={(id) => setEffects(prev => ({ ...prev, customStickers: prev.customStickers.filter(s => s.id !== id) }))} onBatchApply={() => {}} onGenerate={() => {}} onApplyTexture={(id, tex) => setEffects(prev => ({ ...prev, customStickers: prev.customStickers.map(s => s.id === id ? { ...s, texture: tex } : s) }))} />
        <FloatingHelp onNav={(p) => setMode(p)} />
      </div>
    </div>
  );
};

export default App;
