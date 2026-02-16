"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { StockChart } from "@/components/stock/StockChart";
import { StockPerformance } from "@/components/stock/StockPerformance";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";

// Mapping of Indices to their Constituent Stocks (Simplified for MVP)
const INDEX_CONSTITUENTS: Record<string, string[]> = {
  "NIFTY 50": [
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "HINDUNILVR", "ITC", "LT", "SBIN", "BHARTIARTL"
  ],
  "SENSEX": [
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "HINDUNILVR", "ITC", "LT", "SBIN", "BHARTIARTL"
  ],
  "NIFTY BANK": [
    "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK", "BANKBARODA", "PNB", "IDFCFIRSTB", "AUBANK"
  ],
  "NIFTY IT": [
    "TCS", "INFY", "HCLTECH", "WIPRO", "LTIM", "TECHM", "PERSISTENT", "MPHASIS", "COFORGE", "LTTS"
  ]
};

export default function IndexDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawSymbol = decodeURIComponent((params.symbol as string) || "");
  const symbol = rawSymbol.toUpperCase();

  const [indexData, setIndexData] = useState<any>(null);
  const [constituents, setConstituents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // WebSocket integration
  const { socket } = useSocket();

  // 1. Fetch Index Data & Constituents
  useEffect(() => {
    if (!symbol) return;

    const fetchIndexData = async () => {
      try {
        // Fetch Index Data (Quotes API handles NIFTY 50 etc)
        const res = await fetch(`/api/stocks/quotes?symbols=${encodeURIComponent(symbol)}`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          setIndexData(data.data[0]);
        } else {
          // Fallback minimal structure
          setIndexData({
            symbol: symbol,
            last_price: 0,
            change: 0,
            change_percent: 0,
            longName: symbol,
            ohlc: {}
          });
        }
      } catch (e) {
        console.error("Failed to fetch index data", e);
      }
    };

    fetchIndexData();

    const fetchConstituents = async () => {
      // Find the closest matching index key (e.g. "NIFTY 50" -> "NIFTY 50")
      // Simple lookup for now
      let foundKey = Object.keys(INDEX_CONSTITUENTS).find(k => symbol.includes(k));
      const symbols = foundKey ? INDEX_CONSTITUENTS[foundKey] : [];

      if (symbols.length > 0) {
        try {
          const res = await fetch(`/api/stocks/quotes?symbols=${symbols.join(",")}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setConstituents(data.data);
          }
        } catch (e) {
          console.error("Failed to fetch constituents", e);
        }
      }
      setLoading(false);
    };

    fetchConstituents();

  }, [symbol]);


  // 2. Real-time Updates for Index
  useEffect(() => {
    if (!socket || !symbol) return;

    // Subscribe to index updates
    socket.emit("subscribe", symbol);

    const handleIndexUpdate = (update: any) => {
      // Handle both "index-update" and generic "stock-update" structures if they differ
      if (update.symbol === symbol) {
        setIndexData((prev: any) => {
          if (!prev) return prev;

          const currentPrice = update.price;
          const newOhlc = prev.ohlc ? { ...prev.ohlc } : { high: currentPrice, low: currentPrice, open: currentPrice, close: 0 };

          if (currentPrice > newOhlc.high) newOhlc.high = currentPrice;
          if (currentPrice < newOhlc.low) newOhlc.low = currentPrice;

          return {
            ...prev,
            last_price: currentPrice,
            change: update.change,
            change_percent: update.percent,
            timestamp: update.timestamp,
            ohlc: newOhlc
          };
        });
      }
    };

    // Listen to both channels just in case
    socket.on("index-update", handleIndexUpdate);
    socket.on("stock-update", handleIndexUpdate);

    return () => {
      socket.off("index-update", handleIndexUpdate);
      socket.off("stock-update", handleIndexUpdate);
      socket.emit("unsubscribe", symbol);
    };
  }, [socket, symbol]);


  if (!symbol) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-4 md:p-6 max-w-7xl">

        {/* Header / Back */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{symbol}</h1>
            <span className="text-sm text-muted-foreground">Index Overview</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Main Chart Section */}
          <StockChart symbol={symbol} stockData={indexData} />

          <StockPerformance stockData={indexData} />

          {/* Constituents List */}
          <div className="p-4 md:p-6 rounded-3xl bg-card border border-border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="text-blue-500" />
              Top Constituents
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-3 font-medium">Company</th>
                    <th className="py-3 font-medium text-right">Price</th>
                    <th className="py-3 font-medium text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border">
                  {constituents.length > 0 ? constituents.map((stock) => {
                    const isPositive = stock.change >= 0;
                    return (
                      <tr key={stock.symbol} className="hover:bg-muted transition-colors cursor-pointer" onClick={() => router.push(`/stock/${stock.symbol}`)}>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-foreground">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs">{stock.longName || stock.name}</div>
                        </td>
                        <td className="py-4 text-right font-mono text-muted-foreground">
                          ₹{stock.last_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={cn(
                          "py-4 text-right font-medium pl-4",
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        )}>
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(stock.change_percent)?.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        {loading ? "Loading constituents..." : "Constituent data coming soon."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
