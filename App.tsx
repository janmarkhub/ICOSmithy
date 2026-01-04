
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
import { ProcessedFile, Resolution, ExportFormat, CustomSticker, StickerTexture, BatchEffects, DesktopAssignments, GeneratedPackItem } from './types';
import { parseIcoAndGetLargestImage } from './utils/icoParser';
import { upscaleAndEditImage, DEFAULT_EFFECTS, calculateFidelity } from './utils/imageProcessor';
import { wrapPngInIco } from './utils/icoEncoder';
import { generateStickerAI, getEffectRecommendation } from './utils/aiVision';
import { Hammer, Wand2, Monitor, Stars, AlertTriangle, HelpCircle, Coffee, Layout, Sun, Moon, FileWarning } from 'lucide-react';

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
  const [mode, setMode] = useState<'upscale' | 'test' | 'cauldron'>('upscale');
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
  const [errorInfo, setErrorInfo] = useState<{ msg: string, fix: string } | null>(null);

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
    triggerGratification('Loot Reforged');
  }, [effects, resolution, exportFormat, files.length]);

  const triggerGratification = (action: string) => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 2000);
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
        setErrorInfo({ 
            msg: `Failed to process image: ${file.name}`, 
            fix: "This image might be corrupt or an unsupported bit depth. WAT DO? Try opening it in Paint, saving as a fresh PNG, and dropping it back in."
        });
      }
    }
    setFiles(prev => [...newFiles, ...prev]);
    setIsProcessing(false);
    triggerGratification('Items Found');
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
      
      const fidelity = 100; // Generated icons are high quality
      sourceCache.current.set(id, { id, image: tempImg, rawUrl: url, fidelity });
      
      const initialPng = await upscaleAndEditImage(tempImg, resolution, effects, undefined, fidelity);
      newFiles.push({
        id, originalName: `${item.label}.png`, newName: `${item.label}.${exportFormat}`,
        blob: initialPng, previewUrl: URL.createObjectURL(initialPng), status: 'completed' as const, width: resolution, height: resolution,
        originalType: 'image/png', fidelityScore: fidelity
      });
    }
    setFiles(prev => [...newFiles, ...prev]);
    setIsProcessing(false);
    setMode('upscale');
    triggerGratification('Pack Imported');
  }, [resolution, effects, exportFormat]);

  const handleDownloadZip = useCallback(() => {
    const zip = new (window as any).JSZip();
    files.filter(f => f.status === 'completed').forEach(file => zip.file(file.newName, file.blob));
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
      (window as any).saveAs(content, `ICOSmithy_Export.zip`);
    });
    triggerGratification('Stash Exported');
  }, [files]);

  return (
    <div className={`min-h-screen transition-all duration-500 font-mono ${isDarkMode ? 'bg-[#111] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {lastAction && (
        <div className="fixed top-12 right-12 z-[2000] bg-yellow-400 border-4 border-black p-4 shadow-[12px_12px_0px_rgba(0,0,0,0.6)] flex items-center gap-4 animate-in slide-in-from-right-12">
          <Wand2 size={24} className="text-black animate-spin-slow" />
          <span className="text-black font-bold uppercase text-lg tracking-tighter drop-shadow-sm">{lastAction}!</span>
        </div>
      )}

      {errorInfo && (
        <div className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="w-full max-w-xl bg-[#c6c6c6] border-8 border-red-600 p-8 shadow-2xl animate-error-shake">
                <div className="flex items-center gap-5 mb-6 text-red-700">
                    <AlertTriangle size={48} />
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">SMITHY FAILURE!</h2>
                </div>
                <div className="bg-black/10 border-4 border-black/20 p-5 mb-8">
                    <p className="text-sm text-red-900 font-bold uppercase tracking-tight leading-relaxed">{errorInfo.msg}</p>
                </div>
                <div className="bg-white p-6 border-4 border-black mb-8">
                    <div className="flex items-center gap-3 mb-4 text-indigo-700">
                        <HelpCircle size={24} />
                        <h3 className="text-lg font-black uppercase italic">WAT DO?</h3>
                    </div>
                    <p className="text-xs text-slate-800 font-bold leading-relaxed uppercase">{errorInfo.fix}</p>
                </div>
                <button onClick={() => setErrorInfo(null)} className="w-full py-5 bg-red-600 text-white font-black uppercase text-xl border-4 border-red-900 hover:bg-red-500 shadow-xl transition-all">OK, FIXING IT NOW</button>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex justify-between items-center mb-10">
            <Header />
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 bg-[#c6c6c6] border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] shadow-xl hover:scale-110 active:scale-95 transition-all">
                {isDarkMode ? <Sun className="text-amber-500" size={28} /> : <Moon className="text-indigo-600" size={28} />}
            </button>
        </div>

        <main className="max-w-5xl mx-auto">
          <div className="flex justify-center gap-3 mb-12">
              {[
                { id: 'upscale', label: 'The Smithy', icon: Hammer },
                { id: 'cauldron', label: 'The Cauldron', icon: Coffee },
                { id: 'test', label: 'Desktop Forge', icon: Monitor }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setMode(tab.id as any)} 
                  className={`px-8 py-4 text-sm font-black border-4 uppercase tracking-widest transition-all flex items-center gap-3
                    ${mode === tab.id 
                      ? 'bg-[#8b8b8b] border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] text-white shadow-[8px_8px_0_rgba(0,0,0,0.5)] translate-y-1' 
                      : 'bg-[#555555] border-t-[#8b8b8b] border-l-[#8b8b8b] border-r-[#222] border-b-[#222] text-[#888] hover:bg-[#666] hover:-translate-y-1'
                    }
                  `}
                >
                  <tab.icon size={18}/> {tab.label}
                </button>
              ))}
          </div>

          {mode === 'cauldron' ? (
            <Cauldron 
                onPackGenerated={(pack) => triggerGratification('Pack Brewed')} 
                onImportToSmithy={handleImportPackToSmithy}
                onError={(msg, fix) => setErrorInfo({msg, fix})} 
            />
          ) : mode === 'test' ? (
            <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-10 rounded-sm shadow-2xl relative animate-in fade-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-8 border-b-4 border-black/10 pb-4">
                  <h2 className="text-2xl font-black text-[#111] uppercase flex items-center gap-4"><Monitor size={32}/> Deployment Simulator</h2>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white border-4 border-white text-[9px] font-black uppercase hover:bg-indigo-500 transition-all">Inspire Me</button>
                  </div>
               </div>
               <Desktop files={files} assignments={desktopAssignments} onAssign={(s, id) => setDesktopAssignments(prev => ({ ...prev, [s]: id }))} onError={(msg, fix) => setErrorInfo({msg, fix})} />
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-300">
              <EffectsPanel effects={effects} setEffects={setEffects} disabled={isProcessing} onUndo={() => {}} canUndo={false} onError={(msg, fix) => setErrorInfo({ msg, fix })} />
              <Controls resolution={resolution} setResolution={setResolution} exportFormat={exportFormat} setExportFormat={setExportFormat} onDownload={handleDownloadZip} onReset={() => setFiles([])} isProcessing={isProcessing} canDownload={files.length > 0} />
              <DropZone onFilesSelected={handleFilesSelected} />
              <div className="mt-12">
                  <div className="flex items-center justify-between mb-6 border-b-4 border-white/10 pb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-4"><Layout size={20} className="text-indigo-400"/> Inventory</h3>
                    <button onClick={() => setShowComparison(!showComparison)} className="bg-[#333] border-4 border-[#555] px-6 py-2 text-[11px] uppercase font-bold text-white hover:bg-white/10 transition-all">{showComparison ? "Gallery" : "Comparison"}</button>
                  </div>
                  <Gallery files={files} comparisonMode={showComparison} sources={sourceCache.current} />
              </div>
            </div>
          )}
        </main>

        <StickerClipboard stickers={effects.customStickers} processedIcons={files.filter(f => f.status === 'completed')} onAddSticker={(url) => setEffects(prev => ({ ...prev, customStickers: [...prev.customStickers, { id: crypto.randomUUID(), url, x: 50, y: 50, scale: 30, rotation: 0, texture: 'none' }] }))} onRemoveSticker={(id) => setEffects(prev => ({ ...prev, customStickers: prev.customStickers.filter(s => s.id !== id) }))} onBatchApply={() => {}} onGenerate={() => {}} onApplyTexture={(id, tex) => setEffects(prev => ({ ...prev, customStickers: prev.customStickers.map(s => s.id === id ? { ...s, texture: tex } : s) }))} />
        <FloatingHelp onNav={(p) => setMode(p)} />

        <footer className="mt-24 text-center text-slate-600 text-[11px] border-t border-white/5 pt-12 pb-20 tracking-[0.5em] uppercase font-bold flex flex-col items-center gap-4 opacity-30">
          <p>&copy; {new Date().getFullYear()} ICOSmithy &bull; Built in the Forge</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
