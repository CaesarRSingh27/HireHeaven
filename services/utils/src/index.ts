import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import routes from "./routes.js";
import { startSendMailConsumer, stopSendMailConsumer } from "./consumer.js";

dotenv.config();

startSendMailConsumer();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

// A 25 MB file becomes about 34 MB when encoded as a Cloudinary data URI.
app.use(express.json({ limit: "40mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "utils" });
});

app.use("/api/utils", routes);

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Utils Service is running on http://localhost:${process.env.PORT}`
  );
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down utils service`);
  server.close();
  await stopSendMailConsumer().catch(() => {});
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
