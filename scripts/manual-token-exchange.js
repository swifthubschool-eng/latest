/**
 * Manual Zerodha Token Exchange Script
 * 
 * Usage: node scripts/manual-token-exchange.js YOUR_REQUEST_TOKEN
 */

const crypto = require("crypto");
const axios = require("axios");
require('dotenv').config();

const requestToken = process.argv[2] || "9D0jBD5FuHR0sXTjh0eQgcipI2iEOtL7";

if (!requestToken) {
  console.error("❌ Please provide a request token");
  console.log("Usage: node scripts/manual-token-exchange.js YOUR_REQUEST_TOKEN");
  process.exit(1);
}

const apiKey = process.env.KITE_API_KEY;
const apiSecret = process.env.KITE_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("❌ KITE_API_KEY or KITE_API_SECRET missing in .env");
  process.exit(1);
}

console.log("\n🔄 Generating access token manually...\n");
console.log(`API Key: ${apiKey}`);
console.log(`Request Token: ${requestToken}`);

// Calculate Checksum: SHA-256(api_key + request_token + api_secret)
const checksum = crypto
  .createHash("sha256")
  .update(apiKey + requestToken + apiSecret)
  .digest("hex");

console.log(`Checksum: ${checksum}\n`);

async function getToken() {
  try {
    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('request_token', requestToken);
    params.append('checksum', checksum);

    const response = await axios.post(
      "https://api.kite.trade/session/token",
      params,
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" } 
      }
    );

    console.log("✅ Success! Your access token:\n");
    console.log("\x1b[32m%s\x1b[0m", response.data.data.access_token);
    console.log("\n📝 Add this to your .env file:");
    console.log(`KITE_ACCESS_TOKEN="${response.data.data.access_token}"`);
    console.log("\n✨ Token expires at 6 AM tomorrow\n");
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}

getToken();
