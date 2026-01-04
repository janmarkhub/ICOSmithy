
import React, { useState } from 'react';
import { Search, X, RefreshCw, Coffee, ArrowRightCircle, Package, Sparkles, Wand2 } from 'lucide-react';
import { getPackRecommendations, getSubThemes, generatePackPrompts, generateIconGrid } from '../utils/aiVision';
import { removeBgAndCenter } from '../utils/imageProcessor';
import { GeneratedPackItem } from '../types';
import { RetroTooltip } from './RetroTooltip';

interface CauldronProps {
  onPackGenerated: (pack: GeneratedPackItem[]) => void;
  onImportToSmithy: (pack: GeneratedPackItem[]) => void;
  onError: (msg: string, fix: string) => void;
}

export const Cauldron: React.FC<CauldronProps> = ({ onPackGenerated, onImportToSmithy, onError }) => {
  const [activePath, setActivePath] = useState<'source' | 'theme'>('source');
  const [fetchFrom, setFetchFrom] = useState('');
  const [whichFrom, setWhichFrom] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Default Pixel');
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
    if (!fetchFrom.trim()) return onError("Ingredient Missing", "You must specify a source (e.g. 'Star Wars') before the AI can research it.");
    setIsRecommending(true);
    try {
      const recs = await getPackRecommendations(fetchFrom);
      setRecommendations(recs);
      if (recs.length > 0) setWhichFrom(recs[0]);
    } catch (e) {
      onError("Cauldron Instability", "Check your connection or try a different IP source.");
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
      onError("Theme Vision Blurry", "Could not distill the essence of this theme. Try again.");
    } finally {
      setIsTheming(false);
    }
  };

  const startCooking = async () => {
    const source = activePath === 'source' ? fetchFrom : selectedMainTheme;
    const category = activePath === 'source' ? whichFrom : selectedSubTheme;
    if (!source || !category) return onError("Recipe Incomplete", "Specify your primary and sub-theme ingredients first.");
    
    setIsCooking(true); setCookProgress(5); setCookMessage("Researching visual archetypes via Google Search...");
    try {
      // Step 1: Research and Metadata
      const { items, masterPrompt } = await generatePackPrompts(source, category, selectedStyle);
      setCookProgress(20); setCookMessage("Summoning Sprite Sheet...");
      
      // Step 2: Image Generation (Sprite Sheet)
      const gridDataUrl = await generateIconGrid(masterPrompt);
      setCookProgress(60); setCookMessage("Slicing, Centering & Alpha Scrubbing...");
      
      // Step 3: Precise Slicing (5x2 Grid)
      const masterImg = new Image();
      await new Promise(res => { masterImg.onload = res; masterImg.src = gridDataUrl; });
      
      const results: GeneratedPackItem[] = [];
      const cols = 5; const rows = 2;
      const cellW = masterImg.width / cols; const cellH = masterImg.height / rows;
      
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = 512; sliceCanvas.height = 512;
      const sctx = sliceCanvas.getContext('2d')!;
      
      for (let i = 0; i < 10; i++) {
        const r = Math.floor(i / cols); const c = i % cols;
        sctx.clearRect(0, 0, 512, 512);
        // Add padding to raw slice to help centerer
        sctx.drawImage(masterImg, c * cellW, r * cellH, cellW, cellH, 64, 64, 384, 384);
        
        const intermediate = new Image();
        intermediate.src = sliceCanvas.toDataURL('image/png');
        await new Promise(res => intermediate.onload = res);
        
        const cleanBlob = await removeBgAndCenter(intermediate);
        const cleanUrl = URL.createObjectURL(cleanBlob);
        
        results.push({ 
            label: items[i]?.label || `Icon ${i+1}`, 
            prompt: `Single centered icon: ${items[i]?.label} themed for ${source}`, 
            blob: cleanBlob, 
            previewUrl: cleanUrl 
        });
        setCookProgress(60 + (i / 10) * 40);
      }
      setLastGeneratedPack(results);
      onPackGenerated(results);
      setCookMessage("Brewing Complete!");
    } catch (e) {
      onError("Cauldron Overload", "Batch generation failed. The spirits are restless. Try a simpler prompt.");
    } finally {
      setTimeout(() => setIsCooking(false), 1000);
    }
  };

  return (
    <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-12 rounded-sm shadow-2xl relative">
      {isCooking && (
        <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-14 text-center">
          <Coffee size={100} className="text-indigo-400 animate-cauldron-mix mb-10" />
          <p className="text-white font-black uppercase tracking-[0.6em] animate-pulse mb-10 text-xl">{cookMessage}</p>
          <div className="w-full max-w-2xl h-8 bg-[#333] border-4 border-white p-1.5 shadow-2xl">
            <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${cookProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-12 border-b-4 border-[#555] pb-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-indigo-900 border-4 border-indigo-400 shadow-[8px_8px_0_rgba(0,0,0,0.4)]">
            <Package className="text-indigo-200" size={48} />
          </div>
          <div>
            <h2 className="text-5xl font-black uppercase text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] tracking-tighter italic">The Cauldron</h2>
            <p className="text-xs text-[#555] font-black tracking-widest uppercase mt-1">Grounding Research & Precise Slicing Engine</p>
          </div>
        </div>
        <div className="flex gap-4">
           <RetroTooltip title="Grounded Source" description="Brew icons based on real IPs or fictional universes. Gemini will research the visual lore first." position="bottom">
             <button onClick={() => setActivePath('source')} className={`px-10 py-4 text-[12px] font-black uppercase border-4 transition-all shadow-md ${activePath === 'source' ? 'bg-[#555] text-white border-white scale-105' : 'bg-[#8b8b8b] text-[#333] border-transparent hover:bg-[#999]'}`}>Source Mode</button>
           </RetroTooltip>
           <RetroTooltip title="Abstract Vibe" description="Brew icons based on stylistic themes like 'Retro 80s' or 'Corporate Neon'." position="bottom">
             <button onClick={() => setActivePath('theme')} className={`px-10 py-4 text-[12px] font-black uppercase border-4 transition-all shadow-md ${activePath === 'theme' ? 'bg-[#555] text-white border-white scale-105' : 'bg-[#8b8b8b] text-[#333] border-transparent hover:bg-[#999]'}`}>Theme Mode</button>
           </RetroTooltip>
        </div>
      </div>

      {activePath === 'source' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-4 space-y-4">
            <label className="text-[12px] font-black text-white uppercase tracking-widest block drop-shadow-sm">IP Ingredient:</label>
            <div className="relative">
              <input type="text" value={fetchFrom} onChange={e => setFetchFrom(e.target.value)} placeholder="e.g. Zelda Breath of the Wild" className="w-full bg-[#333] border-4 border-[#555] p-6 text-sm text-white uppercase font-black outline-none focus:bg-black transition-all" />
              <Search className="absolute right-6 top-6 text-white/30" size={24} />
            </div>
          </div>
          <div className="md:col-span-2">
            <RetroTooltip title="Perform Research" description="Scours the digital world for accurate visual descriptions before brewing begins.">
              <button onClick={handleSourceRecs} disabled={isRecommending} className="w-full py-6 bg-indigo-600 border-4 border-white/20 text-white text-[13px] font-black uppercase hover:bg-indigo-500 disabled:opacity-50 shadow-xl flex items-center justify-center">
                {isRecommending ? <RefreshCw className="animate-spin" size={24} /> : "Scan Lore"}
              </button>
            </RetroTooltip>
          </div>
          <div className="md:col-span-4 space-y-4">
            <label className="text-[12px] font-black text-white uppercase tracking-widest block drop-shadow-sm">Focused Sub-Set:</label>
            <div className="flex gap-2">
              {recommendations.length > 0 ? (
                <select value={whichFrom} onChange={e => setWhichFrom(e.target.value)} className="smith-select flex-1 bg-[#333] border-4 border-indigo-400 p-5 text-sm text-white uppercase font-black outline-none cursor-pointer">
                  {recommendations.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input type="text" value={whichFrom} onChange={e => setWhichFrom(e.target.value)} placeholder="e.g. Shield & Sword" className="w-full bg-[#333] border-4 border-[#555] p-6 text-sm text-white uppercase font-black outline-none" />
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <RetroTooltip title="Experimental Brew" description="Instantly loads 'Starfield Items' to test the research grounding system.">
              <button onClick={() => { setFetchFrom("Starfield Items"); handleSourceRecs(); }} className="w-full py-6 bg-yellow-600 border-4 border-white/20 text-black text-[13px] font-black uppercase hover:bg-yellow-500 active:scale-95 transition-all shadow-xl">Surprise</button>
            </RetroTooltip>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-4 gap-6">
            {mainThemes.map(t => (
              <RetroTooltip key={t} title={t} description={`Select the ${t} foundation for your icon pack.`}>
                <button onClick={() => handleThemeSelect(t)} className={`p-10 border-4 uppercase font-black text-xl tracking-tighter transition-all shadow-lg w-full ${selectedMainTheme === t ? 'bg-indigo-600 text-white border-white scale-105' : 'bg-[#8b8b8b] text-[#333] border-[#555] hover:bg-[#aaa]'}`}>{t}</button>
              </RetroTooltip>
            ))}
          </div>
          {selectedMainTheme && (
            <div className="animate-in slide-in-from-top-6 duration-500">
              <label className="text-[12px] font-black text-white uppercase tracking-widest block mb-6">Distilled Essence:</label>
              <div className="grid grid-cols-4 gap-6">
                {subThemes.map(st => (
                  <RetroTooltip key={st} title={st} description={`A specific subset of the ${selectedMainTheme} aesthetic.`}>
                    <button onClick={() => setSelectedSubTheme(st)} className={`p-6 border-4 uppercase font-black text-[12px] transition-all shadow-md w-full ${selectedSubTheme === st ? 'bg-yellow-500 text-black border-white scale-105' : 'bg-[#555] text-white border-[#333] hover:bg-[#666]'}`}>{st}</button>
                  </RetroTooltip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {lastGeneratedPack.length > 0 && !isCooking && (
        <div className="mt-14 p-10 bg-indigo-900/40 border-8 border-indigo-400 animate-in slide-in-from-bottom-8 shadow-[24px_24px_0_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-10 border-b-2 border-indigo-400/30 pb-8">
                <div>
                    <span className="text-3xl text-white font-black uppercase tracking-tighter italic">Loot Box Manifest</span>
                    <p className="text-xs text-indigo-200 uppercase font-black mt-2 tracking-widest flex items-center gap-2"><Sparkles size={14}/> 10 Alpha-Scrubbed Assets Generated</p>
                </div>
                <div className="flex gap-4">
                    <RetroTooltip title="Reforge in Smithy" description="Permanently imports these icons into your loot chest for batch upscaling and enchanting.">
                      <button onClick={() => onImportToSmithy(lastGeneratedPack)} className="px-10 py-5 bg-indigo-600 text-white border-4 border-white text-[14px] font-black uppercase flex items-center gap-4 hover:bg-indigo-500 shadow-2xl active:scale-95 transition-all"><ArrowRightCircle size={28}/> Smelt All</button>
                    </RetroTooltip>
                    <RetroTooltip title="Empty Vat" description="Wipes these results and cleans the cauldron for the next batch.">
                      <button onClick={() => setLastGeneratedPack([])} className="px-10 py-5 bg-red-950 text-white border-4 border-red-800 text-[14px] font-black uppercase hover:bg-red-800 transition-colors">Discard</button>
                    </RetroTooltip>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-6">
                {lastGeneratedPack.map((item, idx) => (
                    <div key={idx} className="bg-black/50 border-4 border-white/10 p-5 flex flex-col items-center hover:border-indigo-400 transition-all cursor-help relative group" title={item.prompt}>
                        <div className="w-24 h-24 transparent-checker border-2 border-white/10 p-2 mb-4 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                            <img src={item.previewUrl} className="w-full h-full object-contain pixelated" />
                        </div>
                        <span className="text-[9px] text-white/80 text-center uppercase font-black truncate w-full tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="mt-14 pt-12 border-t-8 border-[#555] grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-8">
            <label className="text-[12px] font-black text-white uppercase tracking-widest block">Style Catalyst:</label>
            <div className="grid grid-cols-3 gap-4">
                {styleOptions.map(style => (
                    <RetroTooltip key={style} title={style} description={`Forces the cauldron to output ${style} icons.`}>
                      <button onClick={() => setSelectedStyle(style)} className={`text-[11px] py-4 border-4 uppercase font-black transition-all w-full shadow-md ${selectedStyle === style ? 'bg-indigo-600 text-white border-white scale-105' : 'bg-[#333] text-white/50 border-black hover:text-white'}`}>{style}</button>
                    </RetroTooltip>
                ))}
            </div>
        </div>
        <div className="flex flex-col justify-end">
            <RetroTooltip title="Summon Pack" description="The ultimate forge action. Triggers research, generation, slicing, and centering for 10 unique assets." position="top">
              <button onClick={startCooking} className="w-full py-10 bg-[#4d2a7c] border-[14px] border-t-[#6b3fb4] border-l-[#6b3fb4] border-r-[#221338] border-b-[#221338] text-white text-3xl font-black uppercase tracking-[0.5em] shadow-[16px_16px_0_rgba(0,0,0,0.6)] hover:brightness-125 hover:scale-[1.01] active:scale-95 transition-all">Summon Pack</button>
            </RetroTooltip>
            <p className="text-[11px] text-indigo-400 mt-8 font-black uppercase text-center italic tracking-widest drop-shadow-sm"><Wand2 size={16} className="inline mr-2 mb-1"/> Precision 5x2 Sprite Slicing Active</p>
        </div>
      </div>
    </div>
  );
};
