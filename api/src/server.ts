import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { connectDB, disconnectDB } from "@/libs/connection";
import logger from "@/libs/logger";
import setupRoutes from "./routes";
import cors from "cors";
import openapiDocument from "./openapi/openapi.json";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/openapi.json", (_req, res) => {
  res.json(openapiDocument);
});

// Without a trailing slash, relative asset URLs (./swagger-ui-bundle.js) resolve to
// the site root and return HTML on Vercel — use /reference/ for Swagger UI.
app.get("/reference", (req, res) => {
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(301, `/reference/${qs}`);
});

app.use(
  "/reference/",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: "Greves Portugal API",
  }),
);

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
