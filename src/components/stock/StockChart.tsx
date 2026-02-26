"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, CandlestickChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockChartProps {
  symbol: string;
  stockData: any;
}

export function StockChart({ symbol, stockData }: StockChartProps) {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [range, setRange] = useState("1d");

  useEffect(() => {
    if (!symbol) return;

    const fetchHistoricalData = async () => {
      // isIndex check removed to treat indices like normal stocks
      // They will now fetch from /api/stocks/[symbol]/historical

      try {
        const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/historical?range=${range}`);

        // If API returns 404 or error, handle gracefully
        if (!res.ok) {
          console.log(`No historical data available for ${symbol}`);
          setHistoricalData([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setHistoricalData(data);
        } else {
          console.error("Historical data format error:", data);
          setHistoricalData([]); // Clear chart on error
        }
      } catch (error) {
        console.error("Error fetching historical chart data:", error);
        setHistoricalData([]);
      }
    };

    fetchHistoricalData();

    // Refresh chart every minute only for 1d view
    let interval: NodeJS.Timeout;
    if (range === "1d") {
      interval = setInterval(fetchHistoricalData, 60000);
    }

    return () => clearInterval(interval);
  }, [symbol, range]);

  const change = stockData?.change || 0;
  const changePercent = stockData?.change_percent || 0;
  const price = stockData?.last_price || 0;
  const longName = stockData?.longName || symbol;

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
  };

  const calculateChange = () => {
    if (range === "1d" && (change !== 0 || changePercent !== 0)) {
      return { value: change, percent: changePercent };
    }

    if (historicalData.length > 0) {
      const first = historicalData[0]?.open || historicalData[0]?.price || 0;
      const last = historicalData[historicalData.length - 1]?.price || 0;
      const val = last - first;
      const pct = first !== 0 ? (val / first) * 100 : 0;
      return { value: val, percent: pct };
    }

    return { value: change, percent: changePercent };
  };

  const { value: displayChange, percent: displayChangePercent } = calculateChange();

  // Create clean ID for SVG gradient
  const chartId = `colorPrice-${symbol.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="p-4 md:p-8 rounded-3xl bg-card border border-border relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold mb-1 text-foreground">{longName}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">{symbol}</span>
              <span className="text-xs">•</span>
              <span className="text-xs">{symbol.includes("SENSEX") || symbol.includes("BSE") ? "BSE" : "NSE"}</span>
              <div className="flex items-center gap-1 text-xs">
                <Activity className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={cn(
            "flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold",
            displayChange >= 0
              ? "text-green-500 bg-green-500/10"
              : "text-red-500 bg-red-500/10"
          )}>
            {displayChange >= 0
              ? <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" />
              : <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4" />}
            {displayChange > 0 ? "+" : ""}{displayChange.toFixed(2)}
            ({displayChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-10 h-[250px] md:h-[450px] w-full mt-4 md:mt-8">
        {historicalData.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-border rounded-2xl bg-muted/20">
            <div className="text-center px-4">
              <Activity className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Live index data available</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Historical chart coming soon</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={displayChange >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={displayChange >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                minTickGap={40}
                dy={12}
              />
              <YAxis
                hide
                domain={[
                  (dataMin: number) => dataMin - (dataMin * 0.001),
                  (dataMax: number) => dataMax + (dataMax * 0.001)
                ]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Price']}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '4px' }}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={displayChange >= 0 ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${chartId})`}
                activeDot={{
                  r: 5,
                  fill: displayChange >= 0 ? "#22c55e" : "#ef4444",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Period Selector */}
      <div className="relative z-10 mt-6 flex gap-2 text-sm">
        {['1d', '5d', '1m', '1y', '5y'].map((r) => (
          <button
            key={r}
            onClick={() => handleRangeChange(r)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors",
              range === r
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {r.toUpperCase()}
          </button>
        ))}
        <div className="flex-1" />
        <a href={`/terminal/${symbol}`} target="_blank" rel="noopener noreferrer">
          <button
            className="px-3 py-1.5 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 border border-border"
          >
            Terminal <CandlestickChart className="h-4 w-4" />
          </button>
        </a>
      </div>
    </div >
  );
}
