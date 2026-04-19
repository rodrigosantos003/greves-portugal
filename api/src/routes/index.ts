import strikeRoute from "./strike.route";
import { Express } from "express";
import healthRoute from "./health.route";

export default async function setupRoutes(app: Express): Promise<void> {
  const { apiReference } = await import("@scalar/express-api-reference");
  app.use("/reference", apiReference({ url: "/openapi.json" }));

  app.get("/", (_req, res) => {
    res.redirect(301, "/reference");
  });

  app.use("/strikes", strikeRoute);
  app.use("/health", healthRoute);
}
