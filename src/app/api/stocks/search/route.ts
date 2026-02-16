import { NextResponse } from "next/server";
import { fetchInstruments } from "@/lib/instruments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toUpperCase().trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const instruments = await fetchInstruments();
    console.log(`[Search] Total instruments fetched: ${instruments.length}`);

    if (instruments.length > 0) {
      console.log(`[Search] Sample instrument:`, instruments[0]);
    }

    // Filter by symbol or name, prioritize exact symbol matches
    // Add null checks to prevent errors
    const exactMatches = instruments.filter((inst: any) =>
      inst.symbol && inst.symbol === query
    );

    const partialMatches = instruments.filter((inst: any) =>
      inst.symbol &&
      inst.name &&
      inst.symbol !== query && (
        inst.symbol.startsWith(query) ||
        inst.name.toUpperCase().includes(query)
      )
    );

    console.log(`[Search] Query: "${query}", Exact: ${exactMatches.length}, Partial: ${partialMatches.length}`);

    const allMatches = [...exactMatches, ...partialMatches]
      .slice(0, 10)
      .map((inst: any) => ({
        symbol: inst.symbol,
        name: inst.name,
        exchange: "NSE"
      }));

    return NextResponse.json({ results: allMatches });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
