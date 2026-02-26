"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries, UTCTimestamp, Time } from "lightweight-charts";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ZerodhaChartProps {
  symbol: string; // Display symbol (e.g. NIFTY 50)
  instrumentToken: number; // Zerodha Token
}

const TIMEFRAMES = [
  { label: "1m", value: "minute" },
  { label: "5m", value: "5minute" },
  { label: "15m", value: "15minute" },
  { label: "30m", value: "30minute" },
  { label: "1h", value: "60minute" },
  { label: "D", value: "day" },
];

function calculateMA(data: any[], period: number) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

export default function ZerodhaChart({ symbol, instrumentToken }: ZerodhaChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Track current candle for live updates
  const currentBarRef = useRef<any>(null);

  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState("minute");

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" }, // Dark Mode
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.2)" }, // Subtler grid
        horzLines: { color: "rgba(42, 46, 57, 0.2)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        rightBarStaysOnScroll: true,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightOffset: 5,
        barSpacing: 6,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        borderColor: "rgba(197, 203, 206, 0.8)",
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Overlay on main chart? No, separate.
    });

    // Add 20 MA Line
    const maSeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Set volume to use a separate price scale to not interfere with price
    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    maSeriesRef.current = maSeries;

    // Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Fetch History & Subscribe
  useEffect(() => {
    if (!instrumentToken || !candlestickSeriesRef.current) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const to = new Date();
        const from = new Date();

        // Adjust lookback based on interval
        if (interval === "minute" || interval === "5minute" || interval === "15minute" || interval === "30minute") {
          from.setDate(from.getDate() - 5);  // Last 5 days for intraday
        } else if (interval === "60minute") {
          from.setDate(from.getDate() - 60); // Last 60 days for hourly
        } else {
          from.setDate(from.getDate() - 365); // Last 1 year for daily
        }

        const res = await fetch(`/api/stocks/history?token=${instrumentToken}&interval=${interval}&from=${from.toISOString()}&to=${to.toISOString()}`);
        const json = await res.json();

        if (json.status === "ok" && Array.isArray(json.data)) {
          // Map Zerodha data [date, open, high, low, close, volume]
          // to LightweightCharts format

          const candles = json.data.map((c: any) => {
            const d = new Date(c[0] || c.date);

            let time: Time;
            if (interval === "day") {
              // Use Business Day object for Daily candles to remove weekend gaps
              time = {
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                day: d.getDate(),
              };
            } else {
              // Use Timestamp for Intraday
              time = Math.floor(d.getTime() / 1000) as UTCTimestamp;
            }

            return {
              time: time,
              open: c[1] || c.open,
              high: c[2] || c.high,
              low: c[3] || c.low,
              close: c[4] || c.close,
              volume: c[5] || c.volume
            };
          });

          // Sort strictly by time
          candles.sort((a: any, b: any) => {
            // Handle mixed types (though we shouldn't have mixed in one view)
            const getTime = (t: Time) => {
              if (typeof t === 'object') {
                return new Date(t.year, t.month - 1, t.day).getTime();
              }
              return (t as number) * 1000;
            };
            return getTime(a.time) - getTime(b.time);
          });

          // Set Data
          candlestickSeriesRef.current?.setData(candles);

          // Volume
          const volumes = candles.map((c: any) => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)"
          }));
          volumeSeriesRef.current?.setData(volumes);

          // Moving Average (20)
          const maData = calculateMA(candles, 20);
          maSeriesRef.current?.setData(maData);

          // Fit Content to fix scaling
          chartRef.current?.timeScale().fitContent();

          // Update currentBarRef to last known candle
          if (candles.length > 0) {
            currentBarRef.current = candles[candles.length - 1];

            // Add Price Line at Last Price
            const lastCandle = candles[candles.length - 1];
            candlestickSeriesRef.current?.createPriceLine({
              price: lastCandle.close,
              color: '#2962FF',
              lineWidth: 1,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'LTP',
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [instrumentToken, interval]); // Re-fetch on interval change

  // Handle Realtime Updates
  useEffect(() => {
    if (!socket || !candlestickSeriesRef.current) return;

    const handleTick = (data: any) => {
      if (data.instrument_token === instrumentToken) {
        const price = data.last_price;
        let currentBar = currentBarRef.current;
        const tickDate = new Date();

        let candleTime: Time;

        if (interval === "day") {
          candleTime = {
            year: tickDate.getFullYear(),
            month: tickDate.getMonth() + 1,
            day: tickDate.getDate(),
          };
        } else {
          const tickTime = Math.floor(tickDate.getTime() / 1000);
          let periodSeconds = 60;
          switch (interval) {
            case "minute": periodSeconds = 60; break;
            case "5minute": periodSeconds = 300; break;
            case "15minute": periodSeconds = 900; break;
            case "30minute": periodSeconds = 1800; break;
            case "60minute": periodSeconds = 3600; break;
            case "day": periodSeconds = 86400; break;
          }
          candleTime = (tickTime - (tickTime % periodSeconds)) as UTCTimestamp;
        }

        // Check if we need to start a NEW candle
        const isNewCandle = () => {
          if (!currentBar) return true;

          if (typeof candleTime === 'object' && typeof currentBar.time === 'object') {
            // Compare objects
            const t1 = candleTime as any;
            const t2 = currentBar.time as any;
            return t1.year > t2.year || (t1.year === t2.year && t1.month > t2.month) || (t1.year === t2.year && t1.month === t2.month && t1.day > t2.day);
          } else if (typeof candleTime === 'number' && typeof currentBar.time === 'number') {
            return candleTime > currentBar.time;
          }
          return false; // Should not happen with consistent types
        };

        if (isNewCandle()) {
          // NEW CANDLE
          const newBar = {
            time: candleTime,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0
          };

          currentBar = newBar;
          currentBarRef.current = newBar;
          candlestickSeriesRef.current?.update(newBar);
        } else {
          // UPDATE EXISTING CANDLE
          const updatedBar = {
            ...currentBar,
            high: Math.max(currentBar.high, price),
            low: Math.min(currentBar.low, price),
            close: price,
          };

          currentBar = updatedBar;
          currentBarRef.current = updatedBar;
          candlestickSeriesRef.current?.update(updatedBar);
        }
      }
    };

    socket.on("tick", handleTick);

    return () => {
      socket.off("tick", handleTick);
    };
  }, [socket, instrumentToken, interval]);

  return (
    <div className="w-full h-full relative group">
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Overlays */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-mono border border-border text-foreground flex items-center gap-2">
          <span className="font-bold">{symbol}</span>
          <span className="text-muted-foreground">{instrumentToken}</span>
          <span className="text-green-500">• Live</span>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-background/80 backdrop-blur p-1 rounded border border-border">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setInterval(tf.value)}
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded hover:bg-muted transition-colors",
                interval === tf.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <span className="animate-pulse text-primary font-mono">Loading Market Data...</span>
        </div>
      )}
    </div>
  );
}
