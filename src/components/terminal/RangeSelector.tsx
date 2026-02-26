"use client";

import { cn } from "@/lib/utils";

export type RangeValue = "5y" | "1y" | "3m" | "1m" | "5d" | "1d";

interface RangeSelectorProps {
  activeRange: RangeValue;
  onRangeChange: (r: RangeValue) => void;
}

const RANGES: { label: string; value: RangeValue }[] = [
  { label: "5y", value: "5y" },
  { label: "1y", value: "1y" },
  { label: "3m", value: "3m" },
  { label: "1m", value: "1m" },
  { label: "5d", value: "5d" },
  { label: "1d", value: "1d" },
];

export function RangeSelector({ activeRange, onRangeChange }: RangeSelectorProps) {
  return (
    <div className="flex items-center bg-transparent p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onRangeChange(r.value)}
          className={cn(
            "px-2.5 py-1 text-[13px] font-medium rounded transition-all duration-200",
            activeRange === r.value
              ? "text-[#2962FF]"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
