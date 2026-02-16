const { KiteConnect } = require("kiteconnect");
require("dotenv").config({ path: ".env" });

async function testHistorical1d() {
  console.log("Testing Historical Data (1d) Logic...");

  const kite = new KiteConnect({
    api_key: process.env.KITE_API_KEY,
  });
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);

  // Simulate server logic
  const now = new Date();
  let fromDate = new Date();
  let toDate = new Date();
  
  // Logic from route.ts
  fromDate.setHours(9, 15, 0, 0);
  toDate.setHours(15, 30, 0, 0);

  console.log("Server Time (Now):", now.toString());
  console.log("From Date:", fromDate.toString());
  console.log("To Date:", toDate.toString());

  try {
    const instruments = await kite.getInstruments("NSE");
    const ioc = instruments.find(i => i.tradingsymbol === "IOC");
    
    if (!ioc) {
        console.error("IOC not found");
        return;
    }

    console.log("Fetching IOC Data...");
    const data = await kite.getHistoricalData(
        ioc.instrument_token, 
        "minute", 
        fromDate, 
        toDate
    );

    console.log(`Fetched ${data.length} candles.`);
    if (data.length > 0) {
        console.log("First Candle:", data[0]);
        console.log("Last Candle:", data[data.length-1]);
    } else {
        console.log("No data returned. Possible reasons: Market closed, Timezone mismatch, or Weekend.");
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testHistorical1d();
