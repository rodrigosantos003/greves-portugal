import "dotenv/config";
import puppeteer, { type Browser } from "puppeteer";
import cron from "node-cron";
import { connectDB, disconnectDB } from "@/libs/connection";
import { runAllScrapers } from "@/libs/scraper";
import logger from "@/libs/logger";
import { ScrapeSummary } from "@/models/strike.model";

const CRON_SCHEDULE = process.env.SCRAPE_INTERVAL_CRON ?? "0 6,12,18 * * *";
const RUN_ONCE = process.argv.includes("--run-once");

async function scrapeWithBrowser(): Promise<ScrapeSummary> {
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
    return await runAllScrapers(browser);
  } finally {
    await browser?.close();
  }
}

async function main(): Promise<void> {
  await connectDB();

  if (RUN_ONCE) {
    logger.info("Running in one-shot mode (--run-once)");
    try {
      const summary = await scrapeWithBrowser();
      logger.info("Done", summary);
    } finally {
      await disconnectDB();
    }
    return;
  }

  // Scheduled mode — run on cron and keep the process alive
  logger.info(`Scheduler started. Cron: "${CRON_SCHEDULE}"`);

  // Run immediately on startup, then follow the schedule
  await scrapeWithBrowser().catch((err: Error) =>
    logger.error("Initial scrape failed", { err: err.message }),
  );

  cron.schedule(CRON_SCHEDULE, async () => {
    logger.info("Cron triggered scrape");
    await scrapeWithBrowser().catch((err: Error) =>
      logger.error("Scheduled scrape failed", { err: err.message }),
    );
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down...`);
    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err: Error) => {
  logger.error("Fatal error", { err: err.message });
  process.exit(1);
});
