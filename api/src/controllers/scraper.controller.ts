import type { Browser } from "puppeteer";
import { Strike } from "@/models/strike.model";
import logger from "../libs/logger";
import type { ScrapeSummary } from "@/models/strike.model";
import { scrapeObservador } from "../libs/news";
import { keepTodayAndFutureDates } from "./dateParser.controller";
import {
  dedupeScrapedStrikes,
  hasDuplicateInDatabase,
} from "./strikeDedupe.controller";

/**
 * Scrapes Observador, normalizes dates, and upserts into MongoDB.
 */
export async function runScraper(browser: Browser): Promise<ScrapeSummary> {
  logger.info("Starting scrape run...");
  const start = Date.now();

  const allResults = await scrapeObservador(browser);

  logger.info(`Total raw results: ${allResults.length}`);

  const normalized = allResults.map((r) => ({
    ...r,
    strikeDates: keepTodayAndFutureDates(r.strikeDates),
  }));

  const withDates = normalized.filter((r) => r.strikeDates.length > 0);
  const skipped = allResults.length - withDates.length;
  if (skipped > 0)
    logger.warn(`Skipped ${skipped} entries with no parseable dates`);

  const deduped = dedupeScrapedStrikes(withDates);
  const skippedBatchDupes = withDates.length - deduped.length;
  if (skippedBatchDupes > 0)
    logger.info(
      `Deduped ${skippedBatchDupes} search results (same strike dates + overlapping keywords)`,
    );

  let upserted = 0;
  let databaseDuplicatesSkipped = 0;
  let errors = 0;

  for (const entry of deduped) {
    try {
      if (await hasDuplicateInDatabase(entry)) {
        databaseDuplicatesSkipped++;
        continue;
      }
      await Strike.findOneAndUpdate(
        { url: entry.url },
        {
          $set: {
            title: entry.title,
            description: entry.description,
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
    searchDuplicatesSkipped: skippedBatchDupes,
    upserted,
    databaseDuplicatesSkipped,
    errors,
  };

  logger.info("Scrape run complete", { summary });
  return summary;
}
