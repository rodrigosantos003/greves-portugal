import * as cheerio from "cheerio";
import type { Browser } from "puppeteer";
import logger from "./logger";
import { extractDatesFromText, keepTodayAndFutureDates } from "./dateParser";
import type { ScrapedStrike, StrikeSource } from "../models/strike.model";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const STRIKE_KEYWORDS_PT = [
  "greve",
  "greves",
  "paralisação",
  "paralisações",
  "pré-aviso de greve",
] as const;

function containsStrikeKeyword(text: string): boolean {
  const t = text.toLowerCase();
  return STRIKE_KEYWORDS_PT.some((kw) => t.includes(kw));
}

function classifySector(text: string): string {
  const t = text.toLowerCase();
  if (
    /\b(comboio|cp\b|metro|autocarro|transportes|rodoviário|ferroviário)\b/.test(
      t,
    )
  )
    return "Transportes";
  if (/\b(médico|enfermeiro|hospitais?|saúde|sns)\b/.test(t)) return "Saúde";
  if (/\b(professor|escola|docente|ensino|educação|universidade)\b/.test(t))
    return "Educação";
  if (/\b(lixo|resíduos|higiene urbana|municipal)\b/.test(t))
    return "Serviços Municipais";
  if (/\b(correios?|ctt\b|postal)\b/.test(t)) return "Correios";
  if (/\b(banco|financ|seguros?)\b/.test(t)) return "Banca e Finanças";
  if (/\b(avião|aeroporto|tap\b|ryanair|pilotos?)\b/.test(t)) return "Aviação";
  return "Outros";
}

async function fetchPage(
  browser: Browser,
  url: string,
  waitForSelector?: string,
): Promise<string> {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  );
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

interface ParsedArticle {
  title: string;
  snippet: string;
  href: string;
  dateText: string;
}

function normalizeGoogleRedirectUrl(raw: string): string {
  try {
    // Google CSE often returns https://www.google.com/url?...&q=<realUrl>
    const u = new URL(raw);
    if (u.hostname.includes("google.") && u.pathname === "/url") {
      const q = u.searchParams.get("q");
      if (q && /^https?:\/\//i.test(q)) return q;
    }
  } catch {
    // ignore
  }
  return raw;
}

function parseArticleCards(
  $: cheerio.CheerioAPI,
  selector: string,
  baseUrl: string,
): ParsedArticle[] {
  const articles: ParsedArticle[] = [];

  $(selector).each((_, el) => {
    const item = $(el);
    // Supports both site-native cards and Google CSE blocks (gsc-webResult)
    const title =
      item
        .find(
          "a.gs-title, .gs-title a, h2 a, h3 a, h2, h3, .title, .headline a",
        )
        .first()
        .text()
        .trim() || "";
    const snippet = (
      item.find(".gs-snippet, p, .lead, .summary").first().text().trim() || ""
    ).replace(/\s+/g, " ");

    const linkEl =
      item.find("a.gs-title").first().length > 0
        ? item.find("a.gs-title").first()
        : item.find("a").first();

    const hrefRaw =
      linkEl.attr("data-ctorig") ??
      linkEl.attr("data-ctorig") ??
      linkEl.attr("href") ??
      item.find("a.gs-image").first().attr("data-ctorig") ??
      item.find("a.gs-image").first().attr("href");

    const href = hrefRaw ? normalizeGoogleRedirectUrl(hrefRaw) : undefined;
    const dateText =
      item.find("time, .date").first().attr("datetime") ??
      item.find("time, .date").first().text().trim();

    if (!title || !href) return;
    if (!containsStrikeKeyword(`${title} ${snippet}`)) return;

    const absoluteHref = href.startsWith("http") ? href : `${baseUrl}${href}`;
    articles.push({
      title,
      snippet,
      href: absoluteHref,
      dateText: dateText ?? "",
    });
  });

  return articles;
}

function articlesToStrikes(
  articles: ParsedArticle[],
  source: StrikeSource,
): ScrapedStrike[] {
  return articles.map(({ title, snippet, href, dateText }) => {
    const fullText = `${title} ${snippet}`;
    const strikeDates = keepTodayAndFutureDates(
      extractDatesFromText(`${fullText} ${dateText}`),
    );

    return {
      title,
      description: snippet.slice(0, 300),
      source,
      url: href,
      strikeDates,
      sector: classifySector(fullText),
      workers: null,
      confirmed: false,
    };
  });
}

const OBSERVADOR_SEARCH = "https://observador.pt/pesquisa/?q=greve";

/**
 * Scrapes Observador's search results for "greve".
 */
export async function scrapeOBSERVADOR(
  browser: Browser,
): Promise<ScrapedStrike[]> {
  logger.info("Scraping Observador...", { url: OBSERVADOR_SEARCH });

  try {
    const html = await fetchPage(browser, OBSERVADOR_SEARCH, ".gsc-webResult");
    const $ = cheerio.load(html);
    const articles = parseArticleCards(
      $,
      // Observador search frequently renders via Google CSE blocks
      ".gsc-webResult, .gsc-result, article, .article-item, .search-item",
      "https://observador.pt",
    );
    const filtered = articles.filter(
      (a) => !`${a.title} ${a.snippet}`.toLowerCase().includes("opinião"),
    );
    const currentYear = new Date().getFullYear();
    const yearFiltered = filtered.filter((a) => {
      const text = `${a.title} ${a.snippet}`.toLowerCase();
      const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) =>
        Number(m[1]),
      );
      if (years.length === 0) return true;
      return years.every((y) => y === currentYear);
    });

    const results = articlesToStrikes(yearFiltered, "observador");
    logger.info(`Observador: found ${results.length} strike articles`);
    return results;
  } catch (err) {
    logger.error("Observador scraping failed", { err: (err as Error).message });
    return [];
  }
}
