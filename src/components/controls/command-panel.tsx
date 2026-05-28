
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Save, 
  Trash2, 
  Plus, 
  Camera, 
  LayoutGrid, 
  Table2, 
  History, 
  Check, 
  X, 
  Eraser, 
  MoreHorizontal,
  Users,
  Brain,
  Layers
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Selection, ActiveTab } from "@/app/page";
import { cn } from "@/lib/utils";

interface CommandPanelProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  onUpdate: (table: "matrix" | "side" | "others", key: string, value: number, mode: "add" | "set") => void;
  onClearCell: (table: "matrix" | "side" | "others", key: string) => void;
  onClearAll: () => void;
  onSave: () => void;
  onSaveSnapshot: (name: string) => void;
  onScreenshot: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  clientName?: string;
}

export function CommandPanel({ 
  activeTab,
  setActiveTab,
  selection, 
  setSelection, 
  onUpdate, 
  onClearCell,
  onClearAll, 
  onSave, 
  onSaveSnapshot, 
  onScreenshot,
  onAnalyze,
  isAnalyzing,
  clientName,
}: CommandPanelProps) {
  const [cellKey, setCellKey] = useState("");
  const [val, setVal] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const valRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selection) {
      setCellKey(selection.key);
      valRef.current?.focus();
    } else if (activeTab === "matrix" || activeTab === "side" || activeTab === "clients") {
      inputRef.current?.focus();
    }
  }, [selection, activeTab]);

  const handleTabChange = (v: string) => {
    const tab = v as ActiveTab;
    setActiveTab(tab);
    setCellKey("");
    setSelection(null); 
  };

  const handleSubmit = (e: React.FormEvent, mode: "add" | "set" = "add") => {
    e.preventDefault();
    const v = parseInt(val);
    if (isNaN(v)) return;

    let success = false;
    if (selection) {
      onUpdate(selection.table, selection.key, v, mode);
      success = true;
    } else {
      if (activeTab === "matrix" || activeTab === "clients") {
        const idx = parseInt(cellKey);
        if (!isNaN(idx) && idx >= 1 && idx <= 100) {
          onUpdate("matrix", idx.toString(), v, mode);
          success = true;
        }
      } else if (activeTab === "side") {
        const match = cellKey.toUpperCase().match(/^([AB])([1-9]|10)$/);
        if (match) {
          onUpdate("side", cellKey.toUpperCase(), v, mode);
          success = true;
        }
      }
    }

    if (success) {
      if (!selection) setCellKey("");
      setVal("");
      setSelection(null);
      if (activeTab === "matrix" || activeTab === "side" || activeTab === "clients") {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (snapshotName.trim()) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName("");
      setIsSnapshotOpen(false);
    }
  };

  const isMasterTab = activeTab === "master";
  const showManualEntry = (selection || activeTab === "matrix" || activeTab === "side" || activeTab === "clients") && !isMasterTab;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] no-print">
      <div className="max-w-screen-xl mx-auto flex flex-col items-center justify-center gap-3 px-1 sm:px-4">
        
        {selection ? (
          <div className="flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-2xl border border-primary/20 shadow-sm animate-in slide-in-from-bottom-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {clientName ? `Editing ${clientName}` : 'Editing Box'}
            </span>
            <span className="text-sm font-black text-slate-800 uppercase tabular-nums">
              {selection.table} {selection.key}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 rounded-full" onClick={() => setSelection(null)}>
              <X className="h-3.5 w-3.5 text-primary" />
            </Button>
          </div>
        ) : (
          <div className="w-full flex justify-start sm:justify-center overflow-x-auto no-scrollbar py-1">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="shrink-0">
              <TabsList className="bg-slate-100 p-1 h-10 md:h-11 rounded-[1.25rem] flex whitespace-nowrap">
                <TabsTrigger value="matrix" className="rounded-xl px-4 gap-2 font-bold flex-1 text-xs md:text-sm"><LayoutGrid className="w-3.5 h-3.5" /> Matrix</TabsTrigger>
                <TabsTrigger value="side" className="rounded-xl px-4 gap-2 font-bold flex-1 text-xs md:text-sm"><Table2 className="w-3.5 h-3.5" /> Side</TabsTrigger>
                <TabsTrigger value="others" className="rounded-xl px-4 gap-2 font-bold flex-1 text-xs md:text-sm"><MoreHorizontal className="w-3.5 h-3.5" /> Others</TabsTrigger>
                <TabsTrigger value="clients" className="rounded-xl px-4 gap-2 font-bold flex-1 text-xs md:text-sm"><Users className="w-3.5 h-3.5" /> Clients</TabsTrigger>
                <TabsTrigger value="master" className="rounded-xl px-4 gap-2 font-bold flex-1 text-xs md:text-sm"><Layers className="w-3.5 h-3.5" /> Master</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="w-full flex flex-col items-center justify-center gap-3">
          {showManualEntry && (
            <form onSubmit={(e) => handleSubmit(e, selection ? "set" : "add")} className="flex items-center gap-2 transform-gpu transition-all">
              {!selection && (
                <Input 
                  ref={inputRef}
                  type="text"
                  placeholder={activeTab === "side" ? "A1" : "Box"} 
                  className="w-16 sm:w-24 h-11 border-slate-200 focus:ring-primary/20 text-sm font-black rounded-xl"
                  value={cellKey}
                  onChange={(e) => setCellKey(e.target.value)}
                  required
                />
              )}
              <Input 
                ref={valRef}
                type="number" 
                placeholder="Value" 
                className="w-16 sm:w-24 h-11 border-slate-200 focus:ring-primary/20 text-sm font-black rounded-xl"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                required
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-black h-11 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                {selection ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="text-xs">{selection ? 'Set' : 'Add'}</span>
              </Button>
              {selection && (
                <Button variant="outline" onClick={() => onClearCell(selection.table, selection.key)} className="h-11 border-slate-200 text-destructive font-black rounded-xl hover:bg-destructive/5 px-3">
                  <Eraser className="w-4 h-4" />
                </Button>
              )}
            </form>
          )}

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-2 w-full justify-start sm:justify-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onAnalyze} 
              disabled={isAnalyzing}
              className="h-10 w-10 border-slate-200 text-primary hover:bg-primary/5 rounded-xl shrink-0"
            >
              <Brain className={cn("w-4 h-4", isAnalyzing && "animate-pulse")} />
            </Button>

            {!isMasterTab && (
              <Button variant="outline" size="icon" onClick={onSave} className="h-10 w-10 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shrink-0">
                <Save className="w-4 h-4" />
              </Button>
            )}

            {(activeTab === "matrix" || activeTab === "side") && (
              <Dialog open={isSnapshotOpen} onOpenChange={setIsSnapshotOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shrink-0">
                    <History className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem]">
                  <DialogHeader><DialogTitle className="text-xl font-headline font-bold">New Snapshot</DialogTitle></DialogHeader>
                  <form onSubmit={handleSnapshotSubmit} className="space-y-6 py-4">
                    <Input placeholder="Identifier (e.g. Final Copy)" value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} className="h-12 rounded-xl font-bold" autoFocus required />
                    <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary text-white">Save Snapshot</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <Button variant="outline" size="icon" onClick={onScreenshot} className="h-10 w-10 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shrink-0">
              <Camera className="w-4 h-4" />
            </Button>
            
            {!isMasterTab && (
              <Button variant="ghost" size="icon" onClick={onClearAll} className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
