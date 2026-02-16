import TradingViewWidget from "@/components/stock/TradingViewWidget";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    symbol: string;
  };
}

export default async function TerminalPage({ params }: PageProps) {
  const { symbol } = await params;

  // Clean symbol (remove exchange prefix if present in URL, though usually it's just symbol)
  const cleanSymbol = decodeURIComponent(symbol).toUpperCase();

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <header className="h-14 border-b border-border flex items-center px-4 justify-between bg-card text-card-foreground">
        <div className="flex items-center gap-4">
          <Link href={`/stock/${cleanSymbol}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-semibold text-lg">{cleanSymbol} Terminal</h1>
        </div>
      </header>
      <main className="flex-1 relative">
        <TradingViewWidget symbol={cleanSymbol} />
      </main>
    </div>
  );
}
