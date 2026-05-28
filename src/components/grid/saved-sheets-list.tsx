
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, Download, Calendar, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface SavedSheet {
  id: string;
  name: string;
  cells: Record<number, number>;
  secondaryCells: Record<string, number>;
  createdAt: string;
}

interface SavedSheetsListProps {
  userId: string | null;
  onLoad: (data: { cells: Record<number, number>; secondaryCells: Record<string, number> }) => void;
  localUpdateTrigger?: number;
}

export function SavedSheetsList({ userId, onLoad, localUpdateTrigger }: SavedSheetsListProps) {
  const [sheets, setSheets] = useState<SavedSheet[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      const q = query(
        collection(db, "grids", userId, "savedSheets"),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SavedSheet[];
        setSheets(docs);
      }, (error) => {
        console.error("onSnapshot error in savedSheets:", error);
        if (error.code === "permission-denied") {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: `grids/${userId}/savedSheets`,
            operation: "list"
          }));
        }
      });

      return () => unsubscribe();
    } else {
      // Load from Local Storage
      const localHistoryRaw = localStorage.getItem("gridpulse_local_history");
      if (localHistoryRaw) {
        try {
          const localHistory = JSON.parse(localHistoryRaw) as SavedSheet[];
          setSheets(localHistory);
        } catch (e) {
          console.error("Local Storage load/JSON parse error in savedSheets:", e);
          setSheets([]);
        }
      } else {
        setSheets([]);
      }
    }
  }, [userId, localUpdateTrigger]);

  const handleDelete = async (id: string) => {
    if (userId) {
      try {
        await deleteDoc(doc(db, "grids", userId, "savedSheets", id));
        toast({
          title: "Sheet Deleted",
          description: "The cloud snapshot has been removed.",
        });
      } catch (err: any) {
        console.error("deleteDoc error in savedSheets:", err);
        if (err.code === "permission-denied") {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: `grids/${userId}/savedSheets/${id}`,
            operation: "delete"
          }));
        }
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not remove the cloud snapshot.",
        });
      }
    } else {
      const localHistoryRaw = localStorage.getItem("gridpulse_local_history");
      if (localHistoryRaw) {
        const localHistory = JSON.parse(localHistoryRaw) as SavedSheet[];
        const updatedHistory = localHistory.filter(s => s.id !== id);
        localStorage.setItem("gridpulse_local_history", JSON.stringify(updatedHistory));
        setSheets(updatedHistory);
        toast({
          title: "Sheet Deleted",
          description: "Local snapshot removed.",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-[0.4em]">
            {userId ? "Cloud History" : "Local History"}
          </h2>
          {!userId && (
            <div className="flex items-center gap-1 text-[8px] font-bold text-amber-500 uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <ShieldAlert className="w-2.5 h-2.5" />
              Not Synced
            </div>
          )}
        </div>
        <span className="bg-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500">
          {sheets.length}
        </span>
      </div>
      
      <ScrollArea className="h-[400px] w-full pr-4">
        <div className="space-y-3">
          {sheets.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 text-sm italic">
                {userId 
                  ? "No cloud snapshots found." 
                  : "No local snapshots found. Use 'Snapshot' to save current view."}
              </p>
            </div>
          ) : (
            sheets.map((sheet) => (
              <div 
                key={sheet.id}
                className="group p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 leading-tight">{sheet.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sheet.createdAt), "MMM d, yyyy • h:mm a")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:bg-primary/5"
                      onClick={() => onLoad({ cells: sheet.cells, secondaryCells: sheet.secondaryCells })}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/5"
                      onClick={() => handleDelete(sheet.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Matrix</span>
                    <span className="text-xs font-black text-primary">
                      {Object.values(sheet.cells).reduce((a, b) => a + b, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Side Total</span>
                    <span className="text-xs font-black text-secondary">
                      {Object.values(sheet.secondaryCells).reduce((a, b) => a + b, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
