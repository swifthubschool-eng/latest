
import { kite } from "@/lib/kite";
import { fetchInstruments } from "@/lib/instruments";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Recompile force

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> } // Params are now a Promise in Next.js 15+
) {
  let symbol = "";
  try {
    const paramsResolved = await params;
    symbol = paramsResolved.symbol;
    let upperSymbol = symbol.toUpperCase();

    // Map common index aliases to NSE official trading symbols
    if (upperSymbol === "NIFTY") upperSymbol = "NIFTY 50";
    if (upperSymbol === "BANKNIFTY") upperSymbol = "NIFTY BANK";
    if (upperSymbol === "FINNIFTY") upperSymbol = "NIFTY FIN SERVICE";
    if (upperSymbol === "MIDCAP") upperSymbol = "NIFTY MIDCAP 100";
    if (upperSymbol === "SMALLCAP") upperSymbol = "NIFTY SMLCAP 100";

    // 1. Get instrument token
    const instruments = await fetchInstruments();
    const instrument = instruments.find((inst: any) => inst.symbol === upperSymbol);

    if (!instrument || !instrument.instrument_token) {
      return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
    }

    // 2. Define time range and interval based on query
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "1d"; // 1d, 5d, 1mo, 1y, 5y

    let fromDate = new Date();
    let toDate = new Date();
    let interval = "minute";

    // Normalize today - Use system time (Vercel uses UTC usually, but Kite accepts standard Date objects)
    const now = new Date();

    switch (range) {
      case "1d": {
        // Safe IST Time Calculation
        const getISTParts = (d: Date) => {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: false
          });
          const parts = formatter.formatToParts(d);
          const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0");
          return {
            year: get('year'),
            month: get('month') - 1, // 0-indexed
            day: get('day'),
            hour: get('hour'),
            minute: get('minute')
          };
        };

        const ist = getISTParts(now);
        const nowTimeVal = ist.hour * 60 + ist.minute;
        const marketOpenVal = 9 * 60 + 15;

        // Determine current day of week in IST (0=Sun, 1=Mon, ..., 6=Sat)
        const currentDateIST = new Date(ist.year, ist.month, ist.day);
        const dayOfWeek = currentDateIST.getDay();

        let targetDate = currentDateIST; // Start with today
        let daysToSubtract = 0;

        // 1. Weekend Logic
        if (dayOfWeek === 0) { // Sunday -> Friday
          daysToSubtract = 2;
        } else if (dayOfWeek === 6) { // Saturday -> Friday
          daysToSubtract = 1;
        }
        // 2. Pre-Market Logic (Before 9:15 AM IST)
        else if (nowTimeVal < marketOpenVal) {
          if (dayOfWeek === 1) { // Mon Morning -> Friday
            daysToSubtract = 3;
          } else { // Tue-Fri Morning -> Yesterday
            daysToSubtract = 1;
          }
        }

        if (daysToSubtract > 0) {
          // Go back N days
          targetDate = new Date(targetDate.setDate(targetDate.getDate() - daysToSubtract));

          // Re-fetch IST parts for the target date to ensure correct year/month/day boundaries
          // Actually, Date object handles month rollover.
          // Using Date.UTC to construct absolute timestamps for 09:15 - 15:30 IST

          // 09:15 IST = 03:45 UTC
          fromDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 3, 45, 0));

          // 15:30 IST = 10:00 UTC
          toDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 10, 0, 0));
        } else {
          // Live Session
          // From 09:15 IST Today
          fromDate = new Date(Date.UTC(ist.year, ist.month, ist.day, 3, 45, 0));

          // To NOW (Absolute Time)
          toDate = now;
        }

        interval = "minute";
        break;
      }
      case "5d":
        // 7 days lookback ensures 5 trading days usually
        fromDate.setDate(now.getDate() - 7);
        toDate = now; // Ensure 5d chart is also live till now
        interval = "60minute";
        break;
      case "1m":
        fromDate.setDate(now.getDate() - 30);
        interval = "60minute";
        break;
      case "1y":
        fromDate.setDate(now.getDate() - 365);
        interval = "day";
        break;
      case "5y":
        fromDate.setDate(now.getDate() - (5 * 365));
        interval = "day";
        break;
      default:
        // Default to 1d
        fromDate.setHours(9, 15, 0, 0);
        toDate.setHours(15, 30, 0, 0);
        interval = "minute";
    }

    // Kite API expects dates as strings or Date objects.
    // historical(instrument_token, interval, from_date, to_date)

    // We casts kite as any because typescript definition might be missing historical method
    const historicalResponse: any = await (kite as any).getHistoricalData(
      instrument.instrument_token,
      interval,
      fromDate,
      toDate
    );

    console.log(`[Historical] Symbol: ${symbol}, Token: ${instrument.instrument_token}, Candles: ${Array.isArray(historicalResponse) ? historicalResponse.length : (historicalResponse?.data?.candles?.length || 0)}`);

    // Handle different response structures (sometimes it's directly array, sometimes object)
    const candles = Array.isArray(historicalResponse)
      ? historicalResponse
      : (historicalResponse?.data?.candles || historicalResponse?.candles || []);

    // Format data for the chart
    // Kite returns: [[date, open, high, low, close, volume], ...]
    const chartData = candles.map((candle: any) => {
      // Handle array format [date, open, high, low, close, volume]
      // Or object format if provided differently (though usually array)
      const date = new Date(candle[0] || candle.date);
      const closePrice = candle[4] !== undefined ? candle[4] : candle.close;
      const openPrice = candle[1] !== undefined ? candle[1] : candle.open;
      const highPrice = candle[2] !== undefined ? candle[2] : candle.high;
      const lowPrice = candle[3] !== undefined ? candle[3] : candle.low;
      const volume = candle[5] !== undefined ? candle[5] : candle.volume;

      let timeLabel = "";
      if (range === "1d") {
        timeLabel = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (range === "5d" || range === "1m") {
        // Show "DD MMM HH:mm" for medium ranges
        timeLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + " " + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        // Show "DD MMM YY" for long ranges
        timeLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
      }

      return {
        time: timeLabel,
        originalDate: date.toISOString(),
        price: closePrice,
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
        volume: volume
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
