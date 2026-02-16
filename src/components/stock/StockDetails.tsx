"use client";

import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockDetailsProps {
  stockData: any;
}

export function StockDetails({ stockData }: StockDetailsProps) {
  const details = [
    {
      label: "Market Cap",
      value: stockData.market_cap
        ? `₹${(stockData.market_cap / 10000000).toFixed(2)} Cr`
        : "N/A",
      icon: DollarSign,
      color: "text-blue-400"
    },
    {
      label: "P/E Ratio",
      value: stockData.pe_ratio?.toFixed(2) || "N/A",
      icon: BarChart3,
      color: "text-purple-400"
    },
    {
      label: "EPS",
      value: stockData.eps ? `₹${stockData.eps.toFixed(2)}` : "N/A",
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      label: "EPS Growth",
      value: stockData.eps_growth
        ? `${(stockData.eps_growth * 100).toFixed(2)}%`
        : "N/A",
      icon: stockData.eps_growth >= 0 ? TrendingUp : TrendingDown,
      color: stockData.eps_growth >= 0 ? "text-green-400" : "text-red-400"
    },
    {
      label: "Dividend Yield",
      value: stockData.div_yield
        ? `${(stockData.div_yield * 100).toFixed(2)}%`
        : "N/A",
      icon: Percent,
      color: "text-yellow-400"
    },
    {
      label: "Sector",
      value: stockData.sector || "N/A",
      icon: Building2,
      color: "text-cyan-400"
    }
  ];

  const volumeDetails = [
    {
      label: "Volume",
      value: stockData.volume
        ? stockData.volume.toLocaleString('en-IN')
        : "N/A"
    },
    {
      label: "Avg Volume",
      value: stockData.average_volume_10d
        ? stockData.average_volume_10d.toLocaleString('en-IN')
        : "N/A"
    },
    {
      label: "Rel Volume",
      value: stockData.rel_volume?.toFixed(2) || "N/A"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="space-y-3">
          {details.map((detail) => {
            const Icon = detail.icon;
            return (
              <div key={detail.label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", detail.color)} />
                  <span className="text-sm text-muted-foreground">{detail.label}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{detail.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume Info */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h2 className="text-lg font-semibold mb-4">Volume</h2>
        <div className="space-y-3">
          {volumeDetails.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{detail.label}</span>
              <span className="text-sm font-medium text-foreground">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OHLC */}
      {stockData.open && (
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-lg font-semibold mb-4">Today's Range</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Open</span>
              <span className="text-sm font-medium text-foreground">
                ₹{stockData.open?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">High</span>
              <span className="text-sm font-medium text-green-400">
                ₹{stockData.high?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Low</span>
              <span className="text-sm font-medium text-red-400">
                ₹{stockData.low?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Prev Close</span>
              <span className="text-sm font-medium text-foreground">
                ₹{stockData.close?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
