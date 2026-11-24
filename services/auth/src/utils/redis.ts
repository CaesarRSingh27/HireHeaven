import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient = createClient({ url: process.env.Redis_url });

redisClient.on("error", (error) => console.error("Redis error:", error));

// node-redis keeps retrying until it connects, so do not block start-up on it.
export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("connected to redis");
  }
};
