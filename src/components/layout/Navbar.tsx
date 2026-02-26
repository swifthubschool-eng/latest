"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { MarketsMenu } from "./MarketsMenu";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "../ThemeToggle";
import { Download, Loader2, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CSV Download Button ──────────────────────────────────────────────────────
type Timeframe = "1minute" | "week" | "month";

const TIMEFRAMES: { id: Timeframe; label: string; desc: string }[] = [
  { id: "1minute", label: "1 Minute", desc: "Today's 1-min candles" },
  { id: "week", label: "1 Week", desc: "Last 1 year (weekly)" },
  { id: "month", label: "1 Month", desc: "Last 5 years (monthly)" },
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

function CsvDownloadButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "fetching" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeLabel, setActiveLabel] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleDownload(tf: Timeframe, label: string) {
    setOpen(false);
    setStatus("fetching");
    setActiveLabel(label);
    setProgress(0);
    setTotal(0);

    try {
      const res = await fetch(`/api/screener/bulk-export?timeframe=${tf}`);
      if (!res.ok || !res.body) throw new Error("API error");

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
              setProgress(event.done);
              setTotal(event.total);
            } else if (event.type === "complete") {
              downloadCsv(event.csv, event.filename);
              setStatus("done");
              setTimeout(() => setStatus("idle"), 3000);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch { }
        }
      }
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => status === "idle" && setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          status === "idle" && "text-muted-foreground hover:text-foreground hover:bg-accent",
          status === "fetching" && "text-blue-400 cursor-wait",
          status === "done" && "text-green-400",
          status === "error" && "text-red-400",
        )}
      >
        {status === "fetching" ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> CSV {pct}%</>
        ) : status === "done" ? (
          <><CheckCircle2 className="h-3.5 w-3.5" /> CSV ✓</>
        ) : (
          <><Download className="h-3.5 w-3.5" /> CSV <ChevronDown className="h-3 w-3 opacity-60" /></>
        )}
      </button>

      {/* Dropdown */}
      {open && status === "idle" && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg border bg-popover shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nifty 500 Historical Data
            </p>
          </div>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.id}
              onClick={() => handleDownload(tf.id, tf.label)}
              className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors group"
            >
              <div className="text-sm font-medium text-foreground group-hover:text-primary">
                {tf.label}
              </div>
              <div className="text-xs text-muted-foreground">{tf.desc}</div>
            </button>
          ))}
          <div className="px-3 py-2 border-t bg-muted/30">
            <p className="text-[10px] text-muted-foreground">
              Takes 3–5 min · CSV auto-downloads
            </p>
          </div>
        </div>
      )}

      {/* Progress tooltip when fetching */}
      {status === "fetching" && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg border bg-popover shadow-lg p-3 space-y-2">
          <p className="text-xs font-medium">Downloading {activeLabel}...</p>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{progress}/{total} symbols</p>
        </div>
      )}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    setIsAuthenticated(!!token);
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { }
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600"></div>
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            Nifty
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent">
              Dashboard
            </Button>
          </Link>
          <MarketsMenu />
          <Link href="/screener" className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-accent transition-colors">
            Screener
          </Link>
          <Link href="#" className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-accent transition-colors">
            TrendsAI
          </Link>
          <Link href="#" className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-accent transition-colors">
            Features
          </Link>
          <CsvDownloadButton />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link href="/profile" className="flex items-center gap-3 hover:bg-accent px-3 py-1.5 rounded-full transition-colors group">
              <span className="hidden sm:inline text-sm font-medium text-muted-foreground group-hover:text-foreground">{user?.name || "Member"}</span>
              <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-border">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground hover:bg-accent">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Start free trial
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
