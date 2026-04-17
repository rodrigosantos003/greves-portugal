import * as cheerio from "cheerio";
import type { Browser } from "puppeteer";
import logger from "@/libs/logger";
import { type ScrapedStrike } from "@/models/strike.model";
import {
  articlesToStrikes,
  filterCurrentOrFutureArticles,
  parseObservadorCseResults,
} from "@/domain/newsParsing";

const OBSERVADOR_SEARCH = "https://observador.pt/pesquisa/?q=greve";

async function fetchPage(
  browser: Browser,
  url: string,
  waitForSelector?: string,
): Promise<string> {
  const page = await browser.newPage();
  await page.setUserAgent({
    userAgent: "GrevesPortugalBot/1.0 (+https://greves-portugal.vercel.app)",
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (waitForSelector) {
      await page
        .waitForSelector(waitForSelector, { timeout: 15_000 })
        .catch(() => undefined);
    }
    return await page.content();
  } finally {
    await page.close();
  }
}

export async function scrapeObservador(
  browser: Browser,
): Promise<ScrapedStrike[]> {
  logger.info("Scraping Observador...", { url: OBSERVADOR_SEARCH });

  try {
    const html = await fetchPage(browser, OBSERVADOR_SEARCH, ".gsc-webResult");
    const $ = cheerio.load(html);
    const articles = parseObservadorCseResults($);
    const filteredArticles = filterCurrentOrFutureArticles(articles);
    const results = articlesToStrikes(filteredArticles);
    logger.info(`Observador: found ${results.length} strike articles`);
    return results;
  } catch (err) {
    logger.error("Observador scraping failed", { err: (err as Error).message });
    return [];
  }
}
