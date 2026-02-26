import { NextResponse } from "next/server";
import { kite } from "@/lib/kite";
import { fetchInstruments } from "@/lib/instruments";
import { NIFTY_500 } from "@/lib/nifty500";

export const dynamic = "force-dynamic";


// Supported intervals by Kite: minute, 3minute, 5minute, 15minute, 30minute, 60minute, day
// NOTE: "week" and "month" are NOT supported — use "day" and fetch a wider range instead.
const TIMEFRAME_CONFIG: Record<string, { interval: string; daysBack: number; label: string }> = {
  "1minute": { interval: "minute", daysBack: 1, label: "1 Minute (Today)" },   // 1 day of 1-min candles
  "5minute": { interval: "5minute", daysBack: 5, label: "5 Minute (5 Days)" }, // 5 days of 5-min candles
  "60minute": { interval: "60minute", daysBack: 30, label: "1 Hour (30 Days)" },// 30 days of 1-hour candles
  "6month": { interval: "day", daysBack: 180, label: "6 Months (Daily)" },     // 6 months of daily candles
  "week": { interval: "day", daysBack: 365, label: "1 Year (Daily)" },      // 1 year of daily candles
  "month": { interval: "day", daysBack: 1825, label: "5 Years (Daily)" },     // 5 years of daily candles
};

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "week";

  const config = TIMEFRAME_CONFIG[timeframe];
  if (!config) {
    return NextResponse.json({ error: `Invalid timeframe. Use: ${Object.keys(TIMEFRAME_CONFIG).join(", ")}` }, { status: 400 });
  }

  // Use Server-Sent Events (SSE) to stream progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "start", message: `Starting ${config.label} bulk export for ${NIFTY_500.length} symbols...` });

        // 1. Get instrument tokens for all Nifty 500 symbols
        const instruments = await fetchInstruments();
        const tokenMap = new Map<string, number>();

        instruments.forEach((inst: any) => {
          if (NIFTY_500.includes(inst.symbol) && inst.exchange === "NSE") {
            if (!tokenMap.has(inst.symbol)) {
              tokenMap.set(inst.symbol, inst.instrument_token);
            }
          }
        });

        send({ type: "progress", message: `Found ${tokenMap.size} instruments. Fetching data...`, done: 0, total: tokenMap.size });

        const now = new Date();
        const fromDate = new Date();
        fromDate.setDate(now.getDate() - config.daysBack);

        const csvRows: string[] = [];
        csvRows.push("Symbol,Date,Open,High,Low,Close,Volume");

        const symbols = Array.from(tokenMap.keys());
        const BATCH_SIZE = 3;
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
          const batch = symbols.slice(i, i + BATCH_SIZE);

          await Promise.all(batch.map(async (symbol) => {
            const token = tokenMap.get(symbol);
            if (!token) { failed++; return; }

            try {
              const history: any[] = await (kite as any).getHistoricalData(
                token,
                config.interval,
                fromDate,
                now
              );

              if (!history || history.length === 0) { failed++; return; }

              for (const candle of history) {
                // Kite returns: { date, open, high, low, close, volume }
                const dateStr = candle.date instanceof Date
                  ? candle.date.toISOString()
                  : String(candle.date);
                csvRows.push(`${symbol},${dateStr},${candle.open},${candle.high},${candle.low},${candle.close},${candle.volume}`);
              }

              processed++;
            } catch (e: any) {
              console.error(`Failed ${symbol}:`, e.message);
              failed++;
            }
          }));

          // Rate limit: wait 1100ms between batches (keep under 3 req/sec safely)
          await new Promise(r => setTimeout(r, 1100));

          send({
            type: "progress",
            message: `Processed ${processed + failed}/${symbols.length}...`,
            done: processed + failed,
            total: symbols.length,
            failed
          });
        }

        // Send final CSV data
        send({
          type: "complete",
          message: `Done! Processed ${processed} symbols (${failed} failed).`,
          csv: csvRows.join("\n"),
          filename: `nifty500_${timeframe}_${formatDate(now)}.csv`,
          rows: csvRows.length - 1, // exclude header
        });

      } catch (err: any) {
        send({ type: "error", message: err.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
