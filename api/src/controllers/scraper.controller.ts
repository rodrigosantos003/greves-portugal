import type { Browser } from "puppeteer";
import { Strike } from "@/models/strike.model";
import logger from "../libs/logger";
import type { ScrapeSummary } from "@/models/strike.model";
import { scrapeObservador } from "../libs/news";
import { keepTodayAndFutureDates } from "./dateParser.controller";
import {
  dedupeScrapedStrikes,
  hasDuplicateInDatabase,
  isSameStrikeNews,
} from "./strikeDedupe.controller";
import dayjs from "dayjs";

function isStrikeCancellationTitle(title: string): boolean {
  return title.toLowerCase().includes("desconvocada");
}

/**
 * Scrapes Observador, normalizes dates, and upserts into MongoDB.
 */
export async function runScraper(browser: Browser): Promise<ScrapeSummary> {
  logger.info("Starting scrape run...");
  const start = dayjs();

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

  const cancellationEntries = deduped.filter((entry) =>
    isStrikeCancellationTitle(entry.title),
  );
  const nonCancellationEntries = deduped.filter(
    (entry) => !isStrikeCancellationTitle(entry.title),
  );
  const upsertEntries = nonCancellationEntries.filter(
    (entry) =>
      !cancellationEntries.some((cancellation) =>
        isSameStrikeNews(entry, cancellation),
      ),
  );
  const skippedCancelledInBatch =
    nonCancellationEntries.length - upsertEntries.length;
  if (skippedCancelledInBatch > 0) {
    logger.info(
      `Skipped ${skippedCancelledInBatch} entries cancelled by desconvocada news in this batch`,
    );
  }

  let upserted = 0;
  let databaseDuplicatesSkipped = 0;
  let errors = 0;
  let cancelledRelatedDeleted = 0;
  for (const cancellation of cancellationEntries) {
    if (cancellation.strikeDates.length === 0) continue;
    try {
      const times = cancellation.strikeDates.map((d) => d.getTime());
      const padMs = 72 * 3600 * 1000;
      const tMin = Math.min(...times) - padMs;
      const tMax = Math.max(...times) + padMs;

      const candidates = await Strike.find({
        strikeDates: {
          $elemMatch: { $gte: new Date(tMin), $lte: new Date(tMax) },
        },
      })
        .select({ _id: 1, title: 1, description: 1, strikeDates: 1, url: 1 })
        .lean()
        .limit(200);

      const relatedIds = candidates
        .filter((candidate) =>
          isSameStrikeNews(cancellation, {
            title: candidate.title,
            description: candidate.description ?? "",
            strikeDates: candidate.strikeDates,
          }),
        )
        .map((candidate) => candidate._id);
      if (relatedIds.length === 0) continue;

      const deleted = await Strike.deleteMany({ _id: { $in: relatedIds } });
      cancelledRelatedDeleted += deleted.deletedCount ?? 0;
    } catch (err) {
      logger.error("Failed to delete cancelled strike entries", {
        title: cancellation.title,
        err: (err as Error).message,
      });
      errors++;
    }
  }
  if (cancelledRelatedDeleted > 0) {
    logger.info(
      `Deleted ${cancelledRelatedDeleted} strike entries from cancelled news`,
    );
  }

  for (const entry of upsertEntries) {
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
            scrapedAt: dayjs().toDate(),
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
    durationSeconds: dayjs().diff(start, "seconds").toString(),
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
