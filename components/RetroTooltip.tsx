
import React from 'react';

interface RetroTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const RetroTooltip: React.FC<RetroTooltipProps> = ({ title, description, children, position = 'top' }) => {
  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative group/tooltip inline-flex justify-center items-center">
      {children}
      <div className={`absolute ${posClasses[position]} z-[3000] opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 transform group-hover/tooltip:scale-100 scale-95 origin-center w-40`}>
        <div className="bg-[#ffffcc] border-2 border-black p-2 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <h5 className="text-[9px] font-black text-indigo-900 uppercase border-b border-black/10 pb-1 mb-1">
             {title}
          </h5>
          <p className="text-[7px] text-black font-bold leading-tight uppercase opacity-80">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
