
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="mb-8 text-center pt-4">
      <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] [text-shadow:4px_4px_0_#555]">
        ICO<span className="text-indigo-400">Smithy</span>
      </h1>
      <p className="text-[#AAAAAA] text-xs font-mono uppercase mt-2 tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
        Win 11 Icon Crafting
      </p>
    </header>
  );
};
