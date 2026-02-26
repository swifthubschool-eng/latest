"use client";

import { useState } from "react";
import { HeaderBar } from "./HeaderBar";
import { TimeframeSelector, TimeframeValue } from "./TimeframeSelector";
import { RangeSelector, RangeValue } from "./RangeSelector";
import { TradingChart } from "./TradingChart";

interface ChartTerminalProps {
  symbol: string;
  instrumentToken: number;
}

export function ChartTerminal({ symbol, instrumentToken }: ChartTerminalProps) {
  // Global state for interval and range
  const [timeframe, setTimeframe] = useState<TimeframeValue>("minute");
  const [range, setRange] = useState<RangeValue>("1d");

  const handleRangeChange = (newRange: RangeValue) => {
    setRange(newRange);
    switch (newRange) {
      case "1d": setTimeframe("minute"); break;
      case "5d": setTimeframe("5minute"); break;
      case "1m": setTimeframe("60minute"); break;
      case "3m": setTimeframe("day"); break;
      case "1y": setTimeframe("day"); break;
      case "5y": setTimeframe("week"); break;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131722] text-[#d1d4dc] overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <HeaderBar symbol={symbol} instrumentToken={instrumentToken} />

      {/* 2. Top Toolbar / Controls Area */}
      <div className="flex items-center px-4 py-2 border-b border-white/10 bg-[#131722] z-10 shrink-0 shadow-sm relative">
        <TimeframeSelector 
          activeTimeframe={timeframe} 
          onTimeframeChange={setTimeframe} 
        />
        
        {/* Additional tools like indicators could go here later */}
        <div className="ml-auto text-xs text-gray-500 font-medium tracking-wider">
          LIVE DATA PROXY
        </div>
      </div>

      {/* 3. Chart Area */}
      <main className="flex-1 relative bg-[#131722]">
        <TradingChart 
          symbol={symbol} 
          instrumentToken={instrumentToken} 
          interval={timeframe} 
          range={range}
        />
      </main>

      {/* 4. Bottom Toolbar */}
      <div className="flex items-center px-4 py-1 border-t border-white/10 bg-[#131722] z-10 shrink-0">
        <RangeSelector activeRange={range} onRangeChange={handleRangeChange} />
      </div>
    </div>
  );
}
