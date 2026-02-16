
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config();

const port = 3001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  // Example: Listen for subscription requests
  socket.on("subscribe", (symbol) => {
    console.log(`Client ${socket.id} subscribed to ${symbol}`);
    // Here you would typically add the client to a room for that symbol
    socket.join(symbol);
  });
});

// Simulate stock updates for testing
setInterval(() => {
  const mockStocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS"];
  const stock = mockStocks[Math.floor(Math.random() * mockStocks.length)];
  const price = (Math.random() * 2000 + 100).toFixed(2);
  const change = (Math.random() * 20 - 10).toFixed(2);

  io.emit("stock-update", {
    symbol: stock,
    price: parseFloat(price),
    change: parseFloat(change),
    timestamp: new Date().toISOString()
  });
}, 2000);

httpServer.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});
