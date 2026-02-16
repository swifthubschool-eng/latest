const { KiteConnect } = require("kiteconnect");
require("dotenv").config({ path: ".env" });

async function verifySensex() {
  const kite = new KiteConnect({ api_key: process.env.KITE_API_KEY });
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);

  try {
    const instruments = await kite.getInstruments("BSE");
    const sensex = instruments.find(i => i.tradingsymbol === "SENSEX");
    
    if (!sensex) { console.error("SENSEX not found"); return; }

    console.log("Found SENSEX:", sensex.instrument_token);

    // 1. Check Friday (1D)
    // Assuming today is Sunday, Friday was Feb 14.
    const fridayStart = new Date("2025-02-14T09:15:00+05:30"); // Adjust year if needed (User system date says 2026? Need to be careful with Simulated Time vs Real Time)
    // Wait, the user metadata says `2026-02-15`. The user is in the future? Or system clock is wrong.
    // The previous test script output: `Server Time (Now): Sun Feb 15 2026`.
    // OKAY, THE SYSTEM YEAR IS 2026. This is huge.
    // Use `new Date()` relative time.
    
    const now = new Date(); // 2026
    const friday = new Date(now);
    friday.setDate(now.getDate() - 2); 
    friday.setHours(9, 15, 0, 0);
    const fridayEnd = new Date(friday);
    fridayEnd.setHours(15, 30, 0, 0);

    console.log(`Fetching 1D Data for: ${friday.toDateString()}`);
    const data1d = await kite.getHistoricalData(sensex.instrument_token, "minute", friday, fridayEnd);
    
    if (data1d.length > 0) {
        const open = data1d[0].open;
        const close = data1d[data1d.length-1].close;
        const diff = close - open;
        console.log(`1D: Open=${open}, Close=${close}, Diff=${diff} (${diff > 0 ? "GREEN" : "RED"})`);
    } else {
        console.log("1D Data: EMPTY");
    }

    // 2. Check 1 Month
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    console.log(`Fetching 1M Data from: ${monthStart.toDateString()}`);
    const data1m = await kite.getHistoricalData(sensex.instrument_token, "day", monthStart, now);
    
    if (data1m.length > 0) {
        const open = data1m[0].open;
        const close = data1m[data1m.length-1].close;
        const diff = close - open;
        console.log(`1M: Open=${open}, Close=${close}, Diff=${diff} (${diff > 0 ? "GREEN" : "RED"})`);
    } else {
        console.log("1M Data: EMPTY");
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

verifySensex();
