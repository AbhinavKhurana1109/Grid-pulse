"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface GridCellProps {
  index: string | number;
  value: number;
  selected?: boolean;
  highlighted?: boolean;
  aspectSquare?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GridCell({ index, value, selected, highlighted, aspectSquare = true, className, onClick }: GridCellProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value !== 0 && value !== undefined) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const getFontSize = (val: number) => {
    const str = Math.abs(val).toLocaleString();
    const len = str.length;
    
    // Extra aggressive scaling to ensure fit
    if (len > 12) return "text-[6px] md:text-[7px]";
    if (len > 9) return "text-[7px] md:text-[8px]";
    if (len > 6) return "text-[8px] md:text-[10px]";
    if (len > 4) return "text-[9px] md:text-[12px]";
    if (len > 2) return "text-[10px] md:text-[14px]";
    return "text-[12px] md:text-[18px]";
  };

  const formattedIndex = (() => {
    const num = Number(index);
    if (!isNaN(num)) {
      if (num === 100) return "00";
      return String(num).padStart(2, "0");
    }
    return index;
  })();

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full flex items-center justify-center border border-slate-200 bg-white group transition-all duration-300 rounded-full shadow-sm overflow-hidden p-0.5 cursor-pointer transform-gpu active:scale-90",
        aspectSquare && "aspect-square",
        selected && "ring-4 ring-primary ring-offset-2 z-30 scale-110 border-primary shadow-xl -translate-y-1 bg-primary/5",
        highlighted && "ring-2 ring-primary bg-primary/5 z-20",
        pulse && "animate-cell-update z-10",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 hover:bg-slate-50",
        className
      )}
    >
      <span className="absolute top-[8%] text-[6px] md:text-[8px] font-headline text-black font-black leading-none pointer-events-none select-none z-10 opacity-60 group-hover:opacity-100 transition-opacity">
        {formattedIndex}
      </span>
      <div className={cn(
        "font-black font-headline transition-all text-center w-full leading-none whitespace-nowrap overflow-hidden tabular-nums flex items-center justify-center h-full pt-2 group-hover:scale-110",
        getFontSize(value || 0),
        value === 0 ? "text-slate-100" : "text-primary"
      )}>
        {value === 0 ? "0" : value.toLocaleString()}
      </div>
      
      {/* 3D Inner Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-100/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
    </div>
  );
}
