
import { Server } from "socket.io";
import { createServer } from "http";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"],
  },
});

const redisSubscriber = new Redis(REDIS_URL);

redisSubscriber.subscribe("stock-updates", (err: Error | null | undefined, count: any) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(
      `[Socket Server] Subscribed successfully! This client is currently subscribed to ${count} channels.`
    );
  }
});

redisSubscriber.on("message", (channel: string, message: string) => {
  if (channel === "stock-updates") {
    console.log(`[Socket Server] Received message from ${channel}`);
    // Broadcast the message to all connected clients
    io.emit("stock-update", JSON.parse(message));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket Server] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket Server] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket Server] Listening on port ${PORT}`);
});
