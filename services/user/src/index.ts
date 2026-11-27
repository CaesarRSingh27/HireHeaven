import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import userRoutes from "./routes/user.js";
import { migrateLegacyResumes } from "./utils/private-resumes.js";

dotenv.config();

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
  res.json({ status: "ok", service: "user" });
});

app.use("/api/user", userRoutes);

void migrateLegacyResumes();
const resumeMigrationTimer = setInterval(() => void migrateLegacyResumes(), 30 * 60_000);
resumeMigrationTimer.unref();

const server = app.listen(process.env.PORT, () => {
  console.log(
    `User service is running on http://localhost:${process.env.PORT}`
  );
});

const shutdown = (signal: string) => {
  clearInterval(resumeMigrationTimer);
  console.log(`${signal} received, shutting down user service`);
  server.close(() => process.exit(0));
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
