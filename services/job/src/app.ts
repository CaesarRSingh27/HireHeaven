import express from "express";
import helmet from "helmet";
import cors from "cors";
import jobRoutes from "./routes/job.js";

import growthRoutes from "./growth.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "job" });
});

app.use("/api/job/growth", growthRoutes);
app.use("/api/job", jobRoutes);

export default app;
