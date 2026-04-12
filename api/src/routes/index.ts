import strikeRoute from "./strike.route";
import { Express } from "express";
import healthRoute from "./health.route";

export default function setupRoutes(app: Express): void {
  app.use("/reference", (req, res) => {
    res.redirect("https://greves-portugal.vercel.app/api-reference");
  });

  app.use("/strikes", strikeRoute);
  app.use("/health", healthRoute);
}
