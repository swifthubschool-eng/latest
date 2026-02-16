// @ts-ignore
const KiteConnect = require("kiteconnect").KiteConnect;

const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY!,
});

// Set access token if available
if (process.env.KITE_ACCESS_TOKEN) {
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);
}

export { kite };

// NSE Instrument tokens for Indian stocks
export const STOCK_INSTRUMENTS = {
  RELIANCE: "NSE:RELIANCE",
  TCS: "NSE:TCS",
  INFY: "NSE:INFY",
  HDFCBANK: "NSE:HDFCBANK",
  TATAMOTORS: "NSE:TATAMOTORS",
  WIPRO: "NSE:WIPRO",
  ITC: "NSE:ITC",
  BHARTIARTL: "NSE:BHARTIARTL",
  SBIN: "NSE:SBIN",
  ICICIBANK: "NSE:ICICIBANK",
  KOTAKBANK: "NSE:KOTAKBANK",
  LT: "NSE:LT",
  AXISBANK: "NSE:AXISBANK",
  MARUTI: "NSE:MARUTI",
  SUNPHARMA: "NSE:SUNPHARMA",
} as const;

export type StockSymbol = keyof typeof STOCK_INSTRUMENTS;
