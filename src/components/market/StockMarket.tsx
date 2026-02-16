"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { StockTable } from "./StockTable";
import { Search, ListFilter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const filters = [
  "All stocks",
  "Top gainers",
  "Top losers",
  "Large-cap",
  "Small-cap",
  "Most active",
  "Unusual volume",
];

const tabs = [
  "Overview",
  "Volume"
];

export function StockMarket() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");
  const [activeFilter, setActiveFilter] = useState(initialFilter || "All stocks");
  const [activeTab, setActiveTab] = useState("Overview");

  // Keep internal state in sync with URL if changed
  React.useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-border",
              activeFilter === filter
                ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {filter}
          </button>
        ))}
        <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 ml-2">
          Create more lists in Screener &gt;
        </button>
      </div>

      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">All Indian stocks</h1>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Stocks are fungible financial instruments, representing ownership in a company. Traders invest in
          stocks to capitalize on the difference between buying and selling prices, or dividends. See all Indian
          stocks below, sorted alphabetically.
        </p>
      </div>

      {/* Tabs and Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-6 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Content based on Tab */}
        <div className="min-h-[400px]">
          {activeTab === "Overview" ? (
            <StockTable activeFilter={activeFilter} />
          ) : activeTab === "Volume" ? (
            <StockTable activeFilter="Most active" />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-border bg-background rounded-lg h-[400px]">
              <ListFilter className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-muted-foreground">
                {activeTab} data coming soon
              </p>
              <p className="text-sm">
                Detailed data visualization for {activeTab.toLowerCase()} will be implemented here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
