"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";

// Initial data... (keep existing mocked data as base)
const INDICES = [
  { name: "NIFTY 50", symbol: "NIFTY 50", price: "25,807.20", currency: "INR", change: "-0.57%", trending: "down" },
  { name: "SENSEX", symbol: "SENSEX", price: "83,674.92", currency: "INR", change: "-0.66%", trending: "down" },
  { name: "NIFTY BANK", symbol: "NIFTY BANK", price: "60,739.75", currency: "INR", change: "-0.01%", trending: "down" },
  { name: "MIDCAP 100", symbol: "NIFTY MIDCAP 100", price: "60,470.85", currency: "INR", change: "-0.47%", trending: "down" },
  { name: "SMALLCAP 100", symbol: "NIFTY SMLCAP 100", price: "17,344.10", currency: "INR", change: "-0.64%", trending: "down" },
  { name: "NIFTY FIN", symbol: "NIFTY FIN SERVICE", price: "28,385.20", currency: "INR", change: "+0.38%", trending: "up" },
];

export function MarketSummary() {
  const { socket, isConnected } = useSocket();
  const [indices, setIndices] = useState(INDICES);
  const [data, setData] = useState<any[]>([]); // Start empty
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change, setChange] = useState({ value: 0, percent: 0 });
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/stocks/NIFTY%2050/historical?range=1d");
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const chartData = json.map((item: any) => ({
            time: item.time,
            value: item.price
          }));
          setData(chartData);
          setCurrentPrice(chartData[chartData.length - 1].value);
        }
      } catch (err) {
        console.error("Failed to fetch Nifty 50 data", err);
      }
    };
    fetchData();
  }, []);

  // Socket Updates
  useEffect(() => {
    if (!socket) return;

    // ... existing socket logic ...
    const handleIndexUpdate = (update: { symbol: string; price: number; change?: number; percent?: number; timestamp: string }) => {
      if (update.symbol === "NIFTY 50") {
        setCurrentPrice(update.price);
        if (update.change !== undefined && update.percent !== undefined) {
          setChange({ value: update.change, percent: update.percent });
        }

        setData(prev => {
          // Format current IST time as HH:MM
          const now = new Date();
          const timeLabel = now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit', minute: '2-digit', hour12: false
          });

          const newPoint = { time: timeLabel, value: update.price };

          if (prev.length === 0) return [newPoint];

          // Only add a new point if the time label is different from the last
          const last = prev[prev.length - 1];
          if (last.time === timeLabel) {
            // Same minute — update last point in place
            return [...prev.slice(0, -1), { ...last, value: update.price }];
          }

          // New minute — append (cap at 375 points = full trading session)
          const updated = [...prev, newPoint];
          return updated.length > 375 ? updated.slice(-375) : updated;
        });
      }

      // ... existing indices update logic ...
      setIndices(prevIndices => {
        return prevIndices.map(index => {
          if (index.symbol === update.symbol) {
            // ...
            return { ...index, price: update.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }), change: `${(update.change || 0) > 0 ? "+" : ""}${(update.percent || 0).toFixed(2)}%`, trending: (update.change || 0) >= 0 ? "up" : "down" };
          }
          return index;
        });
      });
    };

    socket.on("index-update", handleIndexUpdate);
    return () => { socket.off("index-update", handleIndexUpdate); };
  }, [socket]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Chart Section */}
      <div className="flex-1 p-8 rounded-3xl bg-card border border-border relative overflow-hidden group">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex bg-muted rounded-full p-1 pr-4 items-center gap-3 border border-border">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              50
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">Nifty 50</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">NIFTY</span>
                {/* Connection Indicator */}
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
                )} title={isConnected ? "Live Connected" : "Connecting..."} />
              </div>
            </div>
          </div>
        </div>

        {/* Price & Change */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-lg text-muted-foreground font-medium">INR</span>
            <span className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold ml-2",
              change.value >= 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
            )}>
              {change.value >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {change.value > 0 ? "+" : ""}{change.value.toFixed(2)} ({change.percent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Area Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} onMouseMove={(e: any) => { if (e.activePayload) setHoveredData(e.activePayload[0].payload) }} onMouseLeave={() => setHoveredData(null)}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={change.value >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={change.value >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.0} />
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
                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '4px' }}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={change.value >= 0 ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{
                  r: 5,
                  fill: change.value >= 0 ? "#22c55e" : "#ef4444",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right Sidebar: Major Indices */}
      <div className="w-full lg:w-96 p-6 rounded-3xl bg-card border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6">Major indices</h3>

        <div className="space-y-4">
          {indices.map((index) => (
            <Link key={index.name} href={`/indices/${encodeURIComponent(index.symbol)}`}>
              <div className="flex items-center justify-between group hover:bg-muted p-2 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-border",
                    index.name === "NIFTY 50" ? "bg-blue-600 text-white" :
                      index.name === "SENSEX" ? "bg-purple-600 text-white" :
                        index.name === "NIFTY BANK" ? "bg-green-600 text-white" :
                          index.name === "NIFTY FIN" ? "bg-yellow-600 text-white" :
                            "bg-muted text-muted-foreground"
                  )}>
                    {index.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground group-hover:text-blue-400 transition-colors">{index.name}</span>
                      {index.currency !== "INR" && <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded">{index.currency}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{index.symbol}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {index.price} <span className="text-xs text-muted-foreground font-normal">{index.currency}</span>
                  </div>
                  <div className={cn(
                    "text-xs font-medium flex items-center justify-end gap-1",
                    index.trending === "up" ? "text-green-500" : "text-red-500"
                  )}>
                    {index.change}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/indices">
          <button className="w-full mt-6 py-2 text-sm text-primary hover:text-primary/80 transition-colors text-left flex items-center gap-1">
            See all major Indices <ArrowUpRight className="h-3 w-3" />
          </button>
        </Link>
      </div>
    </div>
  );
}
