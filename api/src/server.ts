import "dotenv/config";
import express from "express";
import { connectDB, disconnectDB } from "@/libs/connection";
import logger from "@/libs/logger";
import setupRoutes from "./routes";

const app = express();
app.use(express.json());

app.use("/api");
setupRoutes(app);

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  await connectDB();
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
