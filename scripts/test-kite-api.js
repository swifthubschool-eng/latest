const { KiteConnect } = require("kiteconnect");
require("dotenv").config({ path: ".env" }); // Explicit path to ensure it loads

async function testKite() {
  console.log("Testing Kite API...");
  console.log("API_KEY:", process.env.KITE_API_KEY ? "Set" : "Missing");
  console.log("ACCESS_TOKEN:", process.env.KITE_ACCESS_TOKEN ? "Set" : "Missing");

  const kite = new KiteConnect({
    api_key: process.env.KITE_API_KEY,
  });
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);

  try {
    // 1. Test getProfile (simplest call)
    console.log("1. Fetching Profile...");
    const profile = await kite.getProfile();
    console.log("Profile Success:", profile.user_name);

    // 2. Test getInstruments (NSE & INDICES)
    console.log("2. Fetching Instruments (NSE & NSE-INDICES)...");
    // Note: Kite often has indices in valid segments.
    // Let's try to find NIFTY 50 and SENSEX.
    
    // Fetch NSE instruments
    const nseInstruments = await kite.getInstruments("NSE");
    console.log(`NSE Instruments: ${nseInstruments.length}`);

    // Fetch BSE instruments (for SENSEX)
    const bseInstruments = await kite.getInstruments("BSE");
    console.log(`BSE Instruments: ${bseInstruments.length}`);

    // Search for indices
    const nifty = nseInstruments.find(i => i.tradingsymbol === "NIFTY 50" || i.name === "NIFTY 50");
    const sensex = bseInstruments.find(i => i.tradingsymbol === "SENSEX" || i.name === "SENSEX");

    if (nifty) {
        console.log("Found NIFTY 50:", nifty.instrument_token, nifty.segment, nifty.tradingsymbol);
        // Test History for Nifty
        const data = await kite.getHistoricalData(nifty.instrument_token, "day", new Date("2024-01-01"), new Date("2024-01-10"));
        console.log("NIFTY 50 History:", data.length);
    } else {
        console.log("NIFTY 50 NOT FOUND in NSE");
    }

    if (sensex) {
        console.log("Found SENSEX:", sensex.instrument_token, sensex.segment, sensex.tradingsymbol);
        // Test History for Sensex
        const data = await kite.getHistoricalData(sensex.instrument_token, "day", new Date("2024-01-01"), new Date("2024-01-10"));
        console.log("SENSEX History:", data.length);
    } else {
        console.log("SENSEX NOT FOUND in BSE");
    }

  } catch (err) {
    console.error("API Error:", err.message);
    if (err.data) console.error("Error Data:", JSON.stringify(err.data));
  }
}

testKite();
