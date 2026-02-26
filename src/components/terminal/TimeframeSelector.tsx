"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimeframeValue = "minute" | "2minute" | "3minute" | "5minute" | "10minute" | "15minute" | "30minute" | "60minute" | "4hour" | "day" | "week" | "month";

export interface TimeframeOption {
  label: string;
  value: TimeframeValue;
}

interface TimeframeSelectorProps {
  activeTimeframe: TimeframeValue;
  onTimeframeChange: (tf: TimeframeValue) => void;
}

// Grouped for dropdown
const TIMEFRAME_GROUPS = {
  MINUTES: [
    { label: "1m", value: "minute" },
    { label: "2m", value: "2minute" },
    { label: "3m", value: "3minute" },
    { label: "5m", value: "5minute" },
    { label: "10m", value: "10minute" },
    { label: "15m", value: "15minute" },
    { label: "30m", value: "30minute" },
  ] as TimeframeOption[],
  HOURS: [
    { label: "1h", value: "60minute" },
    { label: "4h", value: "4hour" },
  ] as TimeframeOption[],
  DAYS: [
    { label: "1D", value: "day" },
    { label: "1W", value: "week" },
    { label: "1M", value: "month" },
  ] as TimeframeOption[],
};

// Default quick buttons
const QUICK_TIMEFRAMES: TimeframeOption[] = [
  { label: "1m", value: "minute" },
  { label: "5m", value: "5minute" },
  { label: "15m", value: "15minute" },
  { label: "30m", value: "30minute" },
  { label: "1h", value: "60minute" },
  { label: "1D", value: "day" },
];

export function TimeframeSelector({ activeTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick lookup to find label for active timeframe if it's not in quick options
  const allOptions = [
    ...TIMEFRAME_GROUPS.MINUTES,
    ...TIMEFRAME_GROUPS.HOURS,
    ...TIMEFRAME_GROUPS.DAYS,
  ];
  
  const activeLabel = allOptions.find(o => o.value === activeTimeframe)?.label || "1m";

  // Check if active timeframe is inside the quick buttons array
  const isCustomTimeframeActive = !QUICK_TIMEFRAMES.some(q => q.value === activeTimeframe);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: TimeframeValue) => {
    onTimeframeChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <div className="flex items-center bg-[#1e222d] border border-white/10 rounded-lg p-0.5 shadow-sm">
        
        {/* Render base quick timeframes */}
        {QUICK_TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeframeChange(tf.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              activeTimeframe === tf.value
                ? "bg-[#2962FF] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            {tf.label}
          </button>
        ))}

        {/* If a custom timeframe from dropdown is active, show it next to our quick buttons */}
        {isCustomTimeframeActive && (
          <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-[#2962FF] text-white shadow-sm ml-0.5 transition-all">
            {activeLabel}
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Dropdown Toggle Tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "px-2 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none",
            isOpen && "bg-white/10 text-white"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e222d] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden text-sm">
          {Object.entries(TIMEFRAME_GROUPS).map(([category, options]) => (
            <div key={category} className="py-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 tracking-wider">
                {category}
              </div>
              <div className="flex flex-col">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "text-left px-4 py-2 hover:bg-[#2a2e39] transition-colors flex items-center justify-between",
                      activeTimeframe === opt.value ? "text-[#2962FF] font-medium" : "text-gray-300"
                    )}
                  >
                    <span>{opt.label}</span>
                    {activeTimeframe === opt.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2962FF]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
