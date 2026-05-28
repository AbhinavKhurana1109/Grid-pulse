
"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Trash2, Calculator, ArrowRight, CloudOff, Wallet, Target, Settings2, Edit3, UserCog, PlusSquare, ClipboardPaste, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Matrix } from "@/components/grid/matrix";
import { SideTable } from "@/components/grid/side-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Selection } from "@/app/page";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  partnership: number;
  commission: number;
  createdAt: string;
}

export interface ClientManagerRef {
  clearCurrentClient: (type: "matrix" | "side") => void;
  selectedClientId: string | null;
  updateClientData: (table: "matrix" | "side", key: string, value: number, mode: "add" | "set") => void;
  bulkUpdateClient: (start: number, end: number, value: number, mode: "add" | "set") => void;
  pasteUpdateClient: (input: string) => void;
  getCurrentData: () => { cells: Record<number, number>; secondaryCells: Record<string, number> } | null;
}

interface ClientManagerProps {
  userId: string | null;
  selectedDate: Date;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onClientSelect: (name: string | undefined) => void;
  onUpdateTrigger?: () => void;
  onOpenFill?: () => void;
  onOpenPaste?: () => void;
}

export const ClientManager = forwardRef<ClientManagerRef, ClientManagerProps>(({ userId, selectedDate, selection, onSelect, onClientSelect, onUpdateTrigger, onOpenFill, onOpenPaste }, ref) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dailyData, setDailyData] = useState<{ cells: Record<number, number>; secondaryCells: Record<string, number>; claim: number }>({ cells: {}, secondaryCells: {}, claim: 0 });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const [editData, setEditData] = useState<Partial<Client>>({});
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    clearCurrentClient: (type) => handleClearTable(type, true),
    selectedClientId: selectedClient?.id || null,
    updateClientData: handleUpdateClientData,
    bulkUpdateClient: handleBulkUpdateClient,
    pasteUpdateClient: handlePasteUpdateClient,
    getCurrentData: () => ({ cells: dailyData.cells, secondaryCells: dailyData.secondaryCells })
  }));

  // Fetch Metadata & Daily Data
  useEffect(() => {
    let unsubClients: (() => void) | undefined;
    let unsubDaily: (() => void) | undefined;

    if (userId) {
      const q = query(collection(db, "grids", userId, "clients"), orderBy("createdAt", "desc"));
      unsubClients = onSnapshot(q, (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      }, (error) => {
        console.error("onSnapshot error in client list:", error);
        if (error.code === "permission-denied") {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: `grids/${userId}/clients`,
            operation: "list"
          }));
        }
      });

      if (selectedClient) {
        const dailyRef = doc(db, "grids", userId, "clients", selectedClient.id, "dailySheets", dateKey);
        unsubDaily = onSnapshot(dailyRef, (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setDailyData({ cells: d.cells || {}, secondaryCells: d.secondaryCells || {}, claim: d.claim || 0 });
          } else {
            setDailyData({ cells: {}, secondaryCells: {}, claim: 0 });
          }
        }, (error) => {
          console.error("onSnapshot error in client dailySheets:", error);
          if (error.code === "permission-denied") {
            errorEmitter.emit("permission-error", new FirestorePermissionError({
              path: `grids/${userId}/clients/${selectedClient.id}/dailySheets/${dateKey}`,
              operation: "get"
            }));
          }
        });
      }
    } else {
      const localClients = localStorage.getItem("gridpulse_local_clients");
      setClients(localClients ? JSON.parse(localClients) : []);

      if (selectedClient) {
        const lCells = localStorage.getItem(`gridpulse_local_client_${selectedClient.id}_grid_${dateKey}`);
        const lSide = localStorage.getItem(`gridpulse_local_client_${selectedClient.id}_side_${dateKey}`);
        const lClaim = localStorage.getItem(`gridpulse_local_client_${selectedClient.id}_claim_${dateKey}`);
        setDailyData({
          cells: lCells ? JSON.parse(lCells) : {},
          secondaryCells: lSide ? JSON.parse(lSide) : {},
          claim: lClaim ? parseFloat(lClaim) : 0
        });
      }
    }

    return () => {
      if (unsubClients) unsubClients();
      if (unsubDaily) unsubDaily();
    };
  }, [userId, selectedClient?.id, dateKey]);

  const saveDailyData = (cells: Record<number, number>, side: Record<string, number>, claim: number) => {
    if (userId && selectedClient) {
      setDoc(doc(db, "grids", userId, "clients", selectedClient.id, "dailySheets", dateKey), {
        cells, secondaryCells: side, claim, updatedAt: new Date().toISOString()
      }, { merge: true }).catch((error) => {
        console.error("setDoc error in client dailySheets:", error);
        if (error.code === "permission-denied") {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: `grids/${userId}/clients/${selectedClient.id}/dailySheets/${dateKey}`,
            operation: "write"
          }));
        }
      });
    } else if (selectedClient) {
      localStorage.setItem(`gridpulse_local_client_${selectedClient.id}_grid_${dateKey}`, JSON.stringify(cells));
      localStorage.setItem(`gridpulse_local_client_${selectedClient.id}_side_${dateKey}`, JSON.stringify(side));
      localStorage.setItem(`gridpulse_local_client_${selectedClient.id}_claim_${dateKey}`, claim.toString());
    }
  };

  const handleUpdateClientData = (table: "matrix" | "side", key: string, value: number, mode: "add" | "set" = "set") => {
    if (!selectedClient) return;
    const newCells = { ...dailyData.cells };
    const newSide = { ...dailyData.secondaryCells };

    if (table === "matrix") {
      const finalKey = (parseInt(key) === 0 ? 100 : parseInt(key));
      newCells[finalKey] = mode === "add" ? (newCells[finalKey] || 0) + value : value;
    } else {
      const finalKey = key.toUpperCase();
      newSide[finalKey] = mode === "add" ? (newSide[finalKey] || 0) + value : value;
    }
    setDailyData({ ...dailyData, cells: newCells, secondaryCells: newSide });
    saveDailyData(newCells, newSide, dailyData.claim);
  };

  const handleBulkUpdateClient = (start: number, end: number, value: number, mode: "add" | "set" = "add") => {
    if (!selectedClient) return;
    const newCells = { ...dailyData.cells };
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    for (let i = min; i <= max; i++) {
      if (i >= 1 && i <= 100) newCells[i] = mode === "add" ? (newCells[i] || 0) + value : value;
    }
    setDailyData({ ...dailyData, cells: newCells });
    saveDailyData(newCells, dailyData.secondaryCells, dailyData.claim);
  };

  const handlePasteUpdateClient = (input: string) => {
    if (!selectedClient) return;
    const lines = input.split('\n');
    const newCells = { ...dailyData.cells };
    lines.forEach(line => {
      const nums = line.match(/\d+/g);
      if (nums && nums.length >= 2) {
        const val = parseInt(nums[nums.length - 1]);
        nums.slice(0, -1).forEach(n => {
          let b = parseInt(n);
          if (b === 0) b = 100;
          if (b >= 1 && b <= 100) newCells[b] = (newCells[b] || 0) + val;
        });
      }
    });
    setDailyData({ ...dailyData, cells: newCells });
    saveDailyData(newCells, dailyData.secondaryCells, dailyData.claim);
  };

  const handleClearTable = (type: "matrix" | "side", silent = false) => {
    if (!selectedClient) return;
    const newCells = type === "matrix" ? {} : dailyData.cells;
    const newSide = type === "side" ? {} : dailyData.secondaryCells;
    setDailyData({ ...dailyData, cells: newCells, secondaryCells: newSide });
    saveDailyData(newCells as Record<number, number>, newSide as Record<string, number>, dailyData.claim);
  };

  const calculateTotals = (client: Client, data: { cells: Record<number, number>; secondaryCells: Record<string, number>; claim: number }) => {
    const matrixSum = Object.values(data.cells).reduce((a, b) => a + Number(b), 0);
    const sideSum = Object.values(data.secondaryCells).reduce((a, b) => a + Number(b), 0);
    const grandTotal = matrixSum + sideSum;
    const commVal = (grandTotal * (client.commission || 0)) / 100;
    const balance = grandTotal - commVal;
    const balanceAfterClaim = balance - (data.claim || 0);
    const partnerCut = (balanceAfterClaim * (client.partnership || 0)) / 100;
    return { grandTotal, balance, finalNet: balanceAfterClaim - partnerCut };
  };

  if (selectedClient) {
    const totals = calculateTotals(selectedClient, dailyData);
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => { setSelectedClient(null); onClientSelect(undefined); }} className="gap-2 rounded-xl">
            <ArrowRight className="w-4 h-4 rotate-180" /> Client Roster
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <h2 className="text-xl font-headline font-bold text-slate-800">{selectedClient.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => { setEditData(selectedClient); setIsEditOpen(true); }} className="h-6 w-6 text-slate-400 hover:text-primary rounded-full">
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-400 justify-end">
                <span>Terms: {selectedClient.partnership}% / {selectedClient.commission}%</span>
                <span className="text-primary tracking-widest">{dateKey}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,280px,300px] gap-8 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-x-auto">
          <div className="space-y-4 min-w-[320px]">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-widest">Matrix Grid</h3>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={onOpenFill} className="h-6 text-[10px] font-bold text-primary">Range</Button>
                   <Button variant="ghost" size="sm" onClick={onOpenPaste} className="h-6 text-[10px] font-bold text-secondary">Paste</Button>
                   <Button variant="ghost" size="sm" onClick={() => handleClearTable("matrix")} className="h-6 text-[10px] font-bold text-destructive">Clear</Button>
                </div>
             </div>
             <Matrix data={dailyData.cells} selection={selection?.table === "matrix" ? selection : null} onSelect={(key) => onSelect({ table: "matrix", key })} />
          </div>

          <div className="space-y-4 min-w-[240px]">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-widest">Side Tables</h3>
                <Button variant="ghost" size="sm" onClick={() => handleClearTable("side")} className="h-6 text-[10px] font-bold text-destructive">Clear</Button>
             </div>
             <SideTable data={dailyData.secondaryCells} selection={selection?.table === "side" ? selection : null} onSelect={(key) => onSelect({ table: "side", key })} />
          </div>
          
          <div className="space-y-8 min-w-[300px]">
            <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-4 shadow-inner">
              <h3 className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calculator className="w-3 h-3" /> Financial Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Gross</span>
                  <span className="font-bold text-slate-700">{totals.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Net Balance</span>
                  <span className="font-bold text-slate-800">{totals.balance.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <Label className="text-[10px] font-bold text-primary uppercase">Daily Claim</Label>
                  <Input type="number" value={dailyData.claim} onChange={(e) => { const c = parseFloat(e.target.value) || 0; setDailyData({...dailyData, claim: c}); saveDailyData(dailyData.cells, dailyData.secondaryCells, c); }} className="h-10 rounded-xl font-bold bg-white" />
                </div>

                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-2xl border border-primary/20 mt-4">
                  <span className="text-xs font-headline font-bold text-primary uppercase">Final Net Share</span>
                  <span className="text-xl font-black text-primary tabular-nums tracking-tighter">{totals.finalNet.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
        <div className="p-4 bg-primary/5 rounded-full ring-8 ring-primary/5">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-slate-800 tracking-tight">Client Portfolio</h2>
          <p className="text-slate-500 text-sm">Manage multiple portfolios with historical dated records.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl px-10 h-14 font-bold flex gap-3 shadow-xl bg-primary text-white">
              <Plus className="w-6 h-6" /> Register Client
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle>New Client Enrollment</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); /* ...add logic... */ setIsAddOpen(false); }} className="space-y-6 py-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Client name..." required className="h-12 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Partnership (%)</Label><Input type="number" defaultValue="0" className="h-12 rounded-xl" /></div>
                <div className="space-y-2"><Label>Commission (%)</Label><Input type="number" defaultValue="0" className="h-12 rounded-xl" /></div>
              </div>
              <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary text-white">Create Account</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[550px] w-full">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map((client) => (
            <div key={client.id} className="group bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer transform hover:-translate-y-1" onClick={() => { setSelectedClient(client); onClientSelect(client.name); }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-headline font-bold text-slate-800">{client.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Status: Historical Archive Active</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); /* ...delete logic... */ }}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              <Button className="w-full h-12 rounded-2xl font-bold bg-slate-900 text-white hover:bg-primary transition-all">View Archive <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});

ClientManager.displayName = "ClientManager";
