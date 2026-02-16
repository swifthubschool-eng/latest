"use client";

import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface Stock {
  instrument_token: number;
  last_price: number;
  change?: number; // Absolute change or percentage, depending on Kite
}

// Map instrument tokens to names (Mock mapping for demo)
const TOKEN_MAP: Record<number, string> = {
  738561: "RELIANCE",
  2953217: "TCS",
  408065: "INFOSYS",
};

export function StockPrice() {
  const { isConnected, stockData } = useSocket();
  const [stocks, setStocks] = useState<Record<number, Stock>>({});
  const prevPrices = useRef<Record<number, number>>({});
  const [flash, setFlash] = useState<Record<number, "up" | "down" | null>>({});

  useEffect(() => {
    if (stockData) {
      const updates = Array.isArray(stockData) ? stockData : [stockData];

      const newStocks = { ...stocks };
      const newFlash = { ...flash };

      updates.forEach((tick: Stock) => {
        const token = tick.instrument_token;
        const price = tick.last_price;
        const prev = prevPrices.current[token];

        newStocks[token] = tick;

        if (prev !== undefined) {
          if (price > prev) newFlash[token] = "up";
          else if (price < prev) newFlash[token] = "down";
        }

        prevPrices.current[token] = price;
      });

      setStocks(newStocks);
      setFlash(newFlash);

      // Reset flash after 500ms
      const timer = setTimeout(() => {
        setFlash({});
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stockData]);

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Connecting to real-time feed...
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Object.values(stocks).map((stock) => (
        <Card key={stock.instrument_token}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {TOKEN_MAP[stock.instrument_token] || stock.instrument_token}
            </CardTitle>
            {flash[stock.instrument_token] === "up" && (
              <ArrowUpIcon className="h-4 w-4 text-green-500 animate-bounce" />
            )}
            {flash[stock.instrument_token] === "down" && (
              <ArrowDownIcon className="h-4 w-4 text-red-500 animate-bounce" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold transition-colors duration-300",
              flash[stock.instrument_token] === "up" ? "text-green-500 bg-green-100 dark:bg-green-900/30" : "",
              flash[stock.instrument_token] === "down" ? "text-red-500 bg-red-100 dark:bg-red-900/30" : ""
            )}>
              ₹{stock.last_price.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      ))}
      {Object.keys(stocks).length === 0 && (
        <div className="col-span-3 text-center text-muted-foreground">
          Waiting for ticks...
        </div>
      )}
    </div>
  );
}
