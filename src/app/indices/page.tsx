"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";

// Comprehensive list of Indian Indices
const ALL_INDICES = [
  { name: "NIFTY 50", symbol: "NIFTY 50", price: "25,807.20", currency: "INR", change: "-146.65", percent: "-0.57%", trending: "down" },
  { name: "SENSEX", symbol: "SENSEX", price: "84,273.92", currency: "INR", change: "-558.72", percent: "-0.66%", trending: "down" },
  { name: "NIFTY BANK", symbol: "NIFTY BANK", price: "60,739.75", currency: "INR", change: "-5.60", percent: "-0.01%", trending: "down" },
  { name: "NIFTY FIN SERVICE", symbol: "NIFTY FIN SERVICE", price: "28,385.20", currency: "INR", change: "+108.25", percent: "+0.38%", trending: "up" },
  { name: "NIFTY MIDCAP 100", symbol: "NIFTY MIDCAP 100", price: "60,470.85", currency: "INR", change: "-283.70", percent: "-0.47%", trending: "down" },
  { name: "NIFTY SMALLCAP 100", symbol: "NIFTY SMLCAP 100", price: "17,344.10", currency: "INR", change: "-110.90", percent: "-0.64%", trending: "down" },
  { name: "NIFTY IT", symbol: "NIFTY IT", price: "33,160.20", currency: "INR", change: "-1,934.95", percent: "-5.51%", trending: "down" },
  // { name: "NIFTY AUTO", symbol: "NIFTY AUTO", price: "28,504.05", currency: "INR", change: "-34.65", percent: "-0.12%", trending: "down" },
  // { name: "NIFTY METAL", symbol: "NIFTY METAL", price: "12,279.20", currency: "INR", change: "+2.65", percent: "+0.02%", trending: "up" },
  // { name: "NIFTY PHARMA", symbol: "NIFTY PHARMA", price: "22,386.30", currency: "INR", change: "-47.90", percent: "-0.21%", trending: "down" },
  // { name: "NIFTY PSU BANK", symbol: "NIFTY PSU BANK", price: "9,229.45", currency: "INR", change: "-20.75", percent: "-0.22%", trending: "down" },
  // { name: "NIFTY FMCG", symbol: "NIFTY FMCG", price: "51,885.75", currency: "INR", change: "-266.35", percent: "-0.51%", trending: "down" },
  // { name: "NIFTY ENERGY", symbol: "NIFTY ENERGY", price: "39,850.10", currency: "INR", change: "+150.30", percent: "+0.38%", trending: "up" },
  // { name: "NIFTY SMALLCAP 250", symbol: "NIFTY SMALLCAP 250", price: "16,250.15", currency: "INR", change: "-119.75", percent: "-0.73%", trending: "down" },
  // { name: "NIFTY MIDCAP 150", symbol: "NIFTY MIDCAP 150", price: "22,252.40", currency: "INR", change: "-112.00", percent: "-0.50%", trending: "down" },
  // { name: "NIFTY COMMODITIES", symbol: "NIFTY COMMODITIES", price: "10,019.90", currency: "INR", change: "-41.55", percent: "-0.41%", trending: "down" },
  // { name: "BSE SMALLCAP", symbol: "BSE SMALLCAP", price: "46,825.31", currency: "INR", change: "0.00", percent: "0.00%", trending: "flat" },
  // { name: "BSE IPO", symbol: "BSE IPO", price: "15,264.55", currency: "INR", change: "+30.13", percent: "+0.20%", trending: "up" },
  // { name: "INDIA VIX", symbol: "INDIA VIX", price: "11.73", currency: "INR", change: "+0.18", percent: "+1.56%", trending: "up" },
  // { name: "NIFTY NEXT 50", symbol: "NIFTY NEXT 50", price: "69,916.10", currency: "INR", change: "-300.45", percent: "-0.43%", trending: "down" },
  // { name: "NIFTY 500", symbol: "NIFTY 500", price: "23,651.55", currency: "INR", change: "-131.50", percent: "-0.55%", trending: "down" },
];

export default function IndicesPage() {
  const { socket, isConnected } = useSocket();
  const [indices, setIndices] = useState(ALL_INDICES);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleIndexUpdate = (update: { symbol: string; price: number; change?: number; percent?: number; timestamp: string }) => {
      setIndices(prevIndices => {
        return prevIndices.map(index => {
          if (index.symbol === update.symbol) {
            const change = update.change || 0;
            const percent = update.percent || 0;
            return {
              ...index,
              price: update.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
              change: `${change > 0 ? "+" : ""}${change.toFixed(2)}`,
              percent: `${change > 0 ? "+" : ""}${percent.toFixed(2)}%`,
              trending: change >= 0 ? "up" : "down"
            };
          }
          return index;
        });
      });
    };

    socket.on("index-update", handleIndexUpdate);

    return () => {
      socket.off("index-update", handleIndexUpdate);
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Market Indices</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">Real-time updates for major Indian indices</span>
              <span className={cn(
                "h-2 w-2 rounded-full ml-2",
                isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
              )} title={isConnected ? "Live Connected" : "Connecting..."} />
            </div>
          </div>
        </div>

        {/* Indices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {indices.map((index) => {
            const isPositive = index.trending === "up";

            return (
              <Link key={index.symbol} href={`/indices/${encodeURIComponent(index.symbol)}`}>
                <div className="group relative overflow-hidden p-6 rounded-3xl bg-card border border-border hover:border-border/50 hover:bg-muted/50 transition-all duration-300">

                  {/* Background Glow */}
                  <div className={cn(
                    "absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    isPositive
                      ? "bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"
                      : "bg-gradient-to-br from-rose-500/5 via-transparent to-transparent"
                  )} />

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold ring-1 ring-white/10 shadow-lg",
                        index.name.includes("NIFTY 50") ? "bg-blue-600/20 text-blue-400 ring-blue-500/20" :
                          index.name.includes("SENSEX") ? "bg-purple-600/20 text-purple-400 ring-purple-500/20" :
                            index.name.includes("BANK") ? "bg-green-600/20 text-green-400 ring-green-500/20" :
                              "bg-muted text-muted-foreground"
                      )}>
                        {index.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {index.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {index.symbol}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "p-2 rounded-full transition-transform duration-500 group-hover:scale-110",
                      isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        {index.price}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">INR</span>
                    </div>

                    <div className={cn(
                      "inline-flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg",
                      isPositive ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                    )}>
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      <span>{index.change}</span>
                      <span className="opacity-80">({index.percent})</span>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BarChart2 className={cn("h-16 w-16", isPositive ? "text-emerald-500" : "text-rose-500")} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
