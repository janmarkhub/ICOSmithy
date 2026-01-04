
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { EffectsPanel } from './components/EffectsPanel';
import { ProcessedFile, Resolution } from './types';
import { parseIcoAndGetLargestImage } from './utils/icoParser';
import { upscaleAndEditImage, BatchEffects, DEFAULT_EFFECTS } from './utils/imageProcessor';
import { wrapPngInIco } from './utils/icoEncoder';
import { identifyIconsInImage } from './utils/aiVision';
import { Wand2, MousePointer2, Sparkles, Zap, Eye, EyeOff } from 'lucide-react';

declare var JSZip: any;
declare var saveAs: any;

interface FileSource {
  id: string;
  image: HTMLImageElement;
  rawUrl: string; // Original URL for comparison
  cropBox?: [number, number, number, number];
}

const App: React.FC = () => {
  const [mode, setMode] = useState<'upscale' | 'extract'>('upscale');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [resolution, setResolution] = useState<Resolution>(Resolution.FHD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Extract all app icons and logos');
  const [effects, setEffects] = useState<BatchEffects>(DEFAULT_EFFECTS);
  const [showComparison, setShowComparison] = useState(false);
  
  const sourceCache = useRef<Map<string, FileSource>>(new Map());

  // Debounced Effect Pipeline
  useEffect(() => {
    let active = true;
    const applyEffects = async () => {
      if (files.length === 0) return;
      
      const updatedFiles = await Promise.all(files.map(async (file) => {
        if (!active) return file;
        if (file.status !== 'completed' && file.status !== 'processing') return file;
        
        const source = sourceCache.current.get(file.id);
        if (!source) return file;

        try {
          const editedPngBlob = await upscaleAndEditImage(source.image, resolution, effects, source.cropBox);
          const icoBlob = await wrapPngInIco(editedPngBlob);
          
          if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
          const previewUrl = URL.createObjectURL(editedPngBlob);

          return { ...file, blob: icoBlob, previewUrl, status: 'completed' as const };
        } catch (err) {
          console.error("Effect pipeline error:", err);
          return file;
        }
      }));

      if (active) setFiles(updatedFiles);
    };

    const timer = setTimeout(applyEffects, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [effects, resolution, files.length]);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setIsProcessing(true);
    
    if (mode === 'extract') {
      const masterFile = selectedFiles[0];
      const masterUrl = URL.createObjectURL(masterFile);
      const masterImg = new Image();
      await new Promise(res => { masterImg.onload = res; masterImg.src = masterUrl; });

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        try {
          const detections = await identifyIconsInImage(base64, aiPrompt);
          const newIcons: ProcessedFile[] = await Promise.all(detections.map(async (det) => {
            const id = crypto.randomUUID();
            sourceCache.current.set(id, { id, image: masterImg, rawUrl: masterUrl, cropBox: det.box_2d });
            const upscaledBlob = await upscaleAndEditImage(masterImg, resolution, effects, det.box_2d);
            const icoBlob = await wrapPngInIco(upscaledBlob);
            return {
              id,
              originalName: `${det.name}.ico`,
              newName: `${det.name}.ico`,
              blob: icoBlob,
              previewUrl: URL.createObjectURL(upscaledBlob),
              status: 'completed',
              width: resolution, height: resolution
            };
          }));
          setFiles(prev => [...newIcons, ...prev]);
        } catch (err) { console.error(err); } 
        finally { setIsProcessing(false); }
      };
      reader.readAsDataURL(masterFile);
    } else {
      for (const file of selectedFiles) {
        const id = crypto.randomUUID();
        const placeholder: ProcessedFile = {
          id, originalName: file.name, newName: file.name.replace(/\.[^/.]+$/, "") + ".ico",
          blob: new Blob(), previewUrl: '', status: 'processing', width: resolution, height: resolution
        };
        setFiles(prev => [placeholder, ...prev]);

        try {
          const rawBlob = await parseIcoAndGetLargestImage(file);
          const rawUrl = URL.createObjectURL(rawBlob);
          const tempImg = new Image();
          await new Promise(res => { tempImg.onload = res; tempImg.src = rawUrl; });

          sourceCache.current.set(id, { id, image: tempImg, rawUrl });
          const upscaledPng = await upscaleAndEditImage(tempImg, resolution, effects);
          const icoBlob = await wrapPngInIco(upscaledPng);

          setFiles(prev => prev.map(f => f.id === id ? { ...f, blob: icoBlob, previewUrl: URL.createObjectURL(upscaledPng), status: 'completed' } : f));
        } catch (e) { setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error' } : f)); }
      }
      setIsProcessing(false);
    }
  }, [mode, resolution, aiPrompt, effects]);

  const handleDownloadZip = useCallback(() => {
    const zip = new JSZip();
    files.filter(f => f.status === 'completed').forEach(file => zip.file(file.newName, file.blob));
    zip.generateAsync({ type: "blob" }).then((content: Blob) => saveAs(content, `iconpro_batch.zip`));
  }, [files]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Header />
      <main className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
            <div className="flex bg-slate-200 p-1.5 rounded-xl shadow-inner border border-slate-300/50">
                <button onClick={() => setMode('upscale')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'upscale' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                    <MousePointer2 size={16} /> Upscale & Convert
                </button>
                <button onClick={() => setMode('extract')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'extract' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Zap size={16} className="text-amber-500" /> AI Vision Extract
                </button>
            </div>
            {files.length > 0 && (
                <button 
                  onClick={() => setShowComparison(!showComparison)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all border ${showComparison ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                    {showComparison ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showComparison ? "Hide Comparison" : "Diff Engine"}
                </button>
            )}
        </div>

        {mode === 'extract' && (
          <div className="bg-gradient-to-br from-white to-slate-50 p-6 border border-slate-200 rounded-2xl mb-6 shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-3 relative">
              <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600"><Sparkles size={18} /></div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">AI Vision Logic</label>
            </div>
            <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
          </div>
        )}

        <EffectsPanel effects={effects} setEffects={setEffects} disabled={isProcessing} />
        <Controls resolution={resolution} setResolution={setResolution} onDownload={handleDownloadZip} onReset={() => { setFiles([]); sourceCache.current.clear(); }} isProcessing={isProcessing} canDownload={files.some(f => f.status === 'completed')} />
        <DropZone onFilesSelected={handleFilesSelected} />
        
        <div className="mt-8">
            <Gallery files={files} comparisonMode={showComparison} sources={sourceCache.current} />
        </div>
      </main>
      <footer className="mt-20 text-center text-slate-400 text-[10px] border-t border-slate-100 pt-8 pb-12 tracking-widest uppercase font-bold">
        <p>&copy; {new Date().getFullYear()} IconPro HD Studio &bull; Creative Automation Platform</p>
      </footer>
    </div>
  );
};

export default App;
