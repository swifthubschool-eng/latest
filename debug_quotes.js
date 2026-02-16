
const { kite } = require("./lib/kite");

async function main() {
  const symbols = ["NSE:AARTISURF-P1", "NSE:AAREYDRUGS", "NSE:ABDL", "NSE:AGNI-SM"];
  
  try {
    console.log("Fetching quotes for:", symbols);
    const quotes = await kite.getQuote(symbols);
    
    for (const symbol of symbols) {
      const quote = quotes[symbol];
      if (!quote) {
        console.log(`No data for ${symbol}`);
        continue;
      }
      
      console.log(`\n--- ${symbol} ---`);
      console.log("Last Price:", quote.last_price);
      console.log("OHLC:", quote.ohlc);
      console.log("Net Change:", quote.net_change);
      console.log("Change % (API):", quote.change_percent); // If available
      
      // Verification calc
      const close = quote.ohlc.close; // Usually prev close
      const price = quote.last_price;
      const calcChange = price - close;
      const calcPercent = (calcChange / close) * 100;
      
      console.log(`Calculated Change (Price - OHLC.Close): ${calcChange.toFixed(2)}`);
      console.log(`Calculated %: ${calcPercent.toFixed(2)}%`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
