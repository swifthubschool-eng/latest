"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Define the Stock data type
export type Stock = {
  symbol: string;
  name: string;
  price?: number;
  changePercent?: number;
  volume?: string;
  relVolume?: number;
  marketCap?: string;
  pe?: number | string;
  epsDil?: number | string;
  epsDilGrowth?: string; // Percentage
  divYield?: string; // Percentage
  sector?: string;
  icon?: string; // Optional icon URL or component
  isEtf?: boolean; // Flag for special styling
};

type Instrument = {
  symbol: string;
  name: string;
  instrument_token: number;
  lot_size: number;
};

type Quote = {
  instrument_token: number;
  timestamp: string;
  last_price: number;
  net_change: number;
  change: number;
  change_percent: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  volume?: number;
  market_cap?: number;
  pe_ratio?: number;
  eps?: number;
  sector?: string;
  div_yield?: number;
  average_volume_10d?: number;
  eps_forward?: number;
  eps_growth?: number; // New field
  rel_volume?: number; // New field
  beta?: number;
  depth: any;
};

type SortConfig = {
  key: keyof Stock;
  direction: "asc" | "desc";
} | null;

export function StockTable({ activeFilter = "All stocks" }: { activeFilter?: string }) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [visibleCount, setVisibleCount] = useState(100); // Start with 100 stocks
  const [loading, setLoading] = useState(true);

  // Fetch Instruments on Mount
  useEffect(() => {
    async function fetchInstruments() {
      try {
        const res = await fetch("/api/stocks/instruments");
        const data = await res.json();
        if (Array.isArray(data)) {
          // Default sort by symbol
          data.sort((a: Instrument, b: Instrument) =>
            (a.symbol || "").localeCompare(b.symbol || "")
          );
          setInstruments(data);
        }
      } catch (error) {
        console.error("Failed to fetch instruments", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInstruments();
  }, []);

  // Filter and Sort Logic for Instruments
  const processedInstruments = React.useMemo(() => {
    let list = [...instruments];

    // 1. Apply Filtering (e.g. Large-cap)
    if (activeFilter === "Large-cap") {
      list = list.filter(inst => {
        if (!inst.symbol) return false;
        const quote = quotes[inst.symbol.toUpperCase()];
        if (!quote) return true; // Keep loading ones
        return (quote.market_cap || 0) >= 200000000000; // ₹20,000 Cr+
      });
    } else if (activeFilter === "Small-cap") {
      list = list.filter(inst => {
        if (!inst.symbol) return false;
        const quote = quotes[inst.symbol.toUpperCase()];
        if (!quote) return true;
        // Small cap typically < ₹5,000 Cr in Indian markets
        return (quote.market_cap || 0) > 0 && (quote.market_cap || 0) < 50000000000;
      });
    }

    // 2. Apply "Top" Rankin Logic if quotes are available
    // Note: This only sorts based on already fetched quotes.
    if (activeFilter === "Top gainers") {
      list.sort((a, b) => {
        const sa = a.symbol ? a.symbol.toUpperCase() : "";
        const sb = b.symbol ? b.symbol.toUpperCase() : "";
        const qa = quotes[sa]?.change_percent ?? -999;
        const qb = quotes[sb]?.change_percent ?? -999;
        return qb - qa;
      });
    } else if (activeFilter === "Top losers") {
      list.sort((a, b) => {
        const sa = a.symbol ? a.symbol.toUpperCase() : "";
        const sb = b.symbol ? b.symbol.toUpperCase() : "";
        const qa = quotes[sa]?.change_percent ?? 999;
        const qb = quotes[sb]?.change_percent ?? 999;
        return qa - qb;
      });
    } else if (activeFilter === "Most active" || activeFilter === "Unusual volume") {
      list.sort((a, b) => {
        const sa = a.symbol ? a.symbol.toUpperCase() : "";
        const sb = b.symbol ? b.symbol.toUpperCase() : "";
        const qa = quotes[sa]?.volume ?? 0;
        const qb = quotes[sb]?.volume ?? 0;
        return qb - qa;
      });
    } else if (sortConfig) {
      // Manual column sorting
      list.sort((a, b) => {
        let aVal: any = "";
        let bVal: any = "";

        const sa = a.symbol ? a.symbol.toUpperCase() : "";
        const sb = b.symbol ? b.symbol.toUpperCase() : "";

        const qa = quotes[sa];
        const qb = quotes[sb];

        if (sortConfig.key === "symbol") {
          aVal = a.symbol || "";
          bVal = b.symbol || "";
        } else if (sortConfig.key === "price") {
          aVal = qa?.last_price ?? 0;
          bVal = qb?.last_price ?? 0;
        } else if (sortConfig.key === "changePercent") {
          aVal = qa?.change_percent ?? 0;
          bVal = qb?.change_percent ?? 0;
        } else if (sortConfig.key === "volume") {
          aVal = qa?.volume ?? 0;
          bVal = qb?.volume ?? 0;
        } else if (sortConfig.key === "marketCap") {
          aVal = qa?.market_cap ?? 0;
          bVal = qb?.market_cap ?? 0;
        } else if (sortConfig.key === "relVolume") {
          aVal = qa?.rel_volume ?? 0;
          bVal = qb?.rel_volume ?? 0;
        } else if (sortConfig.key === "pe") {
          aVal = qa?.pe_ratio ?? 0;
          bVal = qb?.pe_ratio ?? 0;
        } else if (sortConfig.key === "epsDil") {
          aVal = qa?.eps ?? 0;
          bVal = qb?.eps ?? 0;
        } else if (sortConfig.key === "epsDilGrowth") {
          aVal = qa?.eps_growth ?? -999;
          bVal = qb?.eps_growth ?? -999;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [instruments, quotes, activeFilter, sortConfig]);

  const visibleInstruments = processedInstruments.slice(0, visibleCount);

  // Fetch Quotes for Visible Instruments
  useEffect(() => {
    if (visibleInstruments.length === 0) return;

    // Only fetch symbols that we don't have or are stale (> 1 minute old)
    const now = Date.now();
    const CACHE_DURATION = 60000; // 1 minute

    const symbolsToFetch = visibleInstruments
      .filter(inst => {
        const quote = quotes[inst.symbol];
        if (!quote) return true; // No quote, need to fetch
        const quoteTime = quote.timestamp ? new Date(quote.timestamp).getTime() : 0;
        return (now - quoteTime) > CACHE_DURATION; // Stale quote, need to refresh
      })
      .map(inst => inst.symbol)
      .filter(sym => sym && sym.trim() !== "");

    if (symbolsToFetch.length === 0) return; // All quotes are fresh!

    // chunking might be needed if visibleCount gets huge, but for < 100 it's fine
    async function fetchQuotes() {
      try {
        // Chunk symbols into batches of 50 to avoid URL length limits and rate limits
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < symbolsToFetch.length; i += chunkSize) {
          chunks.push(symbolsToFetch.slice(i, i + chunkSize));
        }

        const allNewQuotes: Record<string, Quote> = {};

        // Fetch all chunks in parallel
        await Promise.all(chunks.map(async (batch) => {
          const query = batch.join(",");
          const res = await fetch(`/api/stocks/quotes?symbols=${query}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            data.data.forEach((quoteData: any) => {
              const sym = quoteData.symbol.toUpperCase();
              allNewQuotes[sym] = {
                instrument_token: quoteData.instrument_token || 0,
                timestamp: quoteData.timestamp || new Date().toISOString(),
                last_price: quoteData.last_price,
                net_change: quoteData.change,
                change: quoteData.change,
                change_percent: quoteData.change_percent,
                volume: quoteData.volume,
                market_cap: quoteData.market_cap,
                pe_ratio: quoteData.pe_ratio,
                eps: quoteData.eps,
                eps_forward: quoteData.eps_forward,
                eps_growth: quoteData.eps_growth, // Map new field
                rel_volume: quoteData.rel_volume, // Map new field
                div_yield: quoteData.div_yield,
                average_volume_10d: quoteData.average_volume_10d,
                beta: quoteData.beta,
                sector: quoteData.sector,
                ohlc: quoteData.ohlc || { open: 0, high: 0, low: 0, close: quoteData.last_price - quoteData.change },
                depth: quoteData.depth || {},
              };
            });
          }
        }));

        // console.log(`Fetched quotes for ${Object.keys(allNewQuotes).length} symbols.`);
        setQuotes(prev => ({ ...prev, ...allNewQuotes }));
      } catch (e) {
        console.error("Failed to fetch quotes", e);
      }
    }

    // Debounce the fetch to avoid rapid successive calls
    const timeoutId = setTimeout(() => {
      fetchQuotes();
    }, 500); // Wait 500ms after last change before fetching

    return () => clearTimeout(timeoutId);
  }, [visibleCount, processedInstruments]); // Use processedInstruments instead of sortedInstruments

  const handleSort = (key: keyof Stock) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Simulate a bit of delay for feedback or just let it update
    setVisibleCount(prev => prev + 100);
    // The useEffect will trigger and eventually reset loading state if we add logic, 
    // but for now let's just use it to show a spinner or text change.
    setTimeout(() => setLoadingMore(false), 500);
  };

  const headers: { key: keyof Stock; label: string }[] = [
    { key: "symbol", label: "Symbol" },
    { key: "price", label: "Price" },
    { key: "changePercent", label: "Change %" },
    { key: "volume", label: "Volume" },
    { key: "relVolume", label: "Rel Volume" },
    { key: "marketCap", label: "Market cap" },
    { key: "pe", label: "P/E" },
    { key: "epsDil", label: "EPS dil\nTTM" },
    { key: "epsDilGrowth", label: "EPS dil growth\nTTM YoY" },
    { key: "divYield", label: "Div yield %\nTTM" },
    { key: "sector", label: "Sector" },
  ];

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading market data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted text-xs uppercase text-muted-foreground font-medium">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group whitespace-nowrap"
                  onClick={() => handleSort(header.key)}
                >
                  <div className="flex items-center gap-1">
                    <span className="whitespace-pre-line">{header.label}</span>
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleInstruments
              .filter((inst) => {
                if (!inst.symbol) return false;
                const quote = quotes[inst.symbol.toUpperCase()];
                // Show if quote not loaded yet, or if loaded and price > 0
                return !quote || quote.last_price > 0;
              })
              .map((inst) => {
                if (!inst.symbol) return null;
                const quote = quotes[inst.symbol.toUpperCase()];
                const price = quote?.last_price || 0;
                const change = quote?.change || 0;
                const changePercent = quote?.change_percent || 0;

                return (
                  <tr key={inst.symbol} className="hover:bg-muted transition-colors group">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {inst.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-foreground font-semibold">{inst.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{inst.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {quote ? (
                        <>
                          {price.toLocaleString("en-IN", { minimumFractionDigits: 2 })} <span className="text-xs text-muted-foreground">INR</span>
                        </>
                      ) : <span className="animate-pulse bg-muted h-4 w-12 rounded inline-block"></span>}
                    </td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", change >= 0 ? "text-green-500" : "text-red-500")}>
                      {quote ? (
                        <>
                          {change > 0 ? "+" : ""}{changePercent.toFixed(2)}%
                        </>
                      ) : <span className="animate-pulse bg-muted h-4 w-12 rounded inline-block"></span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {quote?.volume ? (quote.volume >= 10000000 ? `${(quote.volume / 10000000).toFixed(2)}Cr` : (quote.volume >= 100000 ? `${(quote.volume / 100000).toFixed(2)}L` : quote.volume.toLocaleString("en-IN"))) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-center">
                      {quote?.rel_volume ? `${quote.rel_volume}x` : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {quote?.market_cap ? (quote.market_cap >= 1000000000000 ? `${(quote.market_cap / 1000000000000).toFixed(2)}T` : (quote.market_cap >= 10000000 ? `${(quote.market_cap / 10000000).toFixed(2)}Cr` : (quote.market_cap >= 100000 ? `${(quote.market_cap / 100000).toFixed(2)}L` : quote.market_cap.toLocaleString("en-IN")))) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {quote?.pe_ratio ? quote.pe_ratio.toFixed(2) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {quote?.eps ? quote.eps.toFixed(2) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-center">
                      {quote?.eps_growth ? (
                        <span className={cn(quote.eps_growth > 0 ? "text-green-400" : "text-red-400")}>
                          {quote.eps_growth.toFixed(1)}%
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-center">
                      {quote?.div_yield ? `${(quote.div_yield * 100).toFixed(2)}%` : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {quote?.sector || "-"}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {visibleInstruments.length < instruments.length && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground min-w-[200px]"
            disabled={loadingMore}
          >
            {loadingMore ? "Fetching more stocks..." : "Load more stocks"}
            {!loadingMore && <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
