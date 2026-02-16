
const { KiteConnect } = require("kiteconnect");
require("dotenv").config({ path: ".env" });

const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);

async function checkIndices() {
  try {
    const instruments = await kite.getInstruments("NSE");
    
    const targets = ["NIFTY 50", "NIFTY BANK", "FINNIFTY", "NIFTY FIN SERVICE"];
    
    // Find exact matches first
    const relevant = instruments.filter(i => 
        i.segment === 'INDICES' && 
        targets.some(t => i.name === t || i.tradingsymbol === t)
    );
    
    if (relevant.length === 0) {
        // Fallback to partial
        const relevantPartial = instruments.filter(i => 
            i.segment === 'INDICES' && 
            targets.some(t => i.name.includes(t))
        );
        relevantPartial.forEach(i => console.log(`${i.tradingsymbol}|${i.name}|${i.instrument_token}`));
    } else {
        relevant.forEach(i => console.log(`${i.tradingsymbol}|${i.name}|${i.instrument_token}`));
    }

  } catch (error) {
    console.error(error);
  }
}

checkIndices();
