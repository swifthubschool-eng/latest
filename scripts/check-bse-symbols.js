const { KiteConnect } = require("kiteconnect");
require("dotenv").config({ path: ".env" });

async function checkBSE() {
  const kite = new KiteConnect({ api_key: process.env.KITE_API_KEY });
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);

  try {
    console.log("Fetching BSE Instruments...");
    const instruments = await kite.getInstruments("BSE");
    
    const reliance = instruments.find(i => i.tradingsymbol === "RELIANCE");
    const tcs = instruments.find(i => i.tradingsymbol === "TCS");
    const infy = instruments.find(i => i.tradingsymbol === "INFY");

    if (reliance) {
        console.log("Found BSE:RELIANCE -> Token:", reliance.instrument_token);
    } else {
        console.log("BSE:RELIANCE NOT FOUND (Maybe uses code?)");
    }

    if (tcs) console.log("Found BSE:TCS -> Token:", tcs.instrument_token);
    if (infy) console.log("Found BSE:INFY -> Token:", infy.instrument_token);

    // Check quote
    if (reliance) {
        console.log("Fetching Quote for BSE:RELIANCE...");
        const quote = await kite.getQuote(["BSE:RELIANCE"]);
        console.log("Quote:", quote["BSE:RELIANCE"] ? "Success" : "Failed");
        if (quote["BSE:RELIANCE"]) {
            console.log("Price:", quote["BSE:RELIANCE"].last_price);
        }
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkBSE();
