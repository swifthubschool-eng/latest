"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Download, TrendingUp, BarChart3, Calendar, RefreshCcw, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ScanType = "VD" | "VDW" | "VDM";
type SortKey = "symbol" | "ltp" | "currentVolume" | "avgVolume" | "ratio";
type SortDir = "asc" | "desc";

interface ScanResult {
  symbol: string; ltp: number; currentVolume: number; avgVolume: number; ratio: number; scanType: string;
}
interface ScanMeta { total: number; scanned: number; threshold: number; }

const SCAN_TYPES = [
  { id: "VD", label: "Volume & Delivery (Daily)", desc: "Stocks with above-avg daily volume", icon: BarChart3 },
  { id: "VDW", label: "Volume & Delivery (Weekly)", desc: "Stocks with rising weekly volume", icon: Calendar },
  { id: "VDM", label: "Volume & Delivery (Monthly)", desc: "Stocks with rising monthly volume", icon: TrendingUp },
];

// Messages cycling during load
const LOADING_STEPS = [
  "Connecting to Zerodha Kite…",
  "Fetching instrument list…",
  "Loading Nifty 500 stock list…",
  "Fetching historical OHLCV data…",
  "Batch 1/60 — processing…",
  "Batch 10/60 — processing…",
  "Batch 20/60 — computing averages…",
  "Batch 30/60 — computing averages…",
  "Batch 40/60 — detecting volume spikes…",
  "Batch 50/60 — detecting volume spikes…",
  "Batch 55/60 — almost done…",
  "Finalising results…",
  "Sorting by volume ratio…",
];

// Estimated duration in seconds
const ESTIMATE_SECS = 160;

function ScanLoader({ scanLabel }: { scanLabel: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const idx = Math.min(Math.floor((elapsed / ESTIMATE_SECS) * LOADING_STEPS.length), LOADING_STEPS.length - 1);
    setStepIdx(idx);
  }, [elapsed]);

  const pct = Math.min((elapsed / ESTIMATE_SECS) * 100, 97); // cap at 97 until complete
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const remain = Math.max(ESTIMATE_SECS - elapsed, 0);
  const rMins = Math.floor(remain / 60);
  const rSecs = remain % 60;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 space-y-8">
      {/* Orbiting rings */}
      <div className="relative w-28 h-28">
        {/* Outer slow ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin" style={{ animationDuration: "4s" }} />
        {/* Middle ring with gap */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "hsl(var(--primary))",
            borderRightColor: "hsl(var(--primary) / 0.4)",
            animation: "spin 1.8s linear infinite",
          }}
        />
        {/* Inner fast ring */}
        <div
          className="absolute inset-5 rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "rgb(134 239 172)",   // green-300
            borderLeftColor: "rgb(134 239 172 / 0.4)",
            animation: "spin 1s linear infinite reverse",
          }}
        />
        {/* Centre pulse */}
        <div className="absolute inset-9 rounded-full bg-primary/30 animate-pulse" />
        <div className="absolute inset-11 rounded-full bg-primary/60" />
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-foreground">Scanning {scanLabel}</p>
        <p className="text-sm text-muted-foreground">
          Analysing ~300 Nifty 500 stocks via Kite API — this takes ~2–3 minutes
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-primary to-green-400 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>{pct.toFixed(0)}% complete</span>
          <span>
            {mins}:{String(secs).padStart(2, "0")} elapsed ·{" "}
            ~{rMins}:{String(rSecs).padStart(2, "0")} remaining
          </span>
        </div>
      </div>

      {/* Cycling status message */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span key={stepIdx} className="transition-all duration-500">
          {LOADING_STEPS[stepIdx]}
        </span>
      </div>

      {/* Animated dot grid */}
      <div className="grid grid-cols-10 gap-1.5 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            style={{
              animationName: "pulse",
              animationDuration: `${0.8 + (i % 7) * 0.15}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ratioColor(ratio: number) {
  if (ratio >= 3) return "text-emerald-400 font-bold";
  if (ratio >= 1.5) return "text-green-400 font-semibold";
  if (ratio >= 1.0) return "text-yellow-400";
  return "text-orange-400";
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="inline ml-1 h-3 w-3 opacity-40" />;
  return sortDir === "asc" ? <ArrowUp className="inline ml-1 h-3 w-3" /> : <ArrowDown className="inline ml-1 h-3 w-3" />;
}

export function VolumeScanner() {
  const [activeScan, setActiveScan] = useState<ScanType>("VD");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [meta, setMeta] = useState<ScanMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchScan = useCallback(async (type: ScanType) => {
    setLoading(true);
    setResults([]);
    setMeta(null);
    try {
      const res = await fetch(`/api/screener/volume?type=${type}&limit=300`);
      const data = await res.json();
      if (data.data) {
        setResults(data.data);
        setMeta(data.meta || null);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error("Scan failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScan(activeScan); }, [activeScan, fetchScan]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = results
    .filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleDownloadCSV = () => {
    if (!filtered.length) return;
    const rows = [
      ["Symbol", "Last Price", "Current Vol", "Avg Vol", "Ratio", "Scan Type", "Date"],
      ...filtered.map(r => [r.symbol, r.ltp, r.currentVolume, r.avgVolume, r.ratio, r.scanType, new Date().toISOString().split("T")[0]])
    ].map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    link.download = `volume_scan_${activeScan}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const fmt = (n: number) => {
    if (n >= 10_000_000) return (n / 10_000_000).toFixed(2) + " Cr";
    if (n >= 100_000) return (n / 100_000).toFixed(2) + " L";
    return n.toLocaleString();
  };

  const activeScanLabel = SCAN_TYPES.find(s => s.id === activeScan)?.label ?? activeScan;

  const SH = ({ label, col }: { label: string; col: SortKey }) => (
    <TableHead
      className={cn("cursor-pointer select-none hover:text-foreground", col !== "symbol" && "text-right")}
      onClick={() => handleSort(col)}
    >
      {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Volume and Delivery Scans
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta
              ? `${filtered.length} of ${meta.total} matched · ${meta.scanned} stocks scanned · threshold ≥ ${meta.threshold}x`
              : "Monitor highly traded & delivered stocks"}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search symbol..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchScan(activeScan)} disabled={loading}>
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleDownloadCSV} disabled={!filtered.length || loading}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Scan Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCAN_TYPES.map(s => (
          <Card
            key={s.id}
            className={cn("cursor-pointer transition-all hover:bg-accent/50 border-2", activeScan === s.id ? "border-primary bg-accent/20" : "border-border")}
            onClick={() => { if (!loading) setActiveScan(s.id as ScanType); }}
          >
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription>{s.desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {lastUpdated && !loading && (
        <p className="text-xs text-muted-foreground text-right -mt-2">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Results area */}
      <div className="border rounded-lg bg-card overflow-hidden min-h-[200px]">
        {loading ? (
          <ScanLoader scanLabel={activeScanLabel} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SH label="Symbol" col="symbol" />
                <SH label="Last Price" col="ltp" />
                <SH label="Current Vol" col="currentVolume" />
                <SH label="Avg Vol" col="avgVolume" />
                <SH label="Ratio (x)" col="ratio" />
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {searchTerm ? `No stocks matching "${searchTerm}".` : "No stocks found for this scan."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(stock => (
                  <TableRow key={stock.symbol} className="group hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">
                      <Link href={`/terminal/${stock.symbol}`} className="hover:underline">{stock.symbol}</Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">₹{stock.ltp.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(stock.currentVolume)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(stock.avgVolume)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", ratioColor(stock.ratio))}>
                      {stock.ratio.toFixed(2)}x
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/terminal/${stock.symbol}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
