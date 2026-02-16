
import { KiteTicker } from "kiteconnect";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const checkEnv = () => {
  if (!process.env.KITE_API_KEY) throw new Error("KITE_API_KEY is missing");
  if (!process.env.KITE_ACCESS_TOKEN) throw new Error("KITE_ACCESS_TOKEN is missing");
};

checkEnv();

const redisPublisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ticker = new KiteTicker({
  api_key: process.env.KITE_API_KEY!,
  access_token: process.env.KITE_ACCESS_TOKEN!,
});

// Example Instrument Tokens (NSE)
// Reliance: 738561, TCS: 2953217, Infosys: 408065
const INSTRUMENT_TOKENS = [738561, 2953217, 408065];

ticker.connect();
ticker.on("ticks", onTicks);
ticker.on("connect", subscribe);
ticker.on("disconnect", onDisconnect);
ticker.on("error", onError);
ticker.on("close", onClose);

function onTicks(ticks: any[]) {
  // console.log("Ticks: ", ticks);
  // Publish ticks to Redis
  redisPublisher.publish("stock-updates", JSON.stringify(ticks));
}

function subscribe() {
  console.log("[Kite Worker] Connected. Subscribing to tokens...");
  ticker.subscribe(INSTRUMENT_TOKENS);
  ticker.setMode(ticker.modeFull, INSTRUMENT_TOKENS);
}

function onDisconnect(error: any) {
  console.log("[Kite Worker] Disconnected", error);
}

function onError(error: any) {
  console.log("[Kite Worker] Error", error);
}

function onClose(reason: any) {
  console.log("[Kite Worker] Closed", reason);
}
