import { NextResponse } from "next/server";
import { kite } from "@/lib/kite";
import { fetchInstruments } from "@/lib/instruments";
import { NIFTY_500 } from "@/lib/nifty500";

export const dynamic = "force-dynamic";

// Thresholds — relaxed so more stocks appear
const THRESHOLDS = {
  VD: 0.8,   // Daily: today's vol > 0.8x 20-day avg  (was 1.2x)
  VDW: 0.9,   // Weekly: last 5d vol > 0.9x prior 5d
  VDM: 0.85,  // Monthly: last 20d vol > 0.85x prior 20d
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "VD") as "VD" | "VDW" | "VDM";
  const limit = parseInt(searchParams.get("limit") || "200", 10);

  try {
    // 1. Build token map for all Nifty 500 symbols
    const instruments = await fetchInstruments();
    const tokenMap = new Map<string, number>();

    instruments.forEach((inst: any) => {
      // Accept if NSE exchange and symbol is in Nifty 500 list
      if (
        (inst.exchange === "NSE" || !inst.exchange) &&
        NIFTY_500.includes(inst.tradingsymbol || inst.symbol)
      ) {
        const sym = inst.tradingsymbol || inst.symbol;
        if (!tokenMap.has(sym)) {
          tokenMap.set(sym, inst.instrument_token);
        }
      }
    });

    // Fallback: also try direct symbol match without exchange filter
    if (tokenMap.size < 10) {
      instruments.forEach((inst: any) => {
        const sym = inst.tradingsymbol || inst.symbol;
        if (NIFTY_500.includes(sym) && !tokenMap.has(sym)) {
          tokenMap.set(sym, inst.instrument_token);
        }
      });
    }

    const now = new Date();
    const fromDate = new Date();

    // Fetch enough history for computation
    const daysBack = type === "VDM" ? 90 : type === "VDW" ? 45 : 30;
    fromDate.setDate(now.getDate() - daysBack);

    const symbols = Array.from(tokenMap.keys());
    const results: any[] = [];

    // Larger batches for speed — Kite allows ~3 req/s, 5 parallel is safe with 1.8s delay
    const BATCH_SIZE = 5;

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (symbol) => {
        const token = tokenMap.get(symbol);
        if (!token) return;

        try {
          const history: any[] = await (kite as any).getHistoricalData(
            token,
            "day",
            fromDate,
            now
          );

          if (!history || history.length < 3) return;

          const candles = history;
          const lastIdx = candles.length - 1;
          const current = candles[lastIdx];

          const lastPrice = current.close || current.open || 0;
          const currentVol = current.volume || 0;

          if (currentVol === 0) return;

          let avgVol = 0;
          let ratio = 0;
          let match = false;

          if (type === "VD") {
            // Compare today's volume vs 20-day average (use available data if < 20 days)
            const period = Math.min(20, lastIdx);
            if (period >= 3) {
              let volSum = 0;
              for (let j = 1; j <= period; j++) {
                volSum += candles[lastIdx - j]?.volume || 0;
              }
              avgVol = volSum / period;
              if (avgVol > 0) {
                ratio = currentVol / avgVol;
                if (ratio > THRESHOLDS.VD) match = true;
              }
            }
          } else if (type === "VDW") {
            // Last 5 days vs previous 5 days
            if (lastIdx >= 9) {
              const last5 = candles.slice(lastIdx - 4, lastIdx + 1).reduce((s: number, c: any) => s + (c.volume || 0), 0);
              const prev5 = candles.slice(lastIdx - 9, lastIdx - 4).reduce((s: number, c: any) => s + (c.volume || 0), 0);
              avgVol = prev5;
              if (prev5 > 0) {
                ratio = last5 / prev5;
                if (ratio > THRESHOLDS.VDW) match = true;
              }
            } else if (lastIdx >= 4) {
              // Not enough data for full comparison, compare last 3d vs prior 3d
              const half = Math.floor(lastIdx / 2);
              const lastH = candles.slice(lastIdx - half, lastIdx + 1).reduce((s: number, c: any) => s + (c.volume || 0), 0);
              const prevH = candles.slice(0, half).reduce((s: number, c: any) => s + (c.volume || 0), 0);
              avgVol = prevH;
              if (prevH > 0) {
                ratio = lastH / prevH;
                if (ratio > THRESHOLDS.VDW) match = true;
              }
            }
          } else if (type === "VDM") {
            // Last 20 days vs previous 20 days
            const period = Math.min(20, Math.floor(lastIdx / 2));
            if (period >= 5) {
              const lastP = candles.slice(lastIdx - period + 1, lastIdx + 1).reduce((s: number, c: any) => s + (c.volume || 0), 0);
              const prevP = candles.slice(lastIdx - 2 * period + 1, lastIdx - period + 1).reduce((s: number, c: any) => s + (c.volume || 0), 0);
              avgVol = prevP;
              if (prevP > 0) {
                ratio = lastP / prevP;
                if (ratio > THRESHOLDS.VDM) match = true;
              }
            }
          }

          if (match) {
            results.push({
              symbol,
              ltp: parseFloat(lastPrice.toFixed(2)),
              currentVolume: currentVol,
              avgVolume: Math.round(avgVol),
              ratio: parseFloat(ratio.toFixed(2)),
              scanType: type,
            });
          }

        } catch (e: any) {
          // Silently skip failed symbols to not break the whole scan
        }
      }));

      // 1800ms between batches of 5 = 2.8 req/sec — safely under limit
      await new Promise(r => setTimeout(r, 1800));
    }

    // Sort by ratio desc, cap at limit
    results.sort((a, b) => b.ratio - a.ratio);
    const finalResults = results.slice(0, limit);

    return NextResponse.json({
      data: finalResults,
      meta: {
        total: results.length,
        scanned: symbols.length,
        threshold: THRESHOLDS[type],
        type,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Scan failed", details: error.message },
      { status: 500 }
    );
  }
}
