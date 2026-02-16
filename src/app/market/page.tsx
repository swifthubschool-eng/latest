import { StockMarket } from "@/components/market/StockMarket";
import { Suspense } from "react";

export const metadata = {
  title: "All Indian Stocks - TradeVision",
  description: "View all Indian stocks, sort by performance, valuation, and more.",
};

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading market data...</div>}>
      <StockMarket />
    </Suspense>
  );
}
