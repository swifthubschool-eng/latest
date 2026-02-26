import { ChartTerminal } from "@/components/terminal/ChartTerminal";
import { fetchInstruments } from "@/lib/instruments";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    symbol: string;
  };
}

export default async function TerminalPage({ params }: PageProps) {
  const { symbol } = await params;

  // Clean symbol
  const cleanSymbol = decodeURIComponent(symbol).toUpperCase();

  // Find Instrument Token
  const instruments = await fetchInstruments();
  const instrument = instruments.find((i: any) => i.symbol === cleanSymbol);

  if (!instrument) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#131722] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Instrument Not Found</h1>
          <p className="text-gray-400">Could not find token for {cleanSymbol}</p>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4 text-black bg-white hover:bg-gray-200">Back to Market</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render the modular Chart Terminal which handles layout internally
  return (
    <ChartTerminal symbol={cleanSymbol} instrumentToken={instrument.instrument_token} />
  );
}
