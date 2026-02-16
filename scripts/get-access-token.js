/**
 * Generate Zerodha Access Token
 * 
 * Usage: node scripts/get-access-token.js YOUR_REQUEST_TOKEN
 */

const { KiteConnect } = require("kiteconnect");
require('dotenv').config();

const requestToken = process.argv[2] || "9D0jBD5FuHR0sXTjh0eQgcipI2iEOtL7";

if (!requestToken) {
  console.error("❌ Please provide a request token");
  console.log("Usage: node scripts/get-access-token.js YOUR_REQUEST_TOKEN");
  process.exit(1);
}

const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

console.log("\n🔄 Generating access token...\n");

kite.generateSession(requestToken, process.env.KITE_API_SECRET)
  .then((response) => {
    console.log("✅ Success! Your access token:\n");
    console.log("\x1b[32m%s\x1b[0m", response.access_token);
    console.log("\n📝 Add this to your .env file:");
    console.log(`KITE_ACCESS_TOKEN="${response.access_token}"`);
    console.log("\n✨ Token expires at 6 AM tomorrow\n");
  })
  .catch((error) => {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Make sure:");
    console.log("1. KITE_API_KEY and KITE_API_SECRET are correct in .env");
    console.log("2. Request token is fresh (expires in a few minutes)");
    console.log("3. You haven't used this request token before\n");
  });
