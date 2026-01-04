
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Scissors, Upload, RefreshCw, ArrowRightCircle, Sparkles, Box, 
  Info, Image as ImageIcon, Hammer, Move, Maximize, Target, Eraser, Settings2 
} from 'lucide-react';
import { removeBgAndCenter } from '../utils/imageProcessor';
import { GeneratedPackItem } from '../types';
import { RetroTooltip } from './RetroTooltip';

interface CraftingTableProps {
  onImportToSmithy: (pack: GeneratedPackItem[]) => void;
  onError: (msg: string, fix: string) => void;
}

export const CraftingTable: React.FC<CraftingTableProps> = ({ onImportToSmithy, onError }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [gapX, setGapX] = useState(0);
  const [gapY, setGapY] = useState(0);
  const [cellWidth, setCellWidth] = useState(0);
  const [cellHeight, setCellHeight] = useState(0);
  
  const [isSlicing, setIsSlicing] = useState(false);
  const [slicedItems, setSlicedItems] = useState<GeneratedPackItem[]>([]);
  const [keepInternal, setKeepInternal] = useState(true);
  const [aggression, setAggression] = useState(80);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setSourceImage(url);
        const img = new Image();
        img.onload = () => {
          imgRef.current = img;
          // Initial guesses
          setCellWidth(Math.floor(img.width / cols));
          setCellHeight(Math.floor(img.height / rows));
          drawGrid();
        };
        img.src = url;
        setSlicedItems([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw Grid Overlay
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = Math.max(2, img.width / 500);
    ctx.setLineDash([10, 5]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * (cellWidth + gapX);
        const y = offsetY + r * (cellHeight + gapY);
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        
        // Cell Index
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, 20 * (img.width / 800), 20 * (img.width / 800));
        ctx.fillStyle = 'white';
        ctx.font = `${Math.floor(14 * (img.width / 800))}px Space Mono`;
        ctx.fillText(`${r},${c}`, x + 2, y + 14 * (img.width / 800));
      }
    }
  }, [rows, cols, offsetX, offsetY, gapX, gapY, cellWidth, cellHeight]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const startSlicing = async () => {
    if (!imgRef.current) return;
    setIsSlicing(true);
    try {
        const img = imgRef.current;
        const results: GeneratedPackItem[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = offsetX + c * (cellWidth + gapX);
                const y = offsetY + r * (cellHeight + gapY);
                
                const canvas = document.createElement('canvas');
                canvas.width = cellWidth;
                canvas.height = cellHeight;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, x, y, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
                
                const tempImg = new Image();
                tempImg.src = canvas.toDataURL('image/png');
                await new Promise(res => tempImg.onload = res);
                
                const cleanBlob = await removeBgAndCenter(tempImg, aggression, keepInternal);
                const cleanUrl = URL.createObjectURL(cleanBlob);
                results.push({ label: `Slot_${r}_${c}`, prompt: `Crafted`, blob: cleanBlob, previewUrl: cleanUrl });
            }
        }
        setSlicedItems(results);
    } catch (e) {
        onError("Crafting Fail", "Alignment logic error.");
    } finally {
        setIsSlicing(false);
    }
  };

  const ControlSlider = ({ label, value, min, max, onChange, icon: Icon }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[7px] font-black uppercase text-[#333]">
        <span className="flex items-center gap-1">{Icon && <Icon size={8}/>} {label}</span>
        <span>{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={e => onChange(+e.target.value)} 
        className="w-full h-1 bg-black/10 rounded-none accent-indigo-600 cursor-pointer"
      />
    </div>
  );

  return (
    <div className="bg-[#c6c6c6] border-8 border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] p-8 rounded-none shadow-2xl font-mono relative overflow-hidden">
      <div className="flex items-center gap-6 mb-8 border-b-4 border-[#555] pb-6">
          <div className="p-4 bg-[#4e2c0e] border-4 border-[#7a4b1e] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
            <Hammer className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-tighter italic">Crafting Table</h2>
            <p className="text-[10px] text-indigo-900 font-bold uppercase tracking-widest">Interactive Sprite Extraction Matrix</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="retro-panel p-2 flex flex-col items-center justify-center relative bg-black/60 border-4 min-h-[500px] overflow-hidden">
                {sourceImage ? (
                    <div className="relative w-full h-full flex items-center justify-center cursor-crosshair">
                        <canvas 
                            ref={canvasRef} 
                            className="max-w-full max-h-[600px] object-contain shadow-2xl pixelated"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center opacity-30 text-white p-20 text-center">
                        <Upload size={64} className="mb-6 animate-bounce" />
                        <p className="text-sm font-black uppercase tracking-widest">Input Raw Sprite Sheet</p>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>

            <div className="bg-[#8b8b8b] border-4 border-black p-4 grid grid-cols-2 md:grid-cols-3 gap-6 shadow-inner">
                <div className="space-y-4">
                    <h4 className="text-[8px] font-black uppercase border-b border-black/20 pb-1 flex items-center gap-1"><Maximize size={10}/> Grid Geometry</h4>
                    <ControlSlider label="Grid Rows" value={rows} min={1} max={20} onChange={setRows} />
                    <ControlSlider label="Grid Cols" value={cols} min={1} max={20} onChange={setCols} />
                    <ControlSlider label="Cell Width" value={cellWidth} min={10} max={imgRef.current?.width || 1024} onChange={setCellWidth} />
                    <ControlSlider label="Cell Height" value={cellHeight} min={10} max={imgRef.current?.height || 1024} onChange={setCellHeight} />
                </div>
                <div className="space-y-4">
                    <h4 className="text-[8px] font-black uppercase border-b border-black/20 pb-1 flex items-center gap-1"><Move size={10}/> Global Alignment</h4>
                    <ControlSlider label="X Offset" value={offsetX} min={-500} max={500} onChange={setOffsetX} icon={Move} />
                    <ControlSlider label="Y Offset" value={offsetY} min={-500} max={500} onChange={setOffsetY} icon={Move} />
                    <ControlSlider label="X Gap" value={gapX} min={-100} max={100} onChange={setGapX} />
                    <ControlSlider label="Y Gap" value={gapY} min={-100} max={100} onChange={setGapY} />
                </div>
                <div className="space-y-4">
                    <h4 className="text-[8px] font-black uppercase border-b border-black/20 pb-1 flex items-center gap-1"><Settings2 size={10}/> Extraction Prep</h4>
                    <div className="flex items-center justify-between p-2 bg-[#ccc] border border-black/20">
                        <span className="text-[7px] font-black uppercase">Alpha Scrub</span>
                        <button 
                            onClick={() => setKeepInternal(!keepInternal)}
                            className={`px-2 py-1 border text-[6px] font-black transition-all ${keepInternal ? 'bg-indigo-600 text-white' : 'bg-[#bbb]'}`}
                        >
                            {keepInternal ? 'KEEP_FILL' : 'WIPE_FILL'}
                        </button>
                    </div>
                    <ControlSlider label="Aggression" value={aggression} min={0} max={200} onChange={setAggression} icon={Target} />
                    <button 
                        onClick={startSlicing} 
                        disabled={isSlicing || !sourceImage} 
                        className="w-full win-btn bg-indigo-600 text-white py-4 gap-3 text-xs shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-1 transition-all"
                    >
                        {isSlicing ? <RefreshCw className="animate-spin" size={18}/> : <Scissors size={18}/>} EXTRACT_ALL
                    </button>
                </div>
            </div>
        </div>

        {/* Output Inventory */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">Output Inventory</h3>
                {slicedItems.length > 0 && (
                    <button onClick={() => onImportToSmithy(slicedItems)} className="win-btn bg-green-700 text-white px-4 py-2 gap-2 text-[8px] border-2 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        <ArrowRightCircle size={14}/> SMITHY_ALL
                    </button>
                )}
            </div>

            <div className="retro-inset bg-black/5 flex-1 min-h-[500px] p-4 overflow-y-auto custom-scrollbar border-4 shadow-inner">
                {slicedItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {slicedItems.map((item, idx) => (
                            <div key={idx} className="aspect-square bg-white border-2 border-black p-2 flex flex-col items-center justify-center transparent-checker group relative overflow-hidden shadow-md hover:scale-[1.05] transition-transform">
                                <img src={item.previewUrl} className="w-full h-full object-contain pixelated" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[5px] p-1 font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 p-10 text-center">
                        <Box size={80} className="mb-6" />
                        <p className="text-xs font-black uppercase">Crafting Inventory Empty</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
