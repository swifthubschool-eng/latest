"use client";

import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface StockPerformanceProps {
  stockData: any;
}

export function StockPerformance({ stockData }: StockPerformanceProps) {
  if (!stockData) return null;

  const {
    last_price,
    ohlc,
    fifty_two_week_high,
    fifty_two_week_low
  } = stockData;

  // Use effective values
  const currentPrice = last_price || 0;

  // Daily Range
  const todayLow = ohlc?.low || currentPrice;
  const todayHigh = ohlc?.high || currentPrice;
  const open = ohlc?.open || 0;
  const prevClose = ohlc?.close || 0;

  // 52 Week Range
  const yearLow = fifty_two_week_low || todayLow; // Fallback if missing
  const yearHigh = fifty_two_week_high || todayHigh;

  // Helper to calculate percentage position for the marker
  // Position = (Current - Low) / (High - Low) * 100
  const calculatePosition = (current: number, low: number, high: number) => {
    if (high === low) return 50;
    const pos = ((current - low) / (high - low)) * 100;
    return Math.min(Math.max(pos, 0), 100); // Clamp between 0-100
  };

  const todayPosition = calculatePosition(currentPrice, todayLow, todayHigh);
  const yearPosition = calculatePosition(currentPrice, yearLow, yearHigh);

  return (
    <div className="p-6 rounded-3xl bg-card border border-border mt-6">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-bold text-foreground">Performance</h2>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Left Col: Ranges */}
        <div className="flex-1 space-y-8">

          {/* Today's Low / High */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Today's Low</span>
              <span>Today's High</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{todayLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-foreground"
                  style={{ left: `${todayPosition}%`, transform: `translate(-50%, -50%)` }}
                />
              </div>
              <span className="font-semibold">{todayHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* 52W Low / High */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>52W Low</span>
              <span>52W High</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{yearLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-foreground"
                  style={{ left: `${yearPosition}%`, transform: `translate(-50%, -50%)` }}
                />
              </div>
              <span className="font-semibold">{yearHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Stats */}
        <div className="w-full md:w-auto min-w-[200px] flex flex-row md:flex-col gap-6 md:gap-8 justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Open</div>
            <div className="text-lg font-bold">{open.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Prev. Close</div>
            <div className="text-lg font-bold">{prevClose.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
