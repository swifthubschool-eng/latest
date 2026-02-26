// server.js — Unified server: Next.js + Socket.IO on the same port
// Required for Render, where only a single PORT is available.
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { KiteConnect } = require("kiteconnect");
require("dotenv").config();

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  // ── Socket.IO ────────────────────────────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://latest-ti4r.onrender.com",
        "https://latest-2jlp.onrender.com",
        "https://nifty-test-2.vercel.app",
      ],
      methods: ["GET", "POST"],
    },
  });

  const subscribedSymbols = new Set();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
    socket.on("subscribe", (symbol) => {
      if (!symbol) return;
      const clean = symbol.toUpperCase();
      socket.join(clean);
      subscribedSymbols.add(clean);
    });
    socket.on("unsubscribe", (symbol) => {
      if (!symbol) return;
      socket.leave(symbol.toUpperCase());
    });
  });

  // ── Kite market data loop ────────────────────────────────────────────────
  const kite = new KiteConnect({ api_key: process.env.KITE_API_KEY });
  if (process.env.KITE_ACCESS_TOKEN) {
    kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);
  }

  const INDICES = [
    { key: "NSE:NIFTY 50",        symbol: "NIFTY 50" },
    { key: "NSE:NIFTY BANK",      symbol: "NIFTY BANK" },
    { key: "NSE:NIFTY FIN SERVICE", symbol: "NIFTY FIN SERVICE" },
    { key: "NSE:NIFTY MIDCAP 100", symbol: "NIFTY MIDCAP 100" },
    { key: "NSE:NIFTY SMLCAP 100", symbol: "NIFTY SMLCAP 100" },
    { key: "BSE:SENSEX",           symbol: "SENSEX" },
  ];

  setInterval(async () => {
    try {
      const symbolsToFetch = INDICES.map((i) => i.key);

      subscribedSymbols.forEach((s) => {
        const upper = s.toUpperCase();
        let full;
        if (upper === "SENSEX") full = "BSE:SENSEX";
        else if (["NIFTY BANK", "BANKNIFTY"].includes(upper)) full = "NSE:NIFTY BANK";
        else if (["FINNIFTY", "NIFTY FIN SERVICE"].includes(upper)) full = "NSE:NIFTY FIN SERVICE";
        else if (upper.includes(":")) full = upper;
        else full = `NSE:${upper}`;
        if (!symbolsToFetch.includes(full)) symbolsToFetch.push(full);
      });

      const quotes = await kite.getQuote(symbolsToFetch);

      // Broadcast index updates
      INDICES.forEach((idx) => {
        const data = quotes[idx.key];
        if (!data) return;
        const change = data.net_change || 0;
        const prev = data.ohlc?.close || data.last_price;
        const percent = prev > 0 ? (change / prev) * 100 : 0;
        io.emit("index-update", {
          symbol: idx.symbol,
          price: data.last_price,
          change,
          percent,
          timestamp: new Date().toISOString(),
        });
      });

      // Broadcast subscribed stock updates
      subscribedSymbols.forEach((symbol) => {
        const upper = symbol.toUpperCase();
        let key = upper.includes(":") ? upper : `NSE:${upper}`;
        const data = quotes[key];
        if (!data || !data.last_price) return;
        const prev = data.ohlc?.close || 0;
        const change = data.net_change || 0;
        const percent = prev > 0 ? (change / prev) * 100 : 0;
        io.to(symbol).emit("stock-update", {
          symbol,
          price: data.last_price,
          change,
          percent,
          volume: data.volume,
          timestamp: new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error("Error in fetch cycle:", err.message);
    }
  }, 2000);

  // ── Start ────────────────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
});
