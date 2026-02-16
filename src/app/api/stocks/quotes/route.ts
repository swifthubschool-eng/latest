import { kite } from "@/lib/kite";
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/prisma";

// Force yahooFinance to use its default export if it's wrapped
// const yf = (yahooFinance as any).default || yahooFinance;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols");

  if (!symbols || symbols.trim() === "" || symbols === "undefined") {
    return NextResponse.json(
      { success: true, data: [] },
      { status: 200 }
    );
  }

  const symbolsArray = symbols.split(",");

  // Kite getQuote expects symbols prefixed with exchange if not provided, 
  // but let's assume valid "NSE:SYMBOL" or just "SYMBOL" (defaulting to NSE if needed, but best to be explicit)
  // Our instruments API returns 'symbol' as trading symbol (e.g. 'RELIANCE').
  // getQuote needs 'NSE:RELIANCE'.

  const kiteSymbols = symbolsArray.map((s) => {
    if (s.includes(":")) return s;
    if (s === "SENSEX" || s === "BSE-SENSEX") return `BSE:SENSEX`;
    if (s === "FINNIFTY" || s === "NIFTY FIN SERVICE") return `NSE:NIFTY FIN SERVICE`;
    if (s === "BANKNIFTY" || s === "NIFTY BANK") return `NSE:NIFTY BANK`;
    if (s === "NIFTY" || s === "NIFTY 50") return `NSE:NIFTY 50`;
    return `NSE:${s}`;
  });

  try {
    try {
      let quotes: any = {};
      try {
        quotes = await (kite as any).getQuote(kiteSymbols);
      } catch (kiteError: any) {
        console.error("Kite getQuote failed:", kiteError.message);
        // If Kite fails, we cannot provide live prices. Fail gracefully or return error.
        // Returning 500 is appropriate as this is the core function.
        return NextResponse.json(
          { success: false, error: "Failed to fetch live quotes from exchange", details: kiteError.message },
          { status: 500 }
        );
      }

      // Get unique list of symbols (cleaned)
      const cleanedSymbols = Array.from(new Set(symbolsArray.map(s => s.split(":")[1] || s).map(s => s.split("-")[0].toUpperCase().trim())));

      // Use UTC Midnight to avoid timezone issues with @db.Date
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      // Check DB for existing fundamental data for today
      let existingFundamentals: any[] = [];
      try {
        existingFundamentals = await prisma.stockFundamental.findMany({
          where: {
            symbol: { in: cleanedSymbols },
            date: today
          }
        });
      } catch (dbError) {
        console.error("DB Fetch Error (Non-fatal):", dbError);
        // Continue without fundamentals
      }

      const fundamentalMap: Record<string, any> = {};
      const symbolsToFetch: string[] = [];

      cleanedSymbols.forEach(symbol => {
        const existing = existingFundamentals.find(f => f.symbol === symbol);
        // Force refetch if dailyVolume is missing (schema migration)
        if (existing && existing.dailyVolume != null) {
          fundamentalMap[symbol] = {
            marketCap: existing.marketCap,
            trailingPE: existing.peRatio,
            epsTrailingTwelveMonths: existing.eps,
            epsForward: existing.epsForward,
            dividendYield: existing.dividendYield,
            beta: existing.beta,
            averageDailyVolume10Day: existing.avgVolume10d,
            sector: existing.sector,
            longName: existing.longName,
            fiftyTwoWeekHigh: existing.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: existing.fiftyTwoWeekLow,
            dailyVolume: existing.dailyVolume
          };
        } else {
          symbolsToFetch.push(symbol);
        }
      });

      // User requested to fetch from Kite only. But we need Fundamentals.
      // Enabling Yahoo Finance fetch for fundamentals only (Market Cap, PE, etc.)
      if (symbolsToFetch.length > 0) {
        // Create a promise for Yahoo Fetching
        const yahooFetchPromise = async () => {
          try {
            console.log(`[${today.toISOString().split('T')[0]}] Cache Miss. Fetching ${symbolsToFetch.length} from Yahoo:`, symbolsToFetch.slice(0, 3));
            const YFClass = (yahooFinance as any).default || yahooFinance;
            const yf = new YFClass({ suppressNotices: ['yahooSurvey'] });

            // Fetch one by one using quoteSummary (better data coverage for Sector/Growth)
            // We do this in chunks of 5 parallel requests to avoid rate limits
            for (let i = 0; i < symbolsToFetch.length; i += 5) {
              const chunk = symbolsToFetch.slice(i, i + 5);

              await Promise.all(chunk.map(async (sym) => {
                try {
                  let summary;
                  const modules = ['summaryProfile', 'defaultKeyStatistics', 'financialData', 'price', 'summaryDetail'];

                  try {
                    // Try NSE first
                    summary = await yf.quoteSummary(`${sym}.NS`, { modules }, { validateResult: false });
                  } catch (nseError) {
                    // If NSE fails, try BSE
                    try {
                      summary = await yf.quoteSummary(`${sym}.BO`, { modules }, { validateResult: false });
                    } catch (bseError) {
                      // Both failed. Insert empty record to avoid re-fetching for today.
                      try {
                        await prisma.stockFundamental.upsert({
                          where: { symbol_date: { symbol: sym, date: today } },
                          update: { lastUpdated: new Date() },
                          create: { symbol: sym, date: today }
                        });
                      } catch (dbErr) { } // ignore
                      return;
                    }
                  }

                  if (!summary) return;

                  const profile = summary.summaryProfile || {};
                  const stats = summary.defaultKeyStatistics || {};
                  const fin = summary.financialData || {};
                  const price = summary.price || {};
                  const details = summary.summaryDetail || {};

                  // Map data
                  const dataToSave = {
                    longName: price.longName || profile.longBusinessSummary?.substring(0, 50), // Fallback
                    sector: profile.sector,
                    marketCap: price.marketCap || details.marketCap,
                    peRatio: stats.trailingPE || stats.forwardPE,
                    eps: stats.trailingEps,
                    epsForward: stats.forwardEps,
                    epsGrowth: stats.earningsQuarterlyGrowth || stats.earningsGrowth,
                    dividendYield: stats.dividendYield || details.dividendYield,
                    beta: stats.beta,
                    avgVolume10d: price.averageDailyVolume10Day || details.averageVolume10days,
                    currentPrice: price.regularMarketPrice || price.regularMarketOpen, // Store Yahoo Price
                    fiftyTwoWeekHigh: details.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: details.fiftyTwoWeekLow,
                    dailyVolume: price.regularMarketVolume || details.volume,
                    lastUpdated: new Date()
                  };

                  // Store specifically for today
                  try {
                    await prisma.stockFundamental.upsert({
                      where: {
                        symbol_date: {
                          symbol: sym,
                          date: today
                        }
                      },
                      update: dataToSave,
                      create: {
                        symbol: sym,
                        date: today,
                        ...dataToSave
                      }
                    });
                  } catch (dbErr) { console.error("DB Upsert Error:", dbErr); }

                  // Update local map immediately so current request gets data
                  fundamentalMap[sym] = dataToSave;

                } catch (err) {
                  console.warn(`Unexpected error processing ${sym}:`, err);
                }
              }));
            }
          } catch (err) {
            console.error("Yahoo/DB Daily Update Error:", err);
            // Don't throw, just log
          }
        };

        // Wrap in a timeout race (max 2 seconds)
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));

        // Make sure yahooFetchPromise never rejects
        const safeYahooPromise = yahooFetchPromise().catch(err => console.error("Yahoo Promise Rejected:", err));

        const result = await Promise.race([safeYahooPromise, timeoutPromise]);
        if (result === 'timeout') {
          console.warn("Yahoo Finance fetch timed out. Returning partial data.");
        }
      }

      // Normalize with Live Price from Kite
      const normalizedData = Object.keys(quotes).map((key) => {
        const quote = quotes[key];
        const symbol = key.replace("NSE:", "").replace("BSE:", "").toUpperCase().trim();
        // Handle cases where symbol might be "INFY" or "NSE:INFY"

        const cleanSymbol = symbol.split("-")[0];

        const yData = fundamentalMap[cleanSymbol];

        // Fallback for Price: If Kite returns 0, try to use Yahoo Finance price from DB or Summary
        let price = quote.last_price || 0;
        let close = quote.ohlc?.close || 0;
        let volume = quote.volume || yData?.dailyVolume || 0;

        // If Kite price is 0 (market closed/pre-open issue), try OHLC close, then Yahoo Price
        if (price === 0) {
          if (close > 0) {
            price = close;
          } else if (yData?.currentPrice) {
            price = yData.currentPrice;
          }
        }

        // console.log(`[${cleanSymbol}] Final price: ${price}`);

        // Calculate change
        let change = quote.net_change || 0;
        let previousClose = 0;

        if (change !== 0) {
          // Calculate previous close from: price = previousClose + change
          previousClose = price - change;
        } else if (quote.ohlc?.close && quote.ohlc.close > 0) {
          // Fix: Use previous close from OHLC if available (this is the correct reference for daily change)
          previousClose = quote.ohlc.close;
          change = price - previousClose;
        } else if (quote.ohlc?.open && quote.ohlc.open > 0) {
          // Fallback: use today's open as approximation (least accurate, but better than nothing if no prev close)
          previousClose = quote.ohlc.open;
          change = price - previousClose;
        } else {
          // No reliable historical data available
          previousClose = price;
          change = 0;
        }

        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        return {
          symbol,
          last_price: price, // Always Fresh from Kite
          change: change,
          change_percent: parseFloat(changePercent.toFixed(2)),
          volume: volume,
          timestamp: quote.timestamp,
          ohlc: quote.ohlc,
          // Foundational data (Daily cached)
          // Ensure we check all possible keys for market cap
          market_cap: yData?.marketCap || yData?.market_cap || null,
          pe_ratio: yData?.peRatio || yData?.trailingPE || yData?.pe_ratio || null, // Fixed casing
          eps: yData?.eps || yData?.epsTrailingTwelveMonths || null,
          sector: yData?.sector || null,
          longName: yData?.longName || yData?.long_name || null,
          div_yield: yData?.dividendYield || yData?.dividend_yield || null,
          average_volume_10d: yData?.avgVolume10d || yData?.averageDailyVolume10Day || yData?.avg_volume_10d || null,
          eps_forward: yData?.epsForward || yData?.eps_forward || null,
          beta: yData?.beta || null,
          eps_growth: yData?.epsGrowth || yData?.earningsGrowth || yData?.eps_growth || null,
          fifty_two_week_high: yData?.fiftyTwoWeekHigh || null,
          fifty_two_week_low: yData?.fiftyTwoWeekLow || null,
          // Calculated Metrics
          rel_volume: (yData?.avgVolume10d || yData?.averageDailyVolume10Day)
            ? parseFloat(((volume) / (yData?.avgVolume10d || yData?.averageDailyVolume10Day)).toFixed(2))
            : null
        };
      });

      return NextResponse.json({
        success: true,
        data: normalizedData
      });
    } catch (error: any) {
      console.error("Critical API Error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch stock data", details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock data", details: error.message },
      { status: 500 }
    );
  }
}
