# Zerodha Kite Connect - Access Token Guide

## Quick Steps

### 1. Get a Fresh Request Token
**Click this link** (opens Zerodha login):
```
https://kite.zerodha.com/connect/login?api_key=232x3qvv7auv6ln3&v=3
```

### 2. Login
- Enter your Zerodha credentials
- Complete 2FA

### 3. Copy Request Token
After login, you'll be redirected to:
```
http://127.0.0.1/?request_token=XXXXXX&action=login&status=success
```
**Copy the entire `request_token` value** (the part after `request_token=` and before `&action`)

### 4. Generate Access Token
Run this command (replace `YOUR_REQUEST_TOKEN`):
```bash
node scripts/get-access-token.js YOUR_REQUEST_TOKEN
```

### 5. Add to .env
Copy the access token from the output and add it to `.env`:
```env
KITE_ACCESS_TOKEN="your_access_token_here"
```

### 6. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Important Notes
- ⏰ Request tokens expire in **2-3 minutes** - use them quickly!
- 🔄 Request tokens are **single-use** - you can't reuse them
- 📅 Access tokens expire **daily at 6 AM IST**
- 🔑 Keep your access token secure - don't commit it to Git

## Troubleshooting

### "Invalid request token"
- The token expired (older than 2-3 minutes)
- The token was already used
- **Solution**: Get a fresh request token (repeat Step 1)

### "Invalid API key"
- Check that `KITE_API_KEY` in `.env` matches your Kite Connect app
- Ensure your app is activated and subscription is active

### "Invalid API secret"
- Verify `KITE_API_SECRET` in `.env` is correct
- Don't confuse it with the API key
