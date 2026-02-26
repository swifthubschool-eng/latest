
import { useEffect, useState } from "react";
import io, { type Socket } from "socket.io-client";

// In production, Socket.IO server is on the same origin as Next.js (unified server.js).
// Passing no URL to io() makes the client connect to the same host automatically.
// In development, we use a separate process on port 3001.
const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL
  || (isDev ? "http://localhost:3001" : undefined); // undefined = same origin

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stockData, setStockData] = useState<any>(null);

  useEffect(() => {
    // If no URL, socket.io connects to current page origin (production unified server)
    const socketInstance = SOCKET_URL
      ? io(SOCKET_URL, { transports: ["websocket", "polling"], reconnectionAttempts: 5 })
      : io({ transports: ["websocket", "polling"], reconnectionAttempts: 5 });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to WebSocket server");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket server");
    });

    socketInstance.on("stock-update", (data: any) => {
      setStockData(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected, stockData };
};
