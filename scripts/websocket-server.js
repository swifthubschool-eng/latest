
const { Server } = require("socket.io");
const { createServer } = require("http");
require("dotenv").config();

const port = process.env.PORT || 3001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://latest-ti4r.onrender.com",
      "https://latest-2jlp.onrender.com",
      "https://nifty-test-2.vercel.app",
      "https://nifty-test-2-cq10kjrai-swifthubschool-engs-projects.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

// Track subscribed symbols
const subscribedSymbols = new Set();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("subscribe", (symbol) => {
    if (!symbol) return;
    const cleanSymbol = symbol.toUpperCase();
    console.log(`Client ${socket.id} subscribed to ${cleanSymbol}`);
    socket.join(cleanSymbol);
    subscribedSymbols.add(cleanSymbol);
  });
  
  socket.on("unsubscribe", (symbol) => {
    if (!symbol) return;
    const cleanSymbol = symbol.toUpperCase();
    console.log(`Client ${socket.id} unsubscribed from ${cleanSymbol}`);
    socket.leave(cleanSymbol);
    // Note: We don't remove from subscribedSymbols Set immediately because other clients might be subscribed.
    // In a production app, we'd count reference subscriptions. 
    // For now, it's fine to keep fetching.
  });
});

// State for Nifty 50
let niftyPrice = 25935.15;

// Initialize Kite Connect
const { KiteConnect } = require("kiteconnect");
const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});
if (process.env.KITE_ACCESS_TOKEN) {
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);
}

// Update function
setInterval(async () => {
  try {
    // 1. Define Major Indices to Broadcast (Dashboard)
    const INDICES_BS = [
      { key: "NSE:NIFTY 50", symbol: "NIFTY 50" },
      { key: "NSE:NIFTY BANK", symbol: "NIFTY BANK" },
      { key: "NSE:NIFTY FIN SERVICE", symbol: "NIFTY FIN SERVICE" },
      { key: "NSE:NIFTY MIDCAP 100", symbol: "NIFTY MIDCAP 100" },
      { key: "NSE:NIFTY SMLCAP 100", symbol: "NIFTY SMLCAP 100" },
      { key: "BSE:SENSEX", symbol: "SENSEX" }
    ];

    // 2. Prepare list of symbols to fetch
    const symbolsToFetch = INDICES_BS.map(i => i.key);
    
    // Add subscribed symbols
    subscribedSymbols.forEach(s => {
        // Avoid duplicates
        let fullSymbol;
        const upper = s.toUpperCase();
        
        // Map common aliases to official symbols for FETCHING
        if (upper === "SENSEX") fullSymbol = "BSE:SENSEX";
        else if (upper === "NIFTY BANK" || upper === "BANKNIFTY") fullSymbol = "NSE:NIFTY BANK";
        else if (upper === "FINNIFTY" || upper === "NIFTY FIN SERVICE") fullSymbol = "NSE:NIFTY FIN SERVICE";
        else if (upper === "MIDCAP" || upper === "NIFTY MIDCAP 100") fullSymbol = "NSE:NIFTY MIDCAP 100";
        else if (upper === "SMALLCAP" || upper === "NIFTY SMLCAP 100") fullSymbol = "NSE:NIFTY SMLCAP 100";
        else if (upper.includes(":")) fullSymbol = upper; // Already has exchange
        else fullSymbol = `NSE:${upper}`; // Default stocks
        
        if (!symbolsToFetch.includes(fullSymbol)) {
             symbolsToFetch.push(fullSymbol);
        }
    });

    if (symbolsToFetch.length === 0) return;

    // console.log("Fetching quotes for:", symbolsToFetch);
    const quotes = await kite.getQuote(symbolsToFetch);
    
    // 3. Process & Broadcast Indices
    INDICES_BS.forEach(idx => {
        if (quotes[idx.key]) {
            const data = quotes[idx.key];
            const change = data.net_change || 0;
            const prevClose = data.ohlc?.close || data.last_price;
            const percent = prevClose > 0 ? (change / prevClose) * 100 : 0;
            
            const updateData = {
                symbol: idx.symbol, // "NIFTY 50", "SENSEX" etc.
                price: data.last_price,
                change: change,
                percent: percent,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to all clients (Dashboard uses this)
            io.emit("index-update", updateData);
        }
    });

    // Process Subscribed Stocks
    // Process Subscribed Stocks
    subscribedSymbols.forEach(symbol => {
        const upper = symbol.toUpperCase();
        let key;
        
        // Map alias to key for LOOKUP
        if (upper === "SENSEX") key = "BSE:SENSEX";
        else if (upper === "NIFTY BANK" || upper === "BANKNIFTY") key = "NSE:NIFTY BANK";
        else if (upper === "FINNIFTY" || upper === "NIFTY FIN SERVICE") key = "NSE:NIFTY FIN SERVICE";
        else if (upper === "MIDCAP" || upper === "NIFTY MIDCAP 100") key = "NSE:NIFTY MIDCAP 100";
        else if (upper === "SMALLCAP" || upper === "NIFTY SMLCAP 100") key = "NSE:NIFTY SMLCAP 100";
        else if (upper.includes(":")) key = upper;
        else key = `NSE:${upper}`;

        if (quotes[key]) {
            const data = quotes[key];
            
            const price = data.last_price || 0;
            const previousClose = data.ohlc?.close || 0;
            const change = data.net_change || 0;
            
            const percent = previousClose > 0 ? (change / previousClose) * 100 : 0;
            
            const stockUpdate = {
                symbol: symbol, // Send back original alias so client matches it
                price: price,
                change: change,
                percent: percent,
                volume: data.volume,
                timestamp: new Date().toISOString()
            };
            
            // Only emit if we have a valid price
            if (price > 0) {
                io.to(symbol).emit("stock-update", stockUpdate);
            }
        }
    });

  } catch (error) {
    console.error("Error in fetch cycle:", error.message);
  }
}, 2000);

httpServer.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});
