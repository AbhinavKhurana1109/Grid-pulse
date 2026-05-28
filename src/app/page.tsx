
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Matrix } from "@/components/grid/matrix";
import { SideTable } from "@/components/grid/side-table";
import { CommandPanel } from "@/components/controls/command-panel";
import { SavedSheetsList } from "@/components/grid/saved-sheets-list";
import { ClientManager, ClientManagerRef } from "@/components/clients/client-manager";
import { auth, db } from "@/lib/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { doc, onSnapshot, setDoc, addDoc, collection, query, orderBy, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';
import { AuthButton } from "@/components/auth/auth-button";
import { summarizeGridTrends, SummarizeGridTrendsOutput } from "@/ai/flows/ai-summarize-grid-trends";
import { InsightPanel } from "@/components/ai/insight-panel";
import { Users, Layers, TrendingUp, ArrowRight, ShieldCheck, Calculator, PlusSquare, ClipboardPaste, Plus, Settings2, ArrowRightLeft, Info, Brain, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, addDays, isAfter, isBefore, startOfDay, parse } from "date-fns";

export type Selection = {
  table: "matrix" | "side" | "others";
  key: string;
} | null;

export type ActiveTab = "matrix" | "side" | "others" | "clients" | "master";

export interface ClientData {
  id: string;
  name: string;
  partnership: number;
  commission: number;
  claim?: number;
  createdAt: string;
}

export default function GridPulseDashboard() {
  const [gridData, setGridData] = useState<Record<number, number>>({});
  const [secondaryData, setSecondaryData] = useState<Record<string, number>>({});
  const [clients, setClients] = useState<ClientData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [localUpdateTrigger, setLocalUpdateTrigger] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>("matrix");
  const [activeClientName, setActiveClientName] = useState<string | undefined>(undefined);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const [dateInput, setDateInput] = useState(dateKey);

  // 2 Months (60 days) limit
  const maxHistoryDate = startOfDay(subDays(new Date(), 60));
  const today = startOfDay(new Date());

  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<SummarizeGridTrendsOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isFillOpen, setIsFillOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [fillStart, setFillStart] = useState("1");
  const [fillEnd, setFillEnd] = useState("100");
  const [fillValue, setFillValue] = useState("");
  const [fillMode, setFillMode] = useState<"add" | "set">("add");
  const [pasteInput, setPasteInput] = useState("");
  
  const clientManagerRef = useRef<ClientManagerRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    setDateInput(dateKey);
  }, [dateKey]);

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const target = startOfDay(date);
    if (isBefore(target, maxHistoryDate)) {
      setSelectedDate(maxHistoryDate);
      toast({ title: "History Limit", description: "Records beyond 2 months are archived." });
    } else if (isAfter(target, today)) {
      setSelectedDate(today);
    } else {
      setSelectedDate(target);
    }
  };

  const handleManualDateEntry = (val: string) => {
    setDateInput(val);
    if (val.length === 10) {
      try {
        const parsed = parse(val, 'yyyy-MM-dd', new Date());
        if (!isNaN(parsed.getTime())) {
          handleDateChange(parsed);
        }
      } catch (e) {
        console.error("Error parsing manual date entry:", e);
      }
    }
  };

  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;
    let unsubClients: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) unsubSnapshot();
      if (unsubClients) unsubClients();

      if (user) {
        setUserId(user.uid);
        
        const gridRef = doc(db, "grids", user.uid, "dailySheets", dateKey);
        unsubSnapshot = onSnapshot(gridRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setGridData(data.cells || {});
            setSecondaryData(data.secondaryCells || {});
          } else {
            setGridData({});
            setSecondaryData({});
          }
        }, (error) => {
          console.error("onSnapshot error in dailySheets:", error);
          if (error.code === "permission-denied") {
            errorEmitter.emit("permission-error", new FirestorePermissionError({
              path: `grids/${user.uid}/dailySheets/${dateKey}`,
              operation: "get"
            }));
          }
        });

        const q = query(collection(db, "grids", user.uid, "clients"), orderBy("createdAt", "desc"));
        unsubClients = onSnapshot(q, (snap) => {
          setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)));
        }, (error) => {
          console.error("onSnapshot error in clients list:", error);
          if (error.code === "permission-denied") {
            errorEmitter.emit("permission-error", new FirestorePermissionError({
              path: `grids/${user.uid}/clients`,
              operation: "list"
            }));
          }
        });

      } else {
        setUserId(null);
        const localGrid = localStorage.getItem(`gridpulse_local_grid_${dateKey}`);
        const localSide = localStorage.getItem(`gridpulse_local_side_${dateKey}`);
        setGridData(localGrid ? JSON.parse(localGrid) : {});
        setSecondaryData(localSide ? JSON.parse(localSide) : {});
        
        const localClients = localStorage.getItem("gridpulse_local_clients");
        setClients(localClients ? JSON.parse(localClients) : []);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
      if (unsubClients) unsubClients();
    };
  }, [localUpdateTrigger, dateKey]);

  // Master Aggregation
  const [masterData, setMasterData] = useState<{ cells: Record<number, number>; secondaryCells: Record<string, number> }>({ cells: {}, secondaryCells: {} });
  const [masterNetValue, setMasterNetValue] = useState(0);

  useEffect(() => {
    if (activeTab !== "master") return;

    const fetchMasterAggregates = async () => {
      let aggregatedCells: Record<number, number> = {};
      let aggregatedSecondary: Record<string, number> = {};
      let totalNet = 0;

      for (const client of clients) {
        let cCells: Record<number, number> = {};
        let cSide: Record<string, number> = {};
        let cClaim = 0;
        let cCommission = client.commission || 0;
        let cPartnership = client.partnership || 0;

        if (userId) {
          const sheetDoc = await getDoc(doc(db, "grids", userId, "clients", client.id, "dailySheets", dateKey));
          if (sheetDoc.exists()) {
            const d = sheetDoc.data();
            cCells = d.cells || {};
            cSide = d.secondaryCells || {};
            cClaim = d.claim || 0;
          }
        } else {
          const lCells = localStorage.getItem(`gridpulse_local_client_${client.id}_grid_${dateKey}`);
          const lSide = localStorage.getItem(`gridpulse_local_client_${client.id}_side_${dateKey}`);
          const lClaim = localStorage.getItem(`gridpulse_local_client_${client.id}_claim_${dateKey}`);
          if (lCells) cCells = JSON.parse(lCells);
          if (lSide) cSide = JSON.parse(lSide);
          if (lClaim) cClaim = parseFloat(lClaim) || 0;
        }

        Object.entries(cCells).forEach(([key, val]) => {
          const k = parseInt(key);
          aggregatedCells[k] = (aggregatedCells[k] || 0) + (Number(val) || 0);
        });
        Object.entries(cSide).forEach(([key, val]) => {
          aggregatedSecondary[key] = (aggregatedSecondary[key] || 0) + (Number(val) || 0);
        });

        const matrixSum = Object.values(cCells).reduce((a, b) => a + Number(b), 0);
        const sideSum = Object.values(cSide).reduce((a, b) => a + Number(b), 0);
        const grandTotal = matrixSum + sideSum;
        const commVal = (grandTotal * cCommission) / 100;
        const balance = grandTotal - commVal;
        const balanceAfterClaim = balance - cClaim;
        const partnerCut = (balanceAfterClaim * cPartnership) / 100;
        totalNet += (balanceAfterClaim - partnerCut);
      }

      setMasterData({ cells: aggregatedCells, secondaryCells: aggregatedSecondary });
      setMasterNetValue(totalNet);
    };

    fetchMasterAggregates();
  }, [activeTab, clients, dateKey, userId]);

  const handleUpdate = (table: "matrix" | "side" | "others", key: string, value: number, mode: "add" | "set" = "add") => {
    if (table === "others") return;

    if (activeTab === "clients" && clientManagerRef.current?.selectedClientId) {
      clientManagerRef.current.updateClientData(table, key, value, mode);
      return;
    }

    if (activeTab === "master") return;

    const currentCells = { ...gridData };
    const currentSide = { ...secondaryData };

    if (table === "matrix") {
      let idx = parseInt(key);
      if (idx === 0) idx = 100;
      currentCells[idx] = mode === "add" ? (currentCells[idx] || 0) + value : value;
      setGridData(currentCells);
    } else if (table === "side") {
      currentSide[key] = mode === "add" ? (secondaryData[key] || 0) + value : value;
      setSecondaryData(currentSide);
    }

    if (userId) {
      setDoc(doc(db, "grids", userId, "dailySheets", dateKey), {
        cells: currentCells,
        secondaryCells: currentSide,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((error) => {
        console.error("setDoc error in dailySheets:", error);
        if (error.code === "permission-denied") {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: `grids/${userId}/dailySheets/${dateKey}`,
            operation: "write"
          }));
        }
      });
    } else {
      localStorage.setItem(`gridpulse_local_grid_${dateKey}`, JSON.stringify(currentCells));
      localStorage.setItem(`gridpulse_local_side_${dateKey}`, JSON.stringify(currentSide));
    }
  };

  const handleScreenshot = () => {
    const node = document.getElementById('matrix-capture');
    if (!node) return;
    toPng(node, { backgroundColor: '#f8fafc', cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `gridpulse-${dateKey}-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    let values: number[] = [];
    
    if (activeTab === "clients" && clientManagerRef.current) {
      const clientData = clientManagerRef.current.getCurrentData();
      if (clientData) {
        values = [...Object.values(clientData.cells).map(Number), ...Object.values(clientData.secondaryCells).map(Number)];
      }
    } else if (activeTab === "master") {
      values = [...Object.values(masterData.cells).map(Number), ...Object.values(masterData.secondaryCells).map(Number)];
    } else {
      values = [...Object.values(gridData).map(Number), ...Object.values(secondaryData).map(Number)];
    }

    if (values.length === 0) {
      toast({ title: "Insufficient Data", description: "Add numerical entries to perform synthesis." });
      setIsAnalyzing(false);
      return;
    }

    try {
      const insight = await summarizeGridTrends({ gridValues: values });
      setCurrentInsight(insight);
      setIsInsightOpen(true);
    } catch (err) {
      console.error("summarizeGridTrends error:", err);
      toast({ variant: "destructive", title: "Synthesis Failed", description: "AI engine could not process data." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-foreground overflow-x-hidden relative">
      <header className="fixed top-4 left-4 right-4 z-50 no-print flex justify-between items-center">
        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full border-primary/20 shadow-lg">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={() => handleDateChange(subDays(selectedDate, 1))}
            disabled={isBefore(subDays(selectedDate, 1), maxHistoryDate)}
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </Button>
          
          <div className="flex items-center gap-1">
            <Input 
              value={dateInput}
              onChange={(e) => handleManualDateEntry(e.target.value)}
              className="h-8 w-28 bg-transparent border-none focus-visible:ring-0 text-[10px] font-black uppercase text-primary text-center tracking-widest p-0"
              placeholder="YYYY-MM-DD"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-slate-200 shadow-2xl">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={(date) => isBefore(date, maxHistoryDate) || isAfter(date, today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={() => handleDateChange(addDays(selectedDate, 1))}
            disabled={isAfter(addDays(selectedDate, 1), today)}
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
        
        <AuthButton />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-2 md:p-6 lg:p-8 mt-16 pb-40">
        <div className="w-full max-w-screen-2xl space-y-8">
          
          {activeTab === "master" && (
            <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="w-full p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl border border-slate-800 transform-gpu hover:scale-[1.005] transition-all duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3 text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Portfolio Net Aggregate ({dateKey})</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-7xl font-black text-primary tabular-nums tracking-tighter">
                          {masterNetValue.toLocaleString()}
                        </span>
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Net Gain</span>
                      </div>
                    </div>
                    
                    <Button onClick={() => setActiveTab("clients")} className="h-14 rounded-2xl bg-white text-slate-900 font-bold hover:bg-primary hover:text-white transition-all px-8">
                      Manage Accounts <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "matrix" || activeTab === "side" || activeTab === "master" ? (
            <div id="matrix-capture" className="w-full space-y-8 animate-in fade-in duration-700">
              <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-8 items-start justify-center bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl">
                <div className="flex-[4] w-full flex flex-col">
                  <h2 className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-[0.4em] mb-4 text-center lg:text-left">
                    {activeTab === "master" ? "Aggregate Matrix" : `10x10 Matrix (${dateKey})`}
                  </h2>
                  <Matrix data={activeTab === "master" ? masterData.cells : gridData} selection={selection} onSelect={(key) => activeTab !== "master" && setSelection({ table: "matrix", key })} />
                </div>
                
                <div className="flex-1 w-full lg:max-w-[280px] flex flex-col">
                  <h2 className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-[0.4em] mb-4 text-center lg:text-left">Side Analysis</h2>
                  <SideTable data={activeTab === "master" ? masterData.secondaryCells : secondaryData} selection={selection} onSelect={(key) => activeTab !== "master" && setSelection({ table: "side", key })} />
                </div>
              </div>
            </div>
          ) : activeTab === "others" ? (
            <div className="w-full flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700 pb-20">
              <div className="w-full max-w-lg bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col items-center space-y-12">
                <div className="w-full space-y-6">
                   <Button onClick={() => setIsFillOpen(true)} className="w-full h-24 rounded-[2.5rem] bg-primary text-white font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-4">
                     <PlusSquare className="w-7 h-7" /> Range Fill Utility
                   </Button>
                   <Button onClick={() => setIsPasteOpen(true)} className="w-full h-24 rounded-[2.5rem] bg-secondary text-white font-black text-xl shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all gap-4">
                     <ClipboardPaste className="w-7 h-7" /> Paste Fill Utility
                   </Button>
                </div>
              </div>
              <SavedSheetsList userId={userId} onLoad={(d) => { setGridData(d.cells); setSecondaryData(d.secondaryCells); }} />
            </div>
          ) : activeTab === "clients" ? (
            <ClientManager 
              ref={clientManagerRef} 
              userId={userId} 
              selectedDate={selectedDate}
              selection={selection} 
              onSelect={setSelection} 
              onClientSelect={setActiveClientName} 
              onUpdateTrigger={() => setLocalUpdateTrigger(p => p + 1)} 
              onOpenFill={() => setIsFillOpen(true)} 
              onOpenPaste={() => setIsPasteOpen(true)} 
            />
          ) : null}
        </div>
      </main>

      <InsightPanel insight={currentInsight} isOpen={isInsightOpen} onOpenChange={setIsInsightOpen} />

      <CommandPanel 
        activeTab={activeTab} setActiveTab={setActiveTab} selection={selection} setSelection={setSelection}
        onUpdate={handleUpdate} onClearCell={(t, k) => handleUpdate(t, k, 0, "set")}
        onClearAll={() => { if(confirm("Clear current view?")) handleUpdate("matrix", "", 0, "set"); }}
        onSave={() => toast({ title: "Auto-Synced", description: `Data for ${dateKey} is secure.` })}
        onSaveSnapshot={(n) => {}} onScreenshot={handleScreenshot} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} clientName={activeTab === "clients" ? activeClientName : undefined}
      />

      {/* Range Fill Dialog */}
      <Dialog open={isFillOpen} onOpenChange={setIsFillOpen}>
        <DialogContent className="rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold">Range Fill Utility</DialogTitle>
            <DialogDescription>Apply a value across a sequence of boxes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Box</Label><Input type="number" value={fillStart} onChange={(e) => setFillStart(e.target.value)} className="h-12 rounded-xl font-bold" /></div>
              <div className="space-y-2"><Label>End Box</Label><Input type="number" value={fillEnd} onChange={(e) => setFillEnd(e.target.value)} className="h-12 rounded-xl font-bold" /></div>
            </div>
            <div className="space-y-2"><Label>Amount</Label><Input type="number" value={fillValue} onChange={(e) => setFillValue(e.target.value)} className="h-12 rounded-xl font-bold" placeholder="0" /></div>
            <DialogFooter>
              <Button onClick={() => {
                const s = parseInt(fillStart);
                const e = parseInt(fillEnd);
                const v = parseInt(fillValue) || 0;
                if (activeTab === "clients" && clientManagerRef.current) {
                  clientManagerRef.current.bulkUpdateClient(s, e, v, "add");
                } else {
                  for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
                    if (i >= 1 && i <= 100) handleUpdate("matrix", i.toString(), v, "add");
                  }
                }
                setIsFillOpen(false);
              }} className="w-full h-12 rounded-xl font-bold bg-primary text-white">Execute Range Fill</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste Fill Dialog */}
      <Dialog open={isPasteOpen} onOpenChange={setIsPasteOpen}>
        <DialogContent className="rounded-[3rem] p-8 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold">Paste Import Utility</DialogTitle>
            <DialogDescription>Paste reports or text sequences to extract numerical values for the matrix.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Textarea 
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              className="min-h-[200px] rounded-[2rem] p-6 font-mono text-sm border-slate-200"
              placeholder="Example: 12 34 56 all 50... 01... 100"
            />
            <DialogFooter>
              <Button onClick={() => {
                if (activeTab === "clients" && clientManagerRef.current) {
                  clientManagerRef.current.pasteUpdateClient(pasteInput);
                } else {
                  const lines = pasteInput.split('\n');
                  lines.forEach(line => {
                    const nums = line.match(/\d+/g);
                    if (nums && nums.length >= 2) {
                      const val = parseInt(nums[nums.length - 1]);
                      nums.slice(0, -1).forEach(n => {
                        let b = parseInt(n);
                        if (b === 0) b = 100;
                        if (b >= 1 && b <= 100) handleUpdate("matrix", b.toString(), val, "add");
                      });
                    }
                  });
                }
                setIsPasteOpen(false);
                setPasteInput("");
              }} className="w-full h-14 rounded-2xl font-bold bg-secondary text-white shadow-lg shadow-secondary/20">Process & Import Data</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
