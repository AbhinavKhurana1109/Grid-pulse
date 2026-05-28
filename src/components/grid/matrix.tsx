"use client";

import { GridCell } from "./cell";
import { cn } from "@/lib/utils";
import { Selection } from "@/app/page";

interface MatrixProps {
  data: Record<number, number>;
  selection: Selection;
  onSelect: (key: string) => void;
}

export function Matrix({ data, selection, onSelect }: MatrixProps) {
  const rows = Array.from({ length: 10 }, (_, i) => i);
  const cols = Array.from({ length: 10 }, (_, i) => i);

  const getRowTotal = (rowIndex: number) => {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
      total += data[rowIndex * 10 + i] || 0;
    }
    return total;
  };

  const getGrandTotal = () => {
    return Object.values(data).reduce((acc, curr) => acc + curr, 0);
  };

  const getTotalFontSize = (val: number) => {
    const str = val.toLocaleString();
    const len = str.length;
    if (len > 12) return "text-[7px] md:text-[10px]";
    if (len > 9) return "text-[8px] md:text-[12px]";
    if (len > 6) return "text-[9px] md:text-[14px]";
    if (len > 3) return "text-[10px] md:text-[18px]";
    return "text-[12px] md:text-[20px]";
  };

  const getGrandTotalFontSize = (val: number) => {
    const str = val.toLocaleString();
    const len = str.length;
    if (len > 15) return "text-lg md:text-2xl";
    if (len > 10) return "text-xl md:text-3xl";
    if (len > 6) return "text-2xl md:text-4xl";
    return "text-3xl md:text-5xl";
  };

  return (
    <div className="w-full flex flex-col gap-4 items-center justify-start">
      <div className="grid grid-cols-[repeat(10,minmax(0,1fr))_minmax(0,1.2fr)] gap-0.5 md:gap-2 w-full">
        {cols.map((c) => (
          <div key={`h-${c}`} className="text-center text-[6px] md:text-[10px] font-headline text-slate-400 uppercase tracking-tighter pb-1 font-bold">
            C{c + 1}
          </div>
        ))}
        <div className="text-center text-[6px] md:text-[10px] font-headline text-secondary/60 uppercase tracking-tighter pb-1 font-bold">TOT</div>

        {rows.map((r) => (
          <div key={`row-${r}`} className="contents">
            {cols.map((c) => {
              const cellIdx = r * 10 + c + 1;
              const isSelected = selection?.table === "matrix" && selection.key === cellIdx.toString();
              return (
                <GridCell 
                  key={cellIdx} 
                  index={cellIdx} 
                  value={data[cellIdx] || 0} 
                  selected={isSelected}
                  onClick={() => onSelect(cellIdx.toString())}
                />
              );
            })}
            <div className="flex items-center justify-center font-headline font-black text-secondary bg-secondary/5 border border-secondary/10 rounded-full shadow-sm overflow-hidden px-0.5 aspect-square">
              <span className={cn("whitespace-nowrap tabular-nums leading-none", getTotalFontSize(getRowTotal(r)))}>
                {getRowTotal(r).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end w-full mt-2">
        <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[8px] md:text-[10px] font-headline text-slate-400 uppercase tracking-widest font-bold mb-0.5">Matrix Grand Total</span>
          <span className={cn("font-black text-primary font-headline tabular-nums tracking-tighter leading-none", getGrandTotalFontSize(getGrandTotal()))}>
            {getGrandTotal().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
