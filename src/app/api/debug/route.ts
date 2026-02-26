import { NextResponse } from "next/server";

// This route is disabled in production — only usable in development
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { kite } = await import("@/lib/kite");
  const symbols = ["NSE:AARTISURF-P1", "NSE:AAREYDRUGS", "NSE:ABDL", "NSE:AGNI-SM"];

  try {
    const quotes = await (kite as any).getQuote(symbols);

    const data = Object.keys(quotes).map(key => {
      const q = quotes[key];
      const prevClose = q.ohlc.close > 0 ? q.ohlc.close : q.ohlc.open;
      const calcChange = q.last_price - prevClose;
      const calcPercent = prevClose > 0 ? (calcChange / prevClose) * 100 : 0;

      return {
        symbol: key,
        last_price: q.last_price,
        net_change: q.net_change,
        previous_close_used: prevClose,
        ohlc_close: q.ohlc.close,
        ohlc_open: q.ohlc.open,
        calc_change: calcChange,
        calc_percent: calcPercent,
        api_change_percent: q.change_percent,
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
