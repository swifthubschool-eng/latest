"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StockChart } from "@/components/stock/StockChart";
import { StockPerformance } from "@/components/stock/StockPerformance";
import { StockDetails } from "@/components/stock/StockDetails";
import { SimilarStocks } from "@/components/stock/SimilarStocks";
import { Button } from "@/components/ui/button";

import { useSocket } from "@/hooks/use-socket";

export default function StockPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string)?.toUpperCase();
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket integration
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!symbol || !socket) return;

    // Subscribe to real-time updates for this stock
    socket.emit("subscribe", symbol);

    const handleStockUpdate = (update: any) => {
      if (update.symbol === symbol) {
        setStockData((prev: any) => {
          if (!prev) return prev;

          const currentPrice = update.price;
          // Ensure ohlc exists or default to current price
          const newOhlc = prev.ohlc ? { ...prev.ohlc } : { high: currentPrice, low: currentPrice, open: currentPrice, close: 0 };

          if (currentPrice > newOhlc.high) newOhlc.high = currentPrice;
          if (currentPrice < newOhlc.low) newOhlc.low = currentPrice;

          return {
            ...prev,
            last_price: currentPrice,
            change: update.change,
            change_percent: update.percent,
            volume: update.volume,
            timestamp: update.timestamp,
            ohlc: newOhlc
          };
        });
      }
    };

    socket.on("stock-update", handleStockUpdate);

    return () => {
      socket.emit("unsubscribe", symbol);
      socket.off("stock-update", handleStockUpdate);
    };
  }, [symbol, socket]);

  useEffect(() => {
    if (!symbol) return;

    const fetchStockData = async () => {
      try {
        const res = await fetch(`/api/stocks/quotes?symbols=${symbol}`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          setStockData(data.data[0]);
          setError(null);
        } else {
          setError("Stock not found");
        }
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStockData();

    // We rely on WebSockets for updates now, but could keep a slow poll as backup
    // For now, let's remove the aggressive 5s poll to avoid network noise
    // const interval = setInterval(fetchStockData, 5000);
    // return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Stock not found"}</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-4 md:p-6 max-w-7xl">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Content */}
        <div className="flex flex-col gap-6">
          <StockChart symbol={symbol} stockData={stockData} />
          <StockPerformance stockData={stockData} />
          <StockDetails stockData={stockData} />
          <SimilarStocks currentStock={stockData} />
        </div>
      </div>
    </div>
  );
}
