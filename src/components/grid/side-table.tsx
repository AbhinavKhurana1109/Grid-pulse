"use client";

import { GridCell } from "./cell";
import { cn } from "@/lib/utils";
import { Selection } from "@/app/page";

interface SideTableProps {
  data: Record<string, number>;
  selection: Selection;
  onSelect: (key: string) => void;
}

export function SideTable({ data, selection, onSelect }: SideTableProps) {
  const columns = ["A", "B"];
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  const getColTotal = (col: string) => {
    return rows.reduce((acc, row) => acc + (data[`${col}${row}`] || 0), 0);
  };

  const getSideTotalFontSize = (val: number) => {
    const str = val.toLocaleString();
    const len = str.length;
    if (len > 15) return "text-[10px]";
    if (len > 12) return "text-xs";
    if (len > 10) return "text-sm";
    return "text-base";
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-2 gap-1 md:gap-2">
        {columns.map((col) => (
          <div key={col} className="text-center text-[8px] md:text-[10px] font-headline text-slate-400 uppercase tracking-widest font-bold pb-1">
            Col {col}
          </div>
        ))}
        {rows.map((row) => (
          <div key={`row-${row}`} className="contents">
            {columns.map((col) => {
              const cellKey = `${col}${row}`;
              const isSelected = selection?.table === "side" && selection.key === cellKey;
              return (
                <div key={cellKey} className="relative w-full h-8 md:h-10">
                   <GridCell 
                    index={row}
                    value={data[cellKey] || 0}
                    aspectSquare={false}
                    selected={isSelected}
                    onClick={() => onSelect(cellKey)}
                    className="h-full rounded-xl"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-right">
            <span className="text-[6px] md:text-[8px] font-headline text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Total A</span>
            <span className={cn(
              "font-black text-primary font-headline tabular-nums leading-none block",
              getSideTotalFontSize(getColTotal("A"))
            )}>
              {getColTotal("A").toLocaleString()}
            </span>
          </div>
          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-right">
            <span className="text-[6px] md:text-[8px] font-headline text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Total B</span>
            <span className={cn(
              "font-black text-secondary font-headline tabular-nums leading-none block",
              getSideTotalFontSize(getColTotal("B"))
            )}>
              {getColTotal("B").toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
