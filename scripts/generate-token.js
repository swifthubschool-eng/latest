/**
 * Zerodha Kite Connect - Access Token Generator
 * 
 * This script helps you generate an access token for Zerodha Kite Connect API.
 * 
 * Steps:
 * 1. Run this script: node scripts/generate-token.js
 * 2. Open the URL displayed in your browser
 * 3. Login with your Zerodha credentials
 * 4. Copy the access token and add it to your .env file
 */

const readline = require('readline');

const API_KEY = process.env.KITE_API_KEY || '232x3qvv7auv6ln3';
const LOGIN_URL = `https://kite.zerodha.com/connect/login?api_key=${API_KEY}&v=3`;

console.log('\n=== Zerodha Kite Connect - Access Token Generator ===\n');
console.log('Step 1: Open this URL in your browser:');
console.log('\x1b[36m%s\x1b[0m', LOGIN_URL);
console.log('\nStep 2: Login with your Zerodha credentials');
console.log('\nStep 3: After login, you will be redirected to a URL like:');
console.log('http://127.0.0.1/?request_token=XXXXXX&action=login&status=success');
console.log('\nStep 4: Copy the request_token from the URL');
console.log('\nStep 5: Visit this URL to generate access token:');
console.log('\x1b[36m%s\x1b[0m', 'http://localhost:3000/api/kite/callback?request_token=YOUR_REQUEST_TOKEN');
console.log('\nStep 6: Copy the access_token from the response and add it to .env file\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Press Enter to open the login URL in your browser...', () => {
  const open = require('open');
  open(LOGIN_URL);
  console.log('\n✅ Browser opened! Follow the steps above.\n');
  rl.close();
});
