import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import paymentRoutes from "./routes/payment.js";
import { razorpayWebhook } from "./controllers/payment.js";
import { initDb } from "./utils/initDb.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

// The webhook signature is computed over the raw bytes, so this route must be
// registered BEFORE express.json() parses (and discards) the raw body.
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json", limit: "100kb" }),
  razorpayWebhook
);

app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "payment" });
});

app.use("/api/payment", paymentRoutes);

initDb()
  .then(() => {
    const server = app.listen(process.env.PORT, () => {
      console.log(`Payment Service is running on ${process.env.PORT}`);
    });

    const shutdown = (signal: string) => {
      console.log(`${signal} received, shutting down payment service`);
      server.close(() => process.exit(0));
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((error) => {
    console.error("Error initializing payment database", error);
    process.exit(1);
  });
