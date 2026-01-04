
import React, { useState } from 'react';
import { Palette, Search, Zap, X, RefreshCw, Loader, Coffee, Tv, Box, Wand2, ArrowRightCircle, CheckCircle2, Sparkles, Binary, Package, Scissors } from 'lucide-react';
import { getPackRecommendations, getSubThemes, generatePackPrompts, generateIconGrid } from '../utils/aiVision';
import { GeneratedPackItem } from '../types';

interface CauldronProps {
  onPackGenerated: (pack: GeneratedPackItem[]) => void;
  onImportToSmithy: (pack: GeneratedPackItem[]) => void;
  onError: (msg: string, fix: string) => void;
}

export const Cauldron: React.FC<CauldronProps> = ({ onPackGenerated, onImportToSmithy, onError }) => {
  const [activePath, setActivePath] = useState<'source' | 'theme'>('source');
  
  // Source Path States
  const [fetchFrom, setFetchFrom] = useState('');
  const [whichFrom, setWhichFrom] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Default Pixel');
  
  // Theme Path States
  const [selectedMainTheme, setSelectedMainTheme] = useState<string | null>(null);
  const [subThemes, setSubThemes] = useState<string[]>([]);
  const [selectedSubTheme, setSelectedSubTheme] = useState<string | null>(null);
  const [isTheming, setIsTheming] = useState(false);

  const [isCooking, setIsCooking] = useState(false);
  const [cookProgress, setCookProgress] = useState(0);
  const [cookMessage, setCookMessage] = useState('');
  
  const [lastGeneratedPack, setLastGeneratedPack] = useState<GeneratedPackItem[]>([]);

  const mainThemes = ["Gaming", "Retro", "Meme", "Windows Like"];
  const styleOptions = ["Default Pixel", "32-bit Glossy", "Shiny Glass", "Dark Knight", "Retro CRT", "Gold Plated", "Cyberpunk Neon", "Cute Pastel", "3D Clay"];

  const handleSourceRecs = async () => {
    if (!fetchFrom.trim()) return onError("Source is empty!", "Type a source (like 'Pokemon') into the 'Fetch from where' field.");
    setIsRecommending(true);
    try {
      const recs = await getPackRecommendations(fetchFrom);
      setRecommendations(recs);
      if (recs.length > 0) setWhichFrom(recs[0]);
    } catch (e) {
      onError("Cauldron Overboiled!", "The AI spirits are busy. Try a more popular show or check your connection.");
    } finally {
      setIsRecommending(false);
    }
  };

  const handleThemeSelect = async (theme: string) => {
    setSelectedMainTheme(theme);
    setSelectedSubTheme(null);
    setIsTheming(true);
    try {
      const subs = await getSubThemes(theme);
      setSubThemes(subs);
    } catch (e) {
      onError("Theme Vision Blurred!", "Could not fetch dynamic sub-themes. Try selecting a different main theme.");
    } finally {
      setIsTheming(false);
    }
  };

  const startCooking = async () => {
    const source = activePath === 'source' ? fetchFrom : selectedMainTheme;
    const category = activePath === 'source' ? whichFrom : selectedSubTheme;
    
    if (!source || !category) return onError("Recipe Incomplete!", "Ensure both primary and secondary selections are made.");
    
    setIsCooking(true);
    setCookProgress(5);
    setCookMessage("Dreaming up icon grid...");
    
    try {
      // 1. Generate Metadata and Prompt
      const { items, masterPrompt } = await generatePackPrompts(source, category, selectedStyle);
      setCookProgress(20);
      setCookMessage("Brewing Sprite Sheet (Batch 1/1)...");

      // 2. Generate Single Master Grid
      const gridDataUrl = await generateIconGrid(masterPrompt);
      setCookProgress(60);
      setCookMessage("Slicing and Refining 10 Icons...");

      // 3. Slice Grid into 10 items
      const masterImg = new Image();
      await new Promise(res => { masterImg.onload = res; masterImg.src = gridDataUrl; });
      
      const results: GeneratedPackItem[] = [];
      const cols = 4;
      const rows = 3;
      const cellW = masterImg.width / cols;
      const cellH = masterImg.height / rows;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = 512; // Standard High Res for slice
      sliceCanvas.height = 512;
      const sctx = sliceCanvas.getContext('2d')!;

      for (let i = 0; i < 10; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        
        sctx.clearRect(0, 0, 512, 512);
        // Draw slice with a bit of internal padding to avoid grid lines
        const pad = cellW * 0.05;
        sctx.drawImage(
            masterImg, 
            c * cellW + pad, r * cellH + pad, cellW - pad*2, cellH - pad*2, 
            0, 0, 512, 512
        );
        
        const dataUrl = sliceCanvas.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        
        results.push({
          label: items[i]?.label || `Icon ${i+1}`,
          prompt: masterPrompt,
          blob,
          previewUrl: dataUrl
        });

        setCookProgress(60 + (i / 10) * 40);
      }
      
      setLastGeneratedPack(results);
      onPackGenerated(results);
      setCookMessage("Pack complete!");
    } catch (e) {
      console.error(e);
      onError("The Cauldron Cracked!", "Batch generation failed. Try again with a simpler source name.");
    } finally {
      setTimeout(() => setIsCooking(false), 800);
    }
  };

  return (
    <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-10 rounded-sm shadow-2xl relative animate-in fade-in duration-300">
      {isCooking && (
        <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
          <div className="relative">
            <Coffee size={80} className="text-indigo-400 animate-cauldron-mix mb-8" />
            <div className="absolute top-0 right-0 animate-bubble-up text-indigo-300"><Sparkles size={20}/></div>
          </div>
          <p className="text-white font-black uppercase tracking-[0.4em] animate-pulse mb-8 max-w-md">{cookMessage}</p>
          <div className="w-full max-w-xl h-6 bg-[#333] border-4 border-white p-1">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${cookProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10 border-b-4 border-[#555] pb-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-900 border-4 border-indigo-400 shadow-lg">
            <Package className="text-indigo-200" size={36} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">The Cauldron</h2>
            <p className="text-[11px] text-[#555] font-black tracking-widest uppercase mt-1">AI Powered Batch Summoning (Grid Optimised)</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setActivePath('source')} 
            className={`px-8 py-3 text-[11px] font-black uppercase border-4 transition-all shadow-md ${activePath === 'source' ? 'bg-[#555] text-white border-white scale-105' : 'bg-[#8b8b8b] text-[#333] border-transparent hover:bg-[#999]'}`}
          >
            Summon Source
          </button>
           <button 
            onClick={() => setActivePath('theme')} 
            className={`px-8 py-3 text-[11px] font-black uppercase border-4 transition-all shadow-md ${activePath === 'theme' ? 'bg-[#555] text-white border-white scale-105' : 'bg-[#8b8b8b] text-[#333] border-transparent hover:bg-[#999]'}`}
          >
            Dynamic Theme
          </button>
        </div>
      </div>

      {activePath === 'source' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4 space-y-3">
            <label className="text-[11px] font-black text-white uppercase tracking-widest block drop-shadow-sm">Fetch from where:</label>
            <div className="relative">
              <input type="text" value={fetchFrom} onChange={e => setFetchFrom(e.target.value)} placeholder="e.g. Satoshi Nakamoto" className="w-full bg-[#333] border-4 border-[#555] p-5 text-sm text-white uppercase font-black outline-none focus:bg-black transition-all" />
              <Search className="absolute right-5 top-5 text-white/30" size={22} />
            </div>
          </div>
          <div className="md:col-span-2">
            <button onClick={handleSourceRecs} disabled={isRecommending} className="w-full py-5 bg-indigo-600 border-4 border-white/20 text-white text-[12px] font-black uppercase hover:bg-indigo-500 disabled:opacity-50 shadow-xl">
              {isRecommending ? <RefreshCw className="animate-spin" size={20} /> : "Scan Recs"}
            </button>
          </div>
          <div className="md:col-span-4 space-y-3">
            <label className="text-[11px] font-black text-white uppercase tracking-widest block drop-shadow-sm">Which from that:</label>
            <div className="flex gap-2">
              {recommendations.length > 0 ? (
                <div className="flex flex-1 gap-2">
                  <select value={whichFrom} onChange={e => setWhichFrom(e.target.value)} className="smith-select flex-1 bg-[#333] border-4 border-indigo-400 p-4 text-sm text-white uppercase font-black outline-none cursor-pointer">
                    {recommendations.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => setRecommendations([])} className="p-4 bg-red-800 border-4 border-red-600 text-white hover:bg-red-700 transition-colors"><X size={20}/></button>
                  <button onClick={handleSourceRecs} className="p-4 bg-[#555] border-4 border-white text-white hover:bg-white/10 transition-all"><RefreshCw size={20}/></button>
                </div>
              ) : (
                <input type="text" value={whichFrom} onChange={e => setWhichFrom(e.target.value)} placeholder="e.g. Cyber Deck" className="w-full bg-[#333] border-4 border-[#555] p-5 text-sm text-white uppercase font-black outline-none" />
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <button onClick={() => { setFetchFrom("Pokemon Gen 1"); handleSourceRecs(); }} className="w-full py-5 bg-yellow-600 border-4 border-white/20 text-black text-[12px] font-black uppercase hover:bg-yellow-500 active:scale-95 transition-all shadow-xl">Surprise Me</button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-4 gap-4">
            {mainThemes.map(t => (
              <button key={t} onClick={() => handleThemeSelect(t)} className={`p-8 border-4 uppercase font-black text-lg tracking-tighter transition-all shadow-md ${selectedMainTheme === t ? 'bg-indigo-600 text-white border-white scale-105' : 'bg-[#8b8b8b] text-[#333] border-[#555] hover:bg-[#aaa]'}`}>
                {t}
              </button>
            ))}
          </div>
          {selectedMainTheme && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <label className="text-[11px] font-black text-white uppercase tracking-widest block mb-5 drop-shadow-sm">Choose dynamic flavor:</label>
              <div className="grid grid-cols-4 gap-4">
                {isTheming ? Array.from({length:4}).map((_,i)=><div key={i} className="h-16 bg-[#555] animate-pulse border-4 border-[#333]"/>) : subThemes.map(st => (
                  <button key={st} onClick={() => setSelectedSubTheme(st)} className={`p-5 border-4 uppercase font-black text-[12px] transition-all shadow-sm ${selectedSubTheme === st ? 'bg-yellow-500 text-black border-white scale-105' : 'bg-[#555] text-white border-[#333] hover:bg-[#666]'}`}>
                    {st}
                  </button>
                ))}
                {!isTheming && <button onClick={() => handleThemeSelect(selectedMainTheme)} className="p-5 bg-[#333] text-white border-4 border-[#555] hover:bg-black transition-colors"><RefreshCw size={20}/></button>}
              </div>
            </div>
          )}
        </div>
      )}

      {lastGeneratedPack.length > 0 && !isCooking && (
        <div className="mt-12 p-8 bg-indigo-900/50 border-8 border-indigo-400 animate-in slide-in-from-bottom-6 shadow-[20px_20px_0px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-8 border-b-2 border-indigo-400/30 pb-6">
                <div className="flex items-center gap-5">
                    <div className="bg-green-500 p-2 border-4 border-white animate-bounce"><CheckCircle2 className="text-white" size={32} /></div>
                    <div>
                        <span className="text-2xl text-white font-black uppercase tracking-tighter">Icon Pack Fully Brewed</span>
                        <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest">10 unique assets sliced from master sprite sheet</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => onImportToSmithy(lastGeneratedPack)}
                        className="px-8 py-4 bg-indigo-600 text-white border-4 border-white text-[12px] font-black uppercase flex items-center gap-3 hover:bg-indigo-500 shadow-xl active:scale-95 transition-all"
                    >
                        <ArrowRightCircle size={24}/> Forge All in Smithy
                    </button>
                    <button 
                        onClick={() => setLastGeneratedPack([])}
                        className="px-8 py-4 bg-red-950 text-white border-4 border-red-800 text-[12px] font-black uppercase hover:bg-red-800 transition-colors"
                    >
                        Empty Cauldron
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-6 custom-scrollbar">
                {lastGeneratedPack.map((item, idx) => (
                    <div key={idx} className="bg-black/40 border-4 border-white/10 p-4 flex flex-col items-center hover:border-indigo-400 transition-all cursor-help" title={item.prompt}>
                        <img src={item.previewUrl} className="w-20 h-20 object-contain pixelated mb-4 drop-shadow-xl" />
                        <span className="text-[8px] text-white/70 text-center uppercase font-black truncate w-full tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="mt-12 pt-10 border-t-8 border-[#555] grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
            <label className="text-[11px] font-black text-white uppercase tracking-widest block drop-shadow-sm">Aesthetic Refiner:</label>
            <div className="grid grid-cols-3 gap-3">
                {styleOptions.map(style => (
                    <button key={style} onClick={() => setSelectedStyle(style)} className={`text-[10px] py-3 border-4 uppercase font-black transition-all shadow-md ${selectedStyle === style ? 'bg-indigo-600 text-white border-white scale-105' : 'bg-[#333] text-white/50 border-black hover:text-white'}`}>
                        {style}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex flex-col justify-end">
            <button onClick={startCooking} className="w-full py-8 bg-[#4d2a7c] border-[12px] border-t-[#6b3fb4] border-l-[#6b3fb4] border-r-[#221338] border-b-[#221338] text-white text-2xl font-black uppercase tracking-[0.4em] shadow-[12px_12px_0px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all">
                Summon Full Pack
            </button>
            <p className="text-[10px] text-indigo-400 mt-6 font-black uppercase text-center italic tracking-widest">Generates: Bin (E/F), Start Button, Terminal, Control Pad, Network, Account, Folder & 3 Variants</p>
        </div>
      </div>
    </div>
  );
};
