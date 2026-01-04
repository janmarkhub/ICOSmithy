
import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="mb-10 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
          <Layers size={32} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          IconPro <span className="text-indigo-600">HD</span>
        </h1>
      </div>
      <p className="text-slate-500 max-w-md mx-auto flex items-center justify-center gap-1">
        <Sparkles size={16} className="text-amber-400" />
        Intelligent ICO to HD PNG Upscaler
      </p>
    </header>
  );
};
