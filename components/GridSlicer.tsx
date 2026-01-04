
import React, { useState, useRef } from 'react';
import { Scissors, Upload, RefreshCw, ArrowRightCircle, Sparkles, Box, Info, Image as ImageIcon } from 'lucide-react';
import { removeBgAndCenter } from '../utils/imageProcessor';
import { GeneratedPackItem } from '../types';
import { RetroTooltip } from './RetroTooltip';
import { GoogleGenAI, Type } from "@google/genai";

interface GridSlicerProps {
  onImportToSmithy: (pack: GeneratedPackItem[]) => void;
  onError: (msg: string, fix: string) => void;
}

export const GridSlicer: React.FC<GridSlicerProps> = ({ onImportToSmithy, onError }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [isSlicing, setIsSlicing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [slicedItems, setSlicedItems] = useState<GeneratedPackItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string);
        setSlicedItems([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSmartScan = async () => {
    if (!sourceImage) return onError("Visuals Missing", "Upload a grid image first.");
    setIsScanning(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                { text: "Analyze this image containing multiple icons. Estimate the number of rows and columns in the grid. Return only JSON: { 'rows': number, 'cols': number }." },
                { inlineData: { mimeType: "image/png", data: sourceImage.split(',')[1] } }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rows: { type: Type.NUMBER },
                        cols: { type: Type.NUMBER }
                    },
                    required: ["rows", "cols"]
                }
            }
        });
        const result = JSON.parse(response.text || '{}');
        if (result.rows) setRows(result.rows);
        if (result.cols) setCols(result.cols);
    } catch (e) {
        console.error("AI Scan failed", e);
        onError("AI Scanner Offline", "The vision model couldn't estimate the grid. Manual input required.");
    } finally {
        setIsScanning(false);
    }
  };

  const startSlicing = async () => {
    if (!sourceImage) return;
    setIsSlicing(true);
    try {
        const img = new Image();
        img.src = sourceImage;
        await new Promise(res => img.onload = res);

        const results: GeneratedPackItem[] = [];
        const cellW = img.width / cols;
        const cellH = img.height / rows;

        const canvas = document.createElement('canvas');
        canvas.width = 1024; 
        canvas.height = 1024;
        const ctx = canvas.getContext('2d')!;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                ctx.clearRect(0, 0, 1024, 1024);
                ctx.drawImage(img, c * cellW, r * cellH, cellW, cellH, 0, 0, 1024, 1024);
                
                const intermediate = new Image();
                intermediate.src = canvas.toDataURL('image/png');
                await new Promise(res => intermediate.onload = res);
                
                const cleanBlob = await removeBgAndCenter(intermediate);
                const cleanUrl = URL.createObjectURL(cleanBlob);
                
                results.push({
                    label: `Extracted_${r}_${c}`,
                    prompt: `Sliced R${r} C${c}`,
                    blob: cleanBlob,
                    previewUrl: cleanUrl
                });
            }
        }
        setSlicedItems(results);
    } catch (e) {
        onError("Slicer Error", "Grid extraction failed. Ensure rows/cols match the image.");
    } finally {
        setIsSlicing(false);
    }
  };

  return (
    <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-8 rounded-sm shadow-2xl">
      <div className="flex items-center gap-6 mb-8 border-b-4 border-[#555] pb-6">
          <div className="p-4 bg-indigo-900 border-4 border-indigo-400">
            <Scissors className="text-indigo-200" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-tighter italic">Grid Slicer</h2>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="retro-panel p-6 min-h-[300px] flex flex-col items-center justify-center relative bg-black/40">
                {sourceImage ? (
                    <img src={sourceImage} className="max-w-full max-h-[400px] object-contain shadow-2xl pixelated" />
                ) : (
                    <div className="flex flex-col items-center opacity-30">
                        <Upload size={48} className="mb-4" />
                        <p className="text-[10px] font-black uppercase">Drop Sprite Sheet</p>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-800">Rows:</label>
                    <input type="number" value={rows} onChange={e => setRows(+e.target.value)} className="retro-inset w-full p-3 font-black text-center text-black bg-white border-2 border-black" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-800">Cols:</label>
                    <input type="number" value={cols} onChange={e => setCols(+e.target.value)} className="retro-inset w-full p-3 font-black text-center text-black bg-white border-2 border-black" />
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={handleSmartScan} disabled={isScanning || !sourceImage} className="win-btn flex-1 bg-indigo-600 text-white py-4 gap-2">
                    {isScanning ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Smart Scan
                </button>
                <button onClick={startSlicing} disabled={isSlicing || !sourceImage} className="win-btn flex-1 bg-[#555] text-white py-4 gap-2">
                    {isSlicing ? <RefreshCw className="animate-spin" size={16}/> : <Scissors size={16}/>} Extract All
                </button>
            </div>
            
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full win-btn bg-white text-black py-4 border-black border-2 gap-2"
            >
                <ImageIcon size={16}/> Upload Image
            </button>
        </div>

        <div className="space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Box size={14}/> Slices</h3>
                {slicedItems.length > 0 && (
                    <button onClick={() => onImportToSmithy(slicedItems)} className="win-btn bg-green-700 text-white px-6 gap-2">
                        <ArrowRightCircle size={16}/> Import to Smithy
                    </button>
                )}
            </div>

            <div className="retro-inset bg-white/10 flex-1 min-h-[400px] p-4 overflow-y-auto custom-scrollbar">
                {slicedItems.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                        {slicedItems.map((item, idx) => (
                            <div key={idx} className="aspect-square bg-black/40 border border-white/10 p-2 flex items-center justify-center transparent-checker group relative overflow-hidden">
                                <img src={item.previewUrl} className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <Info size={48} className="mb-4" />
                        <p className="text-[10px] font-black uppercase text-center">No slices yet.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
