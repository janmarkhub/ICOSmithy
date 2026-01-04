
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { EffectsPanel } from './components/EffectsPanel';
import { StickerClipboard } from './components/StickerClipboard';
import { Desktop } from './components/Desktop';
import { Cauldron } from './components/Cauldron';
import { CraftingTable } from './components/CraftingTable';
import { ControlMatrix } from './components/ControlMatrix';
import { PaletteForge } from './components/PaletteForge';
import { ProcessedFile, Resolution, ExportFormat, BatchEffects, DesktopAssignments, GeneratedPackItem, PersonBio } from './types';
import { parseIcoAndGetLargestImage } from './utils/icoParser';
import { upscaleAndEditImage, DEFAULT_EFFECTS, calculateFidelity, removeBgAndCenter } from './utils/imageProcessor';
import { wrapPngInIco } from './utils/icoEncoder';
import { GoogleGenAI } from "@google/genai";
import { Hammer, Monitor, AlertTriangle, Coffee, Sun, Moon, Sparkles, Scissors, Palette, Eye, ShieldCheck, Loader2 } from 'lucide-react';

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
  const [mode, setMode] = useState<'smithy' | 'desktop' | 'cauldron' | 'crafting'>('smithy');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [resolution, setResolution] = useState<Resolution>(Resolution.FHD);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.ICO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [effects, setEffects] = useState<BatchEffects>(DEFAULT_EFFECTS);
  const [desktopAssignments, setDesktopAssignments] = useState<DesktopAssignments>({});
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ msg: string, fix: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showPaletteForge, setShowPaletteForge] = useState(false);

  const sourceCache = useRef<Map<string, FileSource>>(new Map());

  const triggerGratification = (action: string) => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 3000);
  };

  const applyEffectsToFiles = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setGlobalProgress(0);
    
    const updatedFiles = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const source = sourceCache.current.get(file.id);
        if (!source) {
            updatedFiles.push(file);
            continue;
        }
        try {
            const editedPngBlob = await upscaleAndEditImage(source.image, resolution, effects, source.cropBox);
            let finalBlob = editedPngBlob;
            if (exportFormat === ExportFormat.ICO) finalBlob = await wrapPngInIco(editedPngBlob);
            const newName = file.originalName.replace(/\.[^/.]+$/, "") + `.${exportFormat}`;
            if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
            updatedFiles.push({ 
                ...file, 
                blob: finalBlob, 
                newName, 
                previewUrl: URL.createObjectURL(editedPngBlob), 
                status: 'completed' as const,
                progress: 100 
            });
        } catch (err) { updatedFiles.push(file); }
        setGlobalProgress(((i + 1) / files.length) * 100);
    }
    
    setFiles(updatedFiles);
    setIsProcessing(false);
    triggerGratification('SMITHY_SYNC_COMPLETE');
  }, [effects, resolution, exportFormat, files.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (!isProcessing) applyEffectsToFiles();
    }, 600);
    return () => clearTimeout(timer);
  }, [effects, resolution, exportFormat]);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setIsProcessing(true);
    setGlobalProgress(0);
    const newFiles = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = crypto.randomUUID();
      try {
        let rawBlob = file.name.toLowerCase().endsWith('.ico') ? await parseIcoAndGetLargestImage(file) : file;
        const rawUrl = URL.createObjectURL(rawBlob);
        const tempImg = new Image();
        await new Promise(res => { tempImg.onload = res; tempImg.src = rawUrl; });
        const fidelity = calculateFidelity(tempImg);
        sourceCache.current.set(id, { id, image: tempImg, rawUrl, fidelity });
        const initialPng = await upscaleAndEditImage(tempImg, resolution, effects);
        newFiles.push({
          id, originalName: file.name, newName: file.name.replace(/\.[^/.]+$/, "") + "." + exportFormat,
          blob: initialPng, previewUrl: URL.createObjectURL(initialPng), status: 'completed', progress: 100, width: resolution, height: resolution,
          originalType: file.type, fidelityScore: fidelity
        });
      } catch (e) { setErrorInfo({ msg: "Forge Refusal", fix: "Malformed file." }); }
      setGlobalProgress(((i + 1) / selectedFiles.length) * 100);
    }
    setFiles(prev => [...newFiles, ...prev]);
    setIsProcessing(false);
    triggerGratification('ASSETS_LOADED');
  }, [resolution, effects, exportFormat]);

  const handleReviewPack = async () => {
    if (files.length === 0) return;
    setIsProcessing(true); setGlobalProgress(50);
    triggerGratification('AI_REVIEWING_COHESION');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Suggest a perfect 4-color professional icon set palette in HEX. Return only JSON: ["#hex1", "#hex2", "#hex3", "#hex4"]`
        });
        const colors = JSON.parse(response.text || '[]');
        if (colors.length === 4) {
            setEffects(prev => ({ 
                ...prev, 
                outlineColor: colors[2],
                glowColor: colors[3],
                outlineEnabled: true,
                glowEnabled: true,
                cleanupEnabled: true,
                cleanupIntensity: 60
            }));
            triggerGratification('COHESION_PROFILE_APPLIED');
        }
    } catch (e) {
        setErrorInfo({ msg: "Review Failed", fix: "AI link unstable." });
    } finally { setIsProcessing(false); setGlobalProgress(0); }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      if (action === 'delete') {
        setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
      } else if (action === 'make-transparent' || action === 'center-icon') {
        const updatedFiles = [...files];
        for (let i = 0; i < selectedIds.length; i++) {
            const id = selectedIds[i];
            const idx = updatedFiles.findIndex(f => f.id === id);
            const src = sourceCache.current.get(id);
            if (idx === -1 || !src) continue;
            const cleanBlob = await removeBgAndCenter(src.image, effects.scrubAggression, effects.keepInternalColors);
            const cleanUrl = URL.createObjectURL(cleanBlob);
            const cleanImg = new Image();
            await new Promise(res => { cleanImg.onload = res; cleanImg.src = cleanUrl; });
            sourceCache.current.set(id, { ...src, image: cleanImg, rawUrl: cleanUrl });
            updatedFiles[idx] = { ...updatedFiles[idx], previewUrl: cleanUrl, blob: cleanBlob };
            setGlobalProgress(((i+1)/selectedIds.length)*100);
        }
        setFiles(updatedFiles);
        triggerGratification('CLEANUP_BATCH_DONE');
      }
    } finally {
      setSelectedIds([]); setIsProcessing(false); setShowMatrix(false); setGlobalProgress(0);
    }
  };

  const handleImportPackToSmithy = useCallback(async (pack: GeneratedPackItem[]) => {
    setIsProcessing(true);
    const newFiles: ProcessedFile[] = [];
    for (let i = 0; i < pack.length; i++) {
      const item = pack[i];
      if (!item.blob || !item.previewUrl) continue;
      const id = crypto.randomUUID();
      try {
        const img = new Image();
        img.src = item.previewUrl;
        await new Promise(res => img.onload = res);
        sourceCache.current.set(id, { id, image: img, rawUrl: item.previewUrl, fidelity: 100 });
        newFiles.push({
          id, originalName: item.label, newName: item.label + "." + exportFormat,
          blob: item.blob, previewUrl: item.previewUrl, status: 'completed', progress: 100, width: resolution,
          height: resolution, originalType: 'image/png', fidelityScore: 100, isAiGenerated: true
        });
      } catch (err) {}
      setGlobalProgress(((i+1)/pack.length)*100);
    }
    setFiles(prev => [...newFiles, ...prev]);
    setMode('smithy');
    setIsProcessing(false);
    setGlobalProgress(0);
    triggerGratification('PACK_IMPORT_SUCCESS');
  }, [resolution, exportFormat]);

  const handleDownloadAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      files.forEach(f => { if(f.blob) zip.file(f.newName, f.blob); });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `ICO_Pack_${Date.now()}.zip`);
      triggerGratification('EXPORT_COMPLETED');
    } catch (e) {
      setErrorInfo({ msg: "Export Fail", fix: "Bundle failed." });
    } finally { setIsProcessing(false); }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 flex flex-col items-center p-6 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-200 text-black'}`}>
      {lastAction && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] animate-success-pop">
          <div className="retro-panel bg-yellow-400 px-10 py-5 flex items-center gap-4 border-4 border-black">
            <Sparkles size={24} className="text-black animate-mosh-shake" />
            <span className="text-black font-black uppercase tracking-widest text-sm italic">{lastAction}</span>
          </div>
        </div>
      )}

      {/* Global Progress Bar */}
      {isProcessing && (
          <div className="fixed top-0 left-0 right-0 h-1.5 z-[4000] bg-white/5">
              <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-300" style={{ width: `${globalProgress}%` }} />
          </div>
      )}

      {errorInfo && (
        <div className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="retro-panel border-red-600 border-8 p-10 max-w-lg shadow-[20px_20px_0_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 mb-6 text-red-600"><AlertTriangle size={48} /><h2 className="text-2xl font-black uppercase">CRITICAL_FAIL</h2></div>
                <div className="p-4 bg-white mb-8 text-xs font-bold text-black border-2 border-black uppercase">{errorInfo.fix}</div>
                <button onClick={() => setErrorInfo(null)} className="win-btn w-full bg-red-600 text-white py-4 font-black">DISMISS</button>
            </div>
        </div>
      )}

      <div className="toolbox-container">
        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setShowMatrix(!showMatrix)} className={`win-btn p-4 border-4 ${showMatrix ? 'bg-indigo-600 text-white' : 'bg-white'}`}><Hammer size={24}/></button>
            <button onClick={() => setShowPaletteForge(!showPaletteForge)} className={`win-btn p-4 border-4 ${showPaletteForge ? 'bg-indigo-600 text-white' : 'bg-white'}`}><Palette size={24}/></button>
          </div>
        )}
        <ControlMatrix selectedIds={selectedIds} onAction={handleBulkAction} visible={showMatrix} onClose={() => setShowMatrix(false)} />
        <PaletteForge onApplyPalette={(c) => { setEffects(p => ({ ...p, duotone: true, duotoneColor1: c[0], duotoneColor2: c[1] })); setShowPaletteForge(false); }} visible={showPaletteForge} onClose={() => setShowPaletteForge(false)} />
      </div>

      <div className="w-full max-w-5xl space-y-8">
        <div className="flex justify-between items-center bg-black/20 p-6 border-4 border-white/5 rounded-none shadow-2xl">
            <Header />
            <div className="flex gap-4">
              <button onClick={handleReviewPack} disabled={files.length === 0 || isProcessing} className="win-btn bg-indigo-600 text-white gap-2 px-6 hover:bg-indigo-500">
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16}/>} REVIEW_PACK
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="win-btn p-3">{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            </div>
        </div>

        <nav className="flex gap-3">
            {[
              { id: 'smithy', label: 'THE SMITHY', icon: ShieldCheck },
              { id: 'cauldron', label: 'THE CAULDRON', icon: Coffee },
              { id: 'crafting', label: 'CRAFTING TABLE', icon: Scissors },
              { id: 'desktop', label: 'VISUALIZER', icon: Monitor }
            ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id as any)} className={`win-btn flex-1 py-5 gap-3 font-black text-xs transition-all ${mode === m.id ? 'bg-indigo-600 text-white border-white scale-105' : 'opacity-60 hover:opacity-100'}`}>
                    <m.icon size={16}/> {m.label}
                </button>
            ))}
        </nav>

        <section className="min-h-[600px] mb-20">
            {mode === 'cauldron' ? (
                <Cauldron onPackGenerated={() => triggerGratification('MAGIC_BREW_COMPLETE')} onImportToSmithy={handleImportPackToSmithy} onOpenSlicerWithImage={() => setMode('crafting')} onError={(msg, fix) => setErrorInfo({msg, fix})} />
            ) : mode === 'crafting' ? (
                <CraftingTable onImportToSmithy={handleImportPackToSmithy} onError={(msg, fix) => setErrorInfo({msg, fix})} />
            ) : mode === 'desktop' ? (
                <Desktop files={files} assignments={desktopAssignments} onAssign={(s, id) => setDesktopAssignments(p => ({ ...p, [s]: id }))} onTeleport={async ()=>{}} currentPerson={null} isProcessing={isProcessing} />
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <EffectsPanel effects={effects} setEffects={setEffects} disabled={isProcessing} onError={(msg, fix) => setErrorInfo({msg, fix})} />
                    <Controls resolution={resolution} setResolution={setResolution} exportFormat={exportFormat} setExportFormat={setExportFormat} onDownload={handleDownloadAll} onReset={() => setFiles([])} isProcessing={isProcessing} canDownload={files.length > 0} />
                    <DropZone onFilesSelected={handleFilesSelected} />
                    <Gallery files={files} comparisonMode={false} sources={sourceCache.current} selectedIds={selectedIds} onToggleSelect={(id, sh) => {
                        setSelectedIds(prev => {
                          const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
                          if (next.length > 0 && !showMatrix) setShowMatrix(true);
                          return next;
                        });
                    }} />
                </div>
            )}
        </section>
      </div>
      <StickerClipboard stickers={effects.customStickers} processedIcons={files.filter(f => f.status === 'completed')} onAddSticker={(u) => setEffects(p => ({ ...p, customStickers: [...p.customStickers, { id: crypto.randomUUID(), url: u, x: 50, y: 50, scale: 30, rotation: 0, texture: 'none' }] }))} onRemoveSticker={id => setEffects(p => ({ ...p, customStickers: p.customStickers.filter(s => s.id !== id) }))} onBatchApply={() => {}} onGenerate={() => {}} onApplyTexture={() => {}} />
    </div>
  );
};

export default App;
