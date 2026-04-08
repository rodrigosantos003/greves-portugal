import type { Browser } from "puppeteer";
import { Strike } from "@/models/strike.model";
import logger from "./logger";
import type { ScrapedStrike, ScrapeSummary } from "@/models/strike.model";
import { scrapeOBSERVADOR } from "./news";
import { keepTodayAndFutureDates } from "./dateParser";

/**
 * Runs all scrapers in parallel, merges results, and upserts into MongoDB.
 * Returns a summary of the run.
 */
export async function runAllScrapers(browser: Browser): Promise<ScrapeSummary> {
  logger.info("Starting scrape run...");
  const start = Date.now();

  const [observadorResult] = await Promise.allSettled([
    scrapeOBSERVADOR(browser),
  ]);

  const allResults: ScrapedStrike[] = [
    ...(observadorResult.status === "fulfilled" ? observadorResult.value : []),
  ];

  logger.info(`Total raw results: ${allResults.length}`);

  // Keep only today+future dates (Lisbon day) and drop items with none left
  const normalized = allResults.map((r) => ({
    ...r,
    strikeDates: keepTodayAndFutureDates(r.strikeDates),
  }));

  // Filter out entries with no dates (we can't place them on a calendar)
  const withDates = normalized.filter((r) => r.strikeDates.length > 0);
  const skipped = allResults.length - withDates.length;
  if (skipped > 0)
    logger.warn(`Skipped ${skipped} entries with no parseable dates`);

  // Upsert into MongoDB, keyed on URL to prevent duplicates
  let upserted = 0;
  let errors = 0;

  for (const entry of withDates) {
    try {
      await Strike.findOneAndUpdate(
        { url: entry.url },
        {
          $set: {
            title: entry.title,
            description: entry.description,
            source: entry.source,
            strikeDates: entry.strikeDates,
            sector: entry.sector,
            workers: entry.workers,
            confirmed: entry.confirmed,
            scrapedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      upserted++;
    } catch (err) {
      const mongoErr = err as { code?: number; message?: string };
      if (mongoErr.code === 11000) {
        // Duplicate key — already upserted, safe to ignore
      } else {
        logger.error("Failed to upsert entry", {
          url: entry.url,
          err: mongoErr.message,
        });
        errors++;
      }
    }
  }

  const summary: ScrapeSummary = {
    durationSeconds: ((Date.now() - start) / 1000).toFixed(1),
    total: allResults.length,
    withDates: withDates.length,
    upserted,
    errors,
  };

  logger.info("Scrape run complete", { summary });
  return summary;
}
