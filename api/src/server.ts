import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { connectDB, disconnectDB } from "@/libs/connection";
import logger from "@/libs/logger";
import setupRoutes from "./routes";
import cors from "cors";
import openapiDocument from "./openapi/openapi.json";

const app = express();

app.use(express.json());

app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120, // per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again in a minute." },
});
app.use(globalLimiter);

app.get("/openapi.json", (_req, res) => {
  res.json(openapiDocument);
});

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  await connectDB();
  await setupRoutes(app);
  const server = app.listen(port, () => {
    logger.info(`API listening on port ${port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => void 0);
    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((err: Error) => {
  logger.error("API fatal error", { err: err.message });
  process.exit(1);
});

export default app;
