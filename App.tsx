
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { EffectsPanel } from './components/EffectsPanel';
import { StickerClipboard } from './components/StickerClipboard';
import { Desktop } from './components/Desktop';
import { ProcessedFile, Resolution, ExportFormat, CustomSticker, StickerTexture, BatchEffects, DesktopAssignments } from './types';
import { parseIcoAndGetLargestImage } from './utils/icoParser';
import { upscaleAndEditImage, DEFAULT_EFFECTS, calculateFidelity } from './utils/imageProcessor';
import { wrapPngInIco } from './utils/icoEncoder';
import { removeBackgroundAI, generateThemeSetSuggestions, generateStickerAI, getEffectRecommendation } from './utils/aiVision';
// Added missing Monitor and Stars icons to solve reference errors on line 198 and 235
import { MousePointer2, Zap, Eye, EyeOff, Globe, Sparkles, Moon, Sun, Loader2, Scissors, Info, X, Layout, FileWarning, Hammer, Wand2, Monitor, Stars } from 'lucide-react';

declare var JSZip: any;
declare var saveAs: any;

interface FileSource {
  id: string;
  image: HTMLImageElement;
  rawUrl: string; 
  cropBox?: [number, number, number, number];
  fidelity: number;
}

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mode, setMode] = useState<'upscale' | 'test' | 'theme'>('upscale');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [resolution, setResolution] = useState<Resolution>(Resolution.FHD);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.ICO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [effects, setEffects] = useState<BatchEffects>(DEFAULT_EFFECTS);
  const [showComparison, setShowComparison] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [desktopAssignments, setDesktopAssignments] = useState<DesktopAssignments>({});
  const [showAnimationNotice, setShowAnimationNotice] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

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
    triggerGratification('Reforged');
  }, [effects, resolution, exportFormat, files.length]);

  const triggerGratification = (action: string) => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 2000);
  };

  useEffect(() => {
    const timer = setTimeout(applyEffectsToFiles, 300);
    return () => clearTimeout(timer);
  }, [effects, resolution, exportFormat, files.length]);

  useEffect(() => {
    if (effects.isAnimated && exportFormat === ExportFormat.ICO) {
      setShowAnimationNotice(true);
    }
  }, [effects.isAnimated, exportFormat]);

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
        
        if (newFiles.length === 1) {
            getEffectRecommendation("").then(setRecommendation);
        }
      } catch (e) { console.error(e); }
    }
    setFiles(prev => [...newFiles, ...prev]);
    setIsProcessing(false);
    triggerGratification('Loot Acquired');
  }, [resolution, effects, exportFormat]);

  const handleStickerGen = async (type: string) => {
    const promptValue = window.prompt(`Describe the ${type} magic item:`);
    if (!promptValue) return;
    setIsProcessing(true);
    try {
        const url = await generateStickerAI(type, promptValue);
        const s: CustomSticker = { id: crypto.randomUUID(), url, x: 50, y: 50, scale: 30, rotation: 0, texture: 'none' };
        setEffects(prev => ({ ...prev, customStickers: [...prev.customStickers, s] }));
        triggerGratification('Summoned Item');
    } catch(e) { console.error(e); }
    setIsProcessing(false);
  };

  const handleAssignToDesktop = (slot: keyof DesktopAssignments, fileId: string) => {
    setDesktopAssignments(prev => ({ ...prev, [slot]: fileId }));
    triggerGratification('Slot Assigned');
  };

  const handleDownloadZip = useCallback(() => {
    const zip = new (window as any).JSZip();
    files.filter(f => f.status === 'completed').forEach(file => zip.file(file.newName, file.blob));
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
      (window as any).saveAs(content, `Win11Toolkit_Collection.zip`);
    });
    triggerGratification('Stash Exported');
  }, [files]);

  return (
    <div className={`min-h-screen transition-all duration-500 font-mono ${isDarkMode ? 'bg-[#111] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notification for Gratification */}
      {lastAction && (
        <div className="fixed top-10 right-10 z-[300] bg-yellow-400 border-4 border-black p-4 shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in slide-in-from-right-10">
          <Wand2 size={24} className="text-black animate-spin-slow" />
          <span className="text-black font-bold uppercase text-lg tracking-tighter drop-shadow-sm">{lastAction}!</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        <div className="flex justify-between items-center mb-8">
            <Header />
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-3 bg-[#c6c6c6] border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] shadow-lg hover:scale-110 active:scale-95 transition-all group"
              >
                  {isDarkMode ? <Sun className="text-amber-500 group-hover:rotate-45 transition-transform" size={24} /> : <Moon className="text-indigo-600 group-hover:-rotate-45 transition-transform" size={24} />}
              </button>
            </div>
        </div>

        <main className="max-w-4xl mx-auto">
          {/* Main Navigation tabs Minecraft Style */}
          <div className="flex justify-center gap-1 mb-10">
              <button 
                onClick={() => setMode('upscale')} 
                className={`px-8 py-3 text-xs font-bold border-4 uppercase tracking-widest transition-all
                  ${mode === 'upscale' 
                    ? 'bg-[#8b8b8b] border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] text-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] translate-y-2' 
                    : 'bg-[#555555] border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#222] border-b-[#222] text-[#888] hover:bg-[#666] hover:-translate-y-1'
                  }
                `}
              >
                The Forge
              </button>
              <button 
                onClick={() => setMode('test')} 
                className={`px-8 py-3 text-xs font-bold border-4 uppercase tracking-widest transition-all
                  ${mode === 'test' 
                    ? 'bg-[#8b8b8b] border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] text-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] translate-y-2' 
                    : 'bg-[#555555] border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#222] border-b-[#222] text-[#888] hover:bg-[#666] hover:-translate-y-1'
                  }
                `}
              >
                Desktop Sim
              </button>
          </div>

          {mode === 'test' ? (
            <div className="animate-in fade-in zoom-in duration-300">
               <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-8 rounded-sm shadow-2xl relative">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#111] uppercase drop-shadow-[1px_1px_0_white] flex items-center gap-3">
                        <Monitor size={24}/> Virtual Desktop Workspace
                    </h2>
                    <div className="flex gap-2">
                      <div className="bg-[#555] px-4 py-1.5 border-4 border-white text-[10px] text-white uppercase font-bold animate-pulse">Live Visualizer</div>
                    </div>
                 </div>
                 <Desktop files={files} assignments={desktopAssignments} onAssign={handleAssignToDesktop} />
                 <div className="mt-8 p-5 bg-[#333] border-4 border-t-[#111] border-l-[#111] border-r-[#555] border-b-[#555] flex items-start gap-4 shadow-inner">
                    <Zap size={24} className="text-yellow-400 shrink-0" />
                    <div>
                        <p className="text-[11px] text-white font-bold uppercase tracking-widest leading-relaxed">
                            Pro-Tip: Right-click any icon on the virtual desktop to assign multiple states (Empty/Full, Hover/Click). Use the visualization toolkit to test movement!
                        </p>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {showAnimationNotice && (
                <div className="bg-amber-600 border-4 border-white p-5 rounded-sm flex items-center justify-between gap-6 shadow-2xl animate-mosh-shake">
                  <div className="flex items-center gap-4">
                    <FileWarning size={32} className="text-white" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Incompatible Format Detected!</p>
                      <p className="text-[10px] text-white/90 uppercase font-bold leading-tight mt-1">Movement effects are active. ICO files are static images. Switch to GIF export for full animation support.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => {setExportFormat(ExportFormat.GIF); setShowAnimationNotice(false);}} className="bg-white text-amber-700 px-5 py-2 text-[10px] font-bold uppercase border-4 border-amber-900 shadow-md hover:scale-105">Switch to GIF</button>
                    <button onClick={() => setShowAnimationNotice(false)} className="text-white hover:rotate-90 transition-transform"><X size={24}/></button>
                  </div>
                </div>
              )}

              {recommendation && (
                <div className="bg-indigo-900/40 border-4 border-indigo-400/50 p-5 rounded-sm flex items-start gap-4 shadow-lg">
                    <Stars size={24} className="text-indigo-300 mt-1 shrink-0 animate-mosh-sparkle" />
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Enchanter's Secret Lore</p>
                        <p className="text-sm text-slate-300 italic leading-relaxed">"{recommendation}"</p>
                    </div>
                    <button onClick={() => setRecommendation(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                </div>
              )}

              <EffectsPanel effects={effects} setEffects={setEffects} disabled={isProcessing} onUndo={() => {}} canUndo={false} />
              
              <Controls 
                  resolution={resolution} setResolution={setResolution} 
                  exportFormat={exportFormat} setExportFormat={setExportFormat} 
                  onDownload={handleDownloadZip} onReset={() => {setFiles([]); triggerGratification('Wiped');}} 
                  isProcessing={isProcessing} canDownload={files.length > 0} 
              />
              
              <DropZone onFilesSelected={handleFilesSelected} />
              
              <div className="mt-8">
                  <div className="flex items-center justify-between mb-4 border-b-4 border-white/10 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-3">
                      <Layout size={18} className="text-indigo-400"/> Output Stash
                    </h3>
                    <div className="flex gap-3">
                        <button onClick={() => setShowComparison(!showComparison)} className="bg-[#333] border-4 border-[#555] px-4 py-1.5 text-[10px] uppercase font-bold text-white hover:bg-white/10 transition-all">
                          {showComparison ? "Gallery View" : "Compare Bits"}
                        </button>
                    </div>
                  </div>
                  <Gallery files={files} comparisonMode={showComparison} sources={sourceCache.current} />
              </div>
            </div>
          )}
        </main>

        <StickerClipboard 
            stickers={effects.customStickers} 
            processedIcons={files.filter(f => f.status === 'completed')}
            onAddSticker={(url) => {
                const s: CustomSticker = { id: crypto.randomUUID(), url, x: 50, y: 50, scale: 30, rotation: 0, texture: 'none' };
                setEffects(prev => ({ ...prev, customStickers: [...prev.customStickers, s] }));
            }}
            onRemoveSticker={(id) => setEffects(prev => ({ ...prev, customStickers: prev.customStickers.filter(s => s.id !== id) }))}
            onBatchApply={() => {}}
            onGenerate={handleStickerGen}
            onApplyTexture={(id, tex) => setEffects(prev => ({ ...prev, customStickers: prev.customStickers.map(s => s.id === id ? { ...s, texture: tex } : s) }))}
        />

        <footer className="mt-20 text-center text-slate-600 text-[10px] border-t border-white/5 pt-10 pb-16 tracking-[0.4em] uppercase font-bold flex flex-col items-center gap-3">
          <div className="flex gap-6 opacity-30">
            <span className="flex items-center gap-2"><Hammer size={12}/> Block Smithy v6.2</span>
            <span>&bull;</span>
            <span className="flex items-center gap-2"><Sparkles size={12}/> Enchanted Toolkit</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Win11 Ico Toolkit &bull; Crafting the Future Pixel by Pixel</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
