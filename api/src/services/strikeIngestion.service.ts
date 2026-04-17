import type { Browser } from "puppeteer";
import dayjs from "dayjs";
import logger from "@/libs/logger";
import type { ScrapeSummary } from "@/models/strike.model";
import { scrapeObservador } from "@/infra/scrapers/observador.scraper";
import { keepTodayAndFutureDates } from "@/domain/date";
import {
  dedupeScrapedStrikes,
  hasDuplicateInDatabase,
  isSameStrikeNews,
} from "@/domain/dedupe";
import {
  deleteStrikesByIds,
  findCandidatesByStrikeDates,
  findCgtpEntries,
  replaceWithCanonicalCgtpTitle,
  upsertScrapedStrike,
} from "@/infra/repositories/strike.repository";

function isStrikeCancellationTitle(title: string): boolean {
  return title.toLowerCase().includes("desconvocada");
}

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
  if (skipped > 0) {
    logger.warn(`Skipped ${skipped} entries with no parseable dates`);
  }

  const deduped = dedupeScrapedStrikes(withDates);
  const skippedBatchDupes = withDates.length - deduped.length;
  if (skippedBatchDupes > 0) {
    logger.info(
      `Deduped ${skippedBatchDupes} search results (same strike dates + overlapping keywords)`,
    );
  }

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
      const candidates = await findCandidatesByStrikeDates(
        cancellation.strikeDates,
      );
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

      cancelledRelatedDeleted += await deleteStrikesByIds(relatedIds);
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

      await upsertScrapedStrike(entry);
      upserted++;
    } catch (err) {
      const mongoErr = err as { code?: number; message?: string };
      if (mongoErr.code !== 11000) {
        logger.error("Failed to upsert entry", {
          url: entry.url,
          err: mongoErr.message,
        });
        errors++;
      }
    }
  }

  const cgtpEntries = await findCgtpEntries();
  if (cgtpEntries.length > 0) {
    logger.info(`Found ${cgtpEntries.length} CGTP entries`);
    for (const entry of cgtpEntries) {
      logger.info("Creating CGTP entry", {
        title: entry.title,
        url: entry.url,
        strikeDates: entry.strikeDates,
      });
      await replaceWithCanonicalCgtpTitle(entry);
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
