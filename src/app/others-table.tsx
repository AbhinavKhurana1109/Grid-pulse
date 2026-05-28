
"use client";

import { GridCell } from "./cell";
import { Selection } from "@/app/page";

interface OthersTableProps {
  data: Record<string, number>;
  selection: Selection;
  onSelect: (key: string) => void;
}

export function OthersTable({ 
  data, 
  selection, 
  onSelect 
}: OthersTableProps) {
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  const getTotal = () => {
    return Object.values(data).reduce((acc, curr) => acc + curr, 0);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => {
          const cellKey = `O${row}`;
          const isSelected = selection?.table === "others" && selection.key === cellKey;
          return (
            <div key={cellKey} className="relative w-full h-8 md:h-10">
              <GridCell 
                index={`#${row}`}
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
      
      <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
        <span className="text-[8px] font-headline text-slate-400 uppercase tracking-widest font-bold block mb-1 text-center">Other Total</span>
        <span className="font-black text-primary font-headline tabular-nums leading-none block text-center text-xl">
          {getTotal().toLocaleString()}
        </span>
      </div>
    </div>
  );
}
