import { kite } from "@/lib/kite";

export const dynamic = "force-dynamic";

// In-memory cache for instruments
let cachedInstruments: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchInstruments() {
  const now = Date.now();

  if (cachedInstruments.length > 0 && now - lastFetch < CACHE_DURATION) {
    return cachedInstruments;
  }

  try {
    // Fetch NSE and BSE instruments
    const nseInstruments = await (kite as any).getInstruments("NSE");
    const bseInstruments = await (kite as any).getInstruments("BSE");

    // Prioritize NSE (Default)
    const allInstruments = [...nseInstruments, ...bseInstruments];

    // Filter for Equity segment and Indices
    const allowedInstruments = allInstruments.filter(
      (inst: any) =>
        (inst.segment === "NSE" || inst.segment === "BSE" || inst.segment === "INDICES") &&
        (inst.instrument_type === "EQ" || inst.instrument_type === "INDEX") &&
        inst.name &&
        // Filter out non-stocks but keep Indices
        !inst.tradingsymbol.includes("-TB") &&
        !inst.tradingsymbol.includes("-GS") &&
        !inst.tradingsymbol.includes("-SG") &&
        !inst.tradingsymbol.includes("-EB") &&
        !inst.tradingsymbol.endsWith("INAV") &&
        !inst.name.toUpperCase().includes("GOI TBILL") &&
        !inst.name.toUpperCase().includes("G-SEC") &&
        !inst.name.toUpperCase().includes("STATE GOV") &&
        !inst.name.toUpperCase().includes(" ETF") &&
        (!/^\d/.test(inst.tradingsymbol) || inst.tradingsymbol === "20MICRONS" || inst.tradingsymbol === "SENSEX" || inst.tradingsymbol === "NIFTY 50" || inst.tradingsymbol === "NIFTY BANK" || inst.tradingsymbol === "NIFTY FIN SERVICE") // Allow valid stocks starting with number
    );

    // Deduplicate by symbol (Prioritize NSE)
    const uniqueInstruments = [];
    const seenSymbols = new Set();

    for (const inst of allowedInstruments) {
      if (!seenSymbols.has(inst.tradingsymbol)) {
        uniqueInstruments.push(inst);
        seenSymbols.add(inst.tradingsymbol);
      }
    }

    // Simplify data
    const simplified = uniqueInstruments.map((inst: any) => ({
      symbol: inst.tradingsymbol,
      name: inst.name,
      instrument_token: inst.instrument_token,
      exchange: inst.exchange,
      segment: inst.segment
    }));

    cachedInstruments = simplified;
    lastFetch = now;

    return simplified;
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return cachedInstruments; // Return stale cache if fetch fails
  }
}
