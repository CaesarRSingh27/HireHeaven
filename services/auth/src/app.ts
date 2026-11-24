import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { connectKafka } from "./producer.js";

const app = express();

app.set("trust proxy", 1); // behind nginx
app.use(helmet());

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

app.use(express.json({ limit: "100kb" }));

connectKafka();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth" });
});

app.use("/api/auth", authRoutes);

export default app;
