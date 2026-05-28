"use client";

import { SummarizeGridTrendsOutput } from "@/ai/flows/ai-summarize-grid-trends";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InsightPanelProps {
  insight: SummarizeGridTrendsOutput | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightPanel({ insight, isOpen, onOpenChange }: InsightPanelProps) {
  if (!insight) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl glass-panel border-primary/20 text-foreground max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 border-b border-white/5 bg-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Brain className="w-6 h-6 text-primary neon-glow-cyan" />
            </div>
            <DialogTitle className="text-2xl font-headline font-bold tracking-tight">AI Synthesis Tool</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Pattern recognition and statistical analysis for your 10x10 matrix.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-8 pt-6">
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Average</p>
                <p className="text-xl font-bold font-headline text-primary">{insight.average.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Median</p>
                <p className="text-xl font-bold font-headline text-primary">{insight.median}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Range Min</p>
                <p className="text-xl font-bold font-headline text-secondary">{insight.minVal}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Range Max</p>
                <p className="text-xl font-bold font-headline text-secondary">{insight.maxVal}</p>
              </div>
            </div>

            {/* Distribution Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-headline font-bold uppercase tracking-wider text-primary">
                <TrendingUp className="w-4 h-4" /> Overall Distribution
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/20 pl-4 py-1 italic">
                {insight.overallDistribution}
              </p>
            </div>

            {/* Clusters & Patterns */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-headline font-bold uppercase tracking-wider text-secondary">
                  <BarChart3 className="w-4 h-4" /> Key Clusters
                </div>
                <div className="flex flex-wrap gap-2">
                  {insight.commonRanges.map((range, idx) => (
                    <Badge key={idx} variant="outline" className="bg-secondary/10 border-secondary/20 text-secondary">
                      {range}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-headline font-bold uppercase tracking-wider text-primary">
                  <AlertCircle className="w-4 h-4" /> Discernible Patterns
                </div>
                <ul className="space-y-2">
                  {insight.patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span> {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Summary */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 border-dashed space-y-3">
              <h3 className="font-headline font-bold text-lg text-primary">Statistical Conclusion</h3>
              <p className="text-sm leading-relaxed text-foreground/90 font-body">
                {insight.summary}
              </p>
            </div>

            {/* Outliers */}
            {insight.outliers.length > 0 && (
              <div className="space-y-3">
                <div className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] text-destructive">Significant Outliers</div>
                <div className="flex gap-2">
                  {insight.outliers.map((val, idx) => (
                    <span key={idx} className="px-3 py-1 rounded bg-destructive/10 text-destructive text-sm font-bold border border-destructive/20">
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
