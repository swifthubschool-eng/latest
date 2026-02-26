"use client";

import React, { useState } from "react";
import { Download, Loader2, CheckCircle2, XCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Timeframe = "1minute" | "5minute" | "60minute" | "6month" | "week" | "month";

interface TimeframeState {
  status: "idle" | "fetching" | "done" | "error";
  progress: number;
  total: number;
  rows: number;
  error?: string;
}

const TIMEFRAMES: { id: Timeframe; label: string; desc: string; color: string }[] = [
  { id: "1minute", label: "1 Minute", desc: "Today's 1-min candles", color: "text-blue-400" },
  { id: "5minute", label: "5 Minute", desc: "Last 5 days (5-min bars)", color: "text-cyan-400" },
  { id: "60minute", label: "1 Hour", desc: "Last 30 days (hourly bars)", color: "text-indigo-400" },
  { id: "6month", label: "6 Months", desc: "Last 6 months (daily bars)", color: "text-pink-400" },
  { id: "week", label: "1 Year", desc: "Last 1 year (daily bars)", color: "text-purple-400" },
  { id: "month", label: "5 Years", desc: "Last 5 years (daily bars)", color: "text-orange-400" },
];

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchWithProgress(
  timeframe: Timeframe,
  onProgress: (done: number, total: number) => void,
  onComplete: (csv: string, filename: string, rows: number) => void,
  onError: (msg: string) => void
) {
  const res = await fetch(`/api/screener/bulk-export?timeframe=${timeframe}`);
  if (!res.ok || !res.body) {
    onError("Failed to connect to API.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.replace("data: ", ""));
        if (event.type === "progress") {
          onProgress(event.done, event.total);
        } else if (event.type === "complete") {
          onComplete(event.csv, event.filename, event.rows);
        } else if (event.type === "error") {
          onError(event.message);
        }
      } catch { }
    }
  }
}

export function BulkDownload() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<Set<Timeframe>>(new Set(["week", "month"]));
  const [states, setStates] = useState<Record<Timeframe, TimeframeState>>({
    "1minute": { status: "idle", progress: 0, total: 0, rows: 0 },
    "5minute": { status: "idle", progress: 0, total: 0, rows: 0 },
    "60minute": { status: "idle", progress: 0, total: 0, rows: 0 },
    "6month": { status: "idle", progress: 0, total: 0, rows: 0 },
    "week": { status: "idle", progress: 0, total: 0, rows: 0 },
    "month": { status: "idle", progress: 0, total: 0, rows: 0 },
  });

  const toggleSelect = (tf: Timeframe) => {
    if (running) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(tf) ? next.delete(tf) : next.add(tf);
      return next;
    });
  };

  const updateState = (tf: Timeframe, patch: Partial<TimeframeState>) => {
    setStates(prev => ({ ...prev, [tf]: { ...prev[tf], ...patch } }));
  };

  const handleDownload = async () => {
    if (selected.size === 0) return;
    setRunning(true);

    // Reset selected states
    for (const tf of selected) {
      updateState(tf, { status: "idle", progress: 0, total: 0, rows: 0, error: undefined });
    }

    // Run each timeframe sequentially
    for (const tf of Array.from(selected)) {
      updateState(tf, { status: "fetching" });
      await fetchWithProgress(
        tf,
        (done, total) => updateState(tf, { progress: done, total }),
        (csv, filename, rows) => {
          downloadCsv(csv, filename);
          updateState(tf, { status: "done", rows });
        },
        (msg) => updateState(tf, { status: "error", error: msg }),
      );
    }

    setRunning(false);
  };

  const pct = (tf: Timeframe) => {
    const s = states[tf];
    if (s.total === 0) return 0;
    return Math.round((s.progress / s.total) * 100);
  };

  return (
    <>
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Bulk Historical Data Export
          </CardTitle>
          <CardDescription>
            Download 1min / weekly / monthly OHLCV data for ~300 Nifty 500 stocks from Zerodha Kite.
            Takes 3–5 minutes depending on the timeframe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                onClick={() => toggleSelect(tf.id)}
                className={cn(
                  "rounded-lg border-2 p-3 text-left transition-all",
                  selected.has(tf.id)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 opacity-70 hover:opacity-100"
                )}
              >
                <div className={cn("font-semibold text-sm", tf.color)}>{tf.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{tf.desc}</div>
              </button>
            ))}
          </div>
          <Button
            onClick={() => { setOpen(true); handleDownload(); }}
            disabled={selected.size === 0 || running}
            className="w-full sm:w-auto"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Downloading...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" /> Download {selected.size} CSV{selected.size !== 1 ? "s" : ""}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Downloading Historical Data</h3>
            <p className="text-sm text-muted-foreground">
              Files will be saved to your Downloads folder as they complete.
            </p>

            <div className="space-y-3">
              {TIMEFRAMES.filter(tf => selected.has(tf.id)).map(tf => {
                const s = states[tf.id];
                const p = pct(tf.id);
                return (
                  <div key={tf.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-sm font-medium", tf.color)}>{tf.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.status === "idle" && "Waiting..."}
                        {s.status === "fetching" && `${s.progress}/${s.total} symbols (${p}%)`}
                        {s.status === "done" && <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> {s.rows.toLocaleString()} rows</span>}
                        {s.status === "error" && <span className="flex items-center gap-1 text-red-400"><XCircle className="h-3 w-3" /> {s.error}</span>}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          s.status === "done" ? "bg-green-500" :
                            s.status === "error" ? "bg-red-500" : "bg-primary"
                        )}
                        style={{ width: `${s.status === "done" ? 100 : p}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!running && (
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                Close
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
