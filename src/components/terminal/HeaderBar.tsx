"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface HeaderBarProps {
  symbol: string;
  instrumentToken: number;
}

export function HeaderBar({ symbol, instrumentToken }: HeaderBarProps) {
  return (
    <header className="h-14 border-b border-border flex items-center px-4 justify-between bg-[#131722] text-white">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => window.location.href = '/dashboard'}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Market
          </Button>
        <div className="h-6 w-px bg-border/50" />
        
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg">{symbol} Terminal</h1>
          <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
            TOKEN: {instrumentToken}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Additional header actions can go here later */}
      </div>
    </header>
  );
}
