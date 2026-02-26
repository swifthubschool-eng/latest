
import { kite } from "@/lib/kite";
import { fetchInstruments } from "@/lib/instruments";
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const dynamic = "force-dynamic";

// ─── Hardcoded Index Tokens ────────────────────────────────────────────────
// Indices are in NSE-INDICES segment — not returned by getInstruments("NSE").
// These tokens are permanent in Zerodha's system.
const INDEX_TOKENS: Record<string, number> = {
  "NIFTY 50": 256265,
  "NIFTY BANK": 260105,
  "NIFTY FIN SERVICE": 257801,
  "NIFTY MIDCAP 100": 288009,
  "NIFTY SMLCAP 100": 9999105,
  "SENSEX": 265,
  "NIFTY NEXT 50": 270857,
};

// ─── IST-safe date helpers ─────────────────────────────────────────────────
const IST = "Asia/Kolkata";
const nowIST = () => dayjs().tz(IST);

/** Returns the most recent trading day in IST (skips weekends, pre-market) */
function getLastTradingDay(): dayjs.Dayjs {
  const now = nowIST();
  const timeVal = now.hour() * 60 + now.minute();
  const marketOpen = 9 * 60 + 15; // 9:15 AM IST
  const day = now.day(); // 0=Sun, 6=Sat

  let base = now.startOf("day");

  if (day === 0) base = base.subtract(2, "day");       // Sun → Fri
  else if (day === 6) base = base.subtract(1, "day");  // Sat → Fri
  else if (timeVal < marketOpen) {
    // Pre-market today → use yesterday (go back over weekends)
    if (day === 1) base = base.subtract(3, "day");     // Mon AM → Fri
    else base = base.subtract(1, "day");
  }

  return base;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  let symbol = "";
  try {
    const paramsResolved = await params;
    symbol = paramsResolved.symbol;
    let upperSymbol = decodeURIComponent(symbol).toUpperCase();

    // Map common index aliases to NSE official trading symbols
    if (upperSymbol === "NIFTY") upperSymbol = "NIFTY 50";
    if (upperSymbol === "BANKNIFTY") upperSymbol = "NIFTY BANK";
    if (upperSymbol === "FINNIFTY") upperSymbol = "NIFTY FIN SERVICE";
    if (upperSymbol === "MIDCAP") upperSymbol = "NIFTY MIDCAP 100";
    if (upperSymbol === "SMALLCAP") upperSymbol = "NIFTY SMLCAP 100";

    // 1. Get instrument token — try hardcoded index map first, then instruments list
    let instrumentToken: number | null = INDEX_TOKENS[upperSymbol] || null;
    if (!instrumentToken) {
      const instruments = await fetchInstruments();
      const instrument = instruments.find((inst: any) => inst.symbol === upperSymbol);
      if (!instrument || !instrument.instrument_token) {
        return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
      }
      instrumentToken = instrument.instrument_token;
    }

    // 2. Build IST-correct date ranges
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "1d";

    const tradingDay = getLastTradingDay();
    const now = nowIST();
    let fromDate: dayjs.Dayjs;
    let toDate: dayjs.Dayjs = now;
    let interval = "minute";

    switch (range) {
      case "1d": {
        // From 09:15 IST of the last trading day → now (or 15:30 IST if past session)
        fromDate = tradingDay.hour(9).minute(15).second(0);
        const sessionEnd = tradingDay.hour(15).minute(30).second(0);
        toDate = now.isAfter(sessionEnd) ? sessionEnd : now;
        interval = "minute";
        break;
      }
      case "5d":
        fromDate = now.subtract(7, "day");
        interval = "60minute";
        break;
      case "1m":
        fromDate = now.subtract(30, "day");
        interval = "60minute";
        break;
      case "1y":
        fromDate = now.subtract(365, "day");
        interval = "day";
        break;
      case "5y":
        fromDate = now.subtract(5 * 365, "day");
        interval = "day";
        break;
      default:
        fromDate = tradingDay.hour(9).minute(15).second(0);
        interval = "minute";
    }

    // ⚠️ CRITICAL: Pass IST-formatted strings, NOT JS Date objects.
    // The kiteconnect library converts Date objects to UTC ISO strings internally,
    // which sends the WRONG datetime to Kite's API (NSE runs on IST).
    // Kite's API accepts 'YYYY-MM-DD HH:mm:ss' strings and treats them as IST.
    const fromStr = fromDate.format("YYYY-MM-DD HH:mm:ss");
    const toStr = toDate.format("YYYY-MM-DD HH:mm:ss");

    console.log(`[Historical] ${upperSymbol} | range=${range} | from=${fromStr} | to=${toStr} | interval=${interval}`);

    // 3. Fetch candles from Kite
    const historicalResponse: any = await (kite as any).getHistoricalData(
      instrumentToken,
      interval,
      fromStr,
      toStr
    );

    const candles = Array.isArray(historicalResponse)
      ? historicalResponse
      : (historicalResponse?.data?.candles || historicalResponse?.candles || []);

    console.log(`[Historical] ${upperSymbol} → ${candles.length} candles`);

    // 4. Format for chart
    const chartData = candles.map((candle: any) => {
      const dateIST = dayjs(candle[0] || candle.date).tz(IST);
      const closePrice = candle[4] !== undefined ? candle[4] : candle.close;

      let timeLabel: string;
      if (range === "1d") {
        timeLabel = dateIST.format("HH:mm");
      } else if (range === "5d" || range === "1m") {
        timeLabel = dateIST.format("DD MMM HH:mm");
      } else {
        timeLabel = dateIST.format("DD MMM YY");
      }

      return {
        time: timeLabel,
        originalDate: dateIST.toISOString(),
        price: closePrice,
        open: candle[1] !== undefined ? candle[1] : candle.open,
        high: candle[2] !== undefined ? candle[2] : candle.high,
        low: candle[3] !== undefined ? candle[3] : candle.low,
        close: closePrice,
        volume: candle[5] !== undefined ? candle[5] : candle.volume,
      };
    });

    return NextResponse.json(chartData);

  } catch (error: any) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch historical data", details: error.message },
      { status: 500 }
    );
  }
}
