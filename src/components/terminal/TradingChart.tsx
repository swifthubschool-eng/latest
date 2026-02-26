"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries, UTCTimestamp, Time } from "lightweight-charts";
import { useSocket } from "@/hooks/use-socket";
import { TimeframeValue } from "./TimeframeSelector";
import { RangeValue } from "./RangeSelector";

interface TradingChartProps {
  symbol: string;
  instrumentToken: number;
  interval: TimeframeValue;
  range: RangeValue;
}

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

export function TradingChart({ symbol, instrumentToken, interval, range }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const currentBarRef = useRef<any>(null);

  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" }, // Real TradingView Dark Theme
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.4)" },
        horzLines: { color: "rgba(42, 46, 57, 0.4)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        rightBarStaysOnScroll: true,
        timeVisible: true,
        secondsVisible: false,
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

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
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

        switch (range) {
          case "1d": from.setDate(from.getDate() - 2); break;
          case "5d": from.setDate(from.getDate() - 7); break;
          case "1m": from.setMonth(from.getMonth() - 1); break;
          case "3m": from.setMonth(from.getMonth() - 3); break;
          case "1y": from.setFullYear(from.getFullYear() - 1); break;
          case "5y": from.setFullYear(from.getFullYear() - 5); break;
          default: from.setDate(from.getDate() - 1);
        }

        const res = await fetch(`/api/stocks/history?token=${instrumentToken}&interval=${interval}&from=${from.toISOString()}&to=${to.toISOString()}`);
        const json = await res.json();

        if (json.status === "ok" && Array.isArray(json.data)) {
          // Manual aggregation logic would go here for unsupported intervals like 2m, 3m if not natively supported by Kite
          // For now, assume the backend is passing the string and relying on the Kite proxy.
          // Note: Kite API only supports specific intervals so production usage usually requires aggregating 1m candles.
          // We will render whatever is returned.
          
          let candles = json.data.map((c: any) => {
            const d = new Date(c[0] || c.date);
            let time: Time;
            if (["day", "week", "month"].includes(interval)) {
              time = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
            } else {
              time = (Math.floor(d.getTime() / 1000) + 19800) as UTCTimestamp;
            }

            return {
              time,
              open: c[1] || c.open,
              high: c[2] || c.high,
              low: c[3] || c.low,
              close: c[4] || c.close,
              volume: c[5] || c.volume
            };
          });
          
          candles.sort((a: any, b: any) => {
            const getTime = (t: Time) => typeof t === 'object' ? new Date(t.year, t.month - 1, t.day).getTime() : (t as number) * 1000;
            return getTime(a.time) - getTime(b.time);
          });

          // Deduplicate based on time
          const uniqueCandles: any[] = [];
          const seenTimes = new Set();
          for (const c of candles) {
            const tKey = JSON.stringify(c.time);
            if (!seenTimes.has(tKey)) {
              seenTimes.add(tKey);
              uniqueCandles.push(c);
            }
          }
          candles = uniqueCandles;

          candlestickSeriesRef.current?.setData(candles);

          chartRef.current?.timeScale().fitContent();

          if (candles.length > 0) {
            currentBarRef.current = candles[candles.length - 1];

            candlestickSeriesRef.current?.createPriceLine({
              price: candles[candles.length - 1].close,
              color: '#2962FF',
              lineWidth: 1,
              lineStyle: 2,
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
  }, [instrumentToken, interval, range]);

  // Handle Realtime Updates
  useEffect(() => {
    if (!socket || !candlestickSeriesRef.current) return;

    const handleTick = (data: any) => {
      if (data.instrument_token === instrumentToken) {
        const price = data.last_price;
        let currentBar = currentBarRef.current;
        const tickDate = new Date();

        let candleTime: Time;

        if (["day", "week", "month"].includes(interval)) {
          candleTime = { year: tickDate.getFullYear(), month: tickDate.getMonth() + 1, day: tickDate.getDate() };
        } else {
          const tickTime = Math.floor(tickDate.getTime() / 1000) + 19800; // Add IST offset
          let periodSeconds = 60;
          switch (interval) {
            case "minute": periodSeconds = 60; break;
            case "2minute": periodSeconds = 120; break;
            case "3minute": periodSeconds = 180; break;
            case "5minute": periodSeconds = 300; break;
            case "10minute": periodSeconds = 600; break;
            case "15minute": periodSeconds = 900; break;
            case "30minute": periodSeconds = 1800; break;
            case "60minute": periodSeconds = 3600; break;
            case "4hour": periodSeconds = 14400; break;
          }
           candleTime = (tickTime - (tickTime % periodSeconds)) as UTCTimestamp;
        }

        const isNewCandle = () => {
          if (!currentBar) return true;
          if (typeof candleTime === 'object' && typeof currentBar.time === 'object') {
            const t1 = candleTime as any;
            const t2 = currentBar.time as any;
            return t1.year > t2.year || (t1.year === t2.year && t1.month > t2.month) || (t1.year === t2.year && t1.month === t2.month && t1.day > t2.day);
          } else if (typeof candleTime === 'number' && typeof currentBar.time === 'number') {
            return candleTime > currentBar.time;
          }
          return false;
        };

        if (isNewCandle()) {
          const newBar = { time: candleTime, open: price, high: price, low: price, close: price, volume: 0 };
          currentBar = newBar;
          currentBarRef.current = newBar;
          candlestickSeriesRef.current?.update(newBar);
        } else {
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
    return () => { socket.off("tick", handleTick); };
  }, [socket, instrumentToken, interval]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: '#131722' }}>
      <div ref={chartContainerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/60 z-10 backdrop-blur-sm">
          <div className="flex flex-col items-center">
             <div className="w-8 h-8 rounded-full border-2 border-t-[#2962FF] border-r-[#2962FF] border-b-transparent border-l-transparent animate-spin"></div>
             <span className="mt-4 text-sm text-gray-400 font-mono tracking-wider">LOADING DATA...</span>
          </div>
        </div>
      )}
    </div>
  );
}
