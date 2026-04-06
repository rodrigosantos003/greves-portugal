import strikeRoute from "./strike.route";
import { Express } from "express";
import healthRoute from "./health.route";

export default function setupRoutes(app: Express): void {
  app.use("/strikes", strikeRoute);
  app.use("/health", healthRoute);
}
