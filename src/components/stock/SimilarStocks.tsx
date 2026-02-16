"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, BarChart2, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimilarStocksProps {
  currentStock: any;
}

export function SimilarStocks({ currentStock }: SimilarStocksProps) {
  const [similarStocks, setSimilarStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStock) return;

    async function fetchSimilarStocks() {
      try {
        // Pool of diverse popular stocks to check against
        const poolSymbols = [
          "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "HINDUNILVR", "ITC",
          "LT", "SBIN", "BHARTIARTL", "KOTAKBANK", "AXISBANK", "BAJFINANCE", "ASIANPAINT",
          "MARUTI", "TITAN", "TATAMOTORS", "ULTRACEMCO", "SUNPHARMA", "NTPC", "POWERGRID",
          "TATASTEEL", "M&M", "ADANIENT", "ADANIPORTS", "COALINDIA", "ONGC", "BPCL",
          "GRASIM", "INDUSINDBK", "BAJAJFINSV", "DRREDDY", "CIPLA", "APOLLOHOSP",
          "DIVISLAB", "EICHERMOT", "HDFCLIFE", "TATACONSUM", "HINDALCO", "UPL",
          "BRITANNIA", "NESTLEIND", "WIPRO", "TECHM", "HEROMOTOCO", "SBILIFE", "LTIM"
        ].filter(s => s !== currentStock.symbol).join(",");

        const res = await fetch(`/api/stocks/quotes?symbols=${poolSymbols}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const pool = data.data;

          // Strategy: Find matches based on criteria priority
          // 1. Same Sector
          // 2. Similar P/E (+/- 20%)
          // 3. Similar Volume Magnitude

          let matches = [];

          if (currentStock.sector && currentStock.sector !== "N/A") {
            const sectorMatches = pool.filter((s: any) => s.sector === currentStock.sector);
            matches.push(...sectorMatches.map((s: any) => ({ ...s, reason: "Same Sector" })));
          }

          if (matches.length < 4 && currentStock.pe_ratio) {
            const peMatches = pool.filter((s: any) =>
              s.pe_ratio &&
              Math.abs(s.pe_ratio - currentStock.pe_ratio) < (currentStock.pe_ratio * 0.3) // +/- 30% range
            );
            // innovative deduplication
            const newPeMatches = peMatches
              .filter((s: any) => !matches.find((m: any) => m.symbol === s.symbol))
              .map((s: any) => ({ ...s, reason: "Similar P/E" }));
            matches.push(...newPeMatches);
          }

          if (matches.length < 4 && currentStock.volume) {
            const volMatches = pool.filter((s: any) =>
              s.volume &&
              s.volume > (currentStock.volume * 0.5) && // Within 0.5x to 2x volume range
              s.volume < (currentStock.volume * 2)
            );
            const newVolMatches = volMatches
              .filter((s: any) => !matches.find((m: any) => m.symbol === s.symbol))
              .map((s: any) => ({ ...s, reason: "Similar Volume" }));
            matches.push(...newVolMatches);
          }

          // Fallback: If still few matches, take top Market Movers (absolute change)
          if (matches.length < 4) {
            const movers = pool
              .filter((s: any) => !matches.find((m: any) => m.symbol === s.symbol))
              .sort((a: any, b: any) => Math.abs(b.change_percent) - Math.abs(a.change_percent))
              .slice(0, 4 - matches.length)
              .map((s: any) => ({ ...s, reason: "Market Peer" }));
            matches.push(...movers);
          }

          setSimilarStocks(matches.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch similar stocks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarStocks();
  }, [currentStock]);

  if (!currentStock || loading || similarStocks.length === 0) return null;

  return (
    <div className="p-8 rounded-3xl bg-card border border-border mt-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Activity className="text-blue-500" />
        Similar Stocks & Market Peers
      </h2>

      <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible scrollbar-hide snap-x">
        {similarStocks.map((stock) => {
          const isPositive = stock.change >= 0;
          return (
            <Link key={stock.symbol} href={`/stock/${stock.symbol}`} className="min-w-[280px] md:min-w-0 snap-center">
              <div className="group relative p-4 rounded-2xl border border-border bg-muted/20 hover:bg-muted/50 transition-all hover:-translate-y-1 hover:border-border h-full">
                {/* Reason Tag */}
                <div className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                  {stock.reason}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {stock.symbol[0]}
                  </div>
                  <div>
                    <div className="font-bold text-foreground group-hover:text-foreground transition-colors">
                      {stock.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground truncate w-24">
                      {stock.longName || stock.name || "NSE Stock"}
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-foreground">
                    ₹{stock.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
                    isPositive ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                  )}>
                    {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(stock.change_percent).toFixed(2)}%
                  </div>
                </div>

                {/* Mini Metrics */}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="mb-1">P/E</span>
                    <span className="text-foreground">{stock.pe_ratio?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="mb-1">Vol</span>
                    <span className="text-foreground">{(stock.volume / 1000).toFixed(1)}k</span>
                  </div>
                </div>

              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
