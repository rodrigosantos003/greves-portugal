import * as cheerio from "cheerio";
import type { Browser } from "puppeteer";
import dayjs from "dayjs";
import logger from "./logger";
import {
  dateISOInLisbon,
  extractDatesFromText,
  keepTodayAndFutureDates,
  parsePtDate,
} from "../controllers/dateParser.controller";
import { type ScrapedStrike } from "../models/strike.model";

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
  await page.setUserAgent({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
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

interface ParsedArticle {
  title: string;
  snippet: string;
  href: string;
  dateText: string;
}

function resolveArticleReferenceDate(article: ParsedArticle): Date {
  return (
    parsePtDate(article.dateText) ??
    parsePtDate(article.snippet) ??
    new Date()
  );
}

/** YYYY-MM-DD for the first day of the current calendar month (Europe/Lisbon). */
function startOfCurrentMonthISO(): string {
  const now = dayjs();
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
  }).format(now.toDate());
  const mo = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    month: "2-digit",
  }).format(now.toDate());
  return `${y}-${mo}-01`;
}

function normalizeGoogleRedirectUrl(raw: string): string {
  try {
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

/**
 * Returns true when the provided text has any explicit DD/MM/YYYY date
 * older than the current month (Europe/Lisbon).
 */
function hasPastExplicitDmyDate(text: string): boolean {
  const monthStart = startOfCurrentMonthISO();
  const dmyPattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;

  for (const match of text.matchAll(dmyPattern)) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year))
      continue;

    // Validate calendar date (avoid rollover from invalid values like 31/02/2026).
    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    ) {
      continue;
    }

    if (dateISOInLisbon(candidate) < monthStart) return true;
  }

  return false;
}

/** Observador search uses an embedded Google Custom Search (CSE) results list. */
function parseObservadorCseResults($: cheerio.CheerioAPI): ParsedArticle[] {
  const baseUrl = "https://observador.pt";
  const articles: ParsedArticle[] = [];

  $(".gsc-webResult").each((_, el) => {
    const item = $(el);
    const title =
      item.find("a.gs-title, .gs-title a").first().text().trim() || "";
    const snippet = (
      item.find(".gs-snippet").first().text().trim() || ""
    ).replace(/\s+/g, " ");

    const linkEl = item.find("a.gs-title").first();
    const hrefRaw =
      linkEl.attr("data-ctorig") ??
      linkEl.attr("href") ??
      item.find("a.gs-image").first().attr("data-ctorig") ??
      item.find("a.gs-image").first().attr("href");

    const href = hrefRaw ? normalizeGoogleRedirectUrl(hrefRaw) : undefined;
    const dateText =
      item.find("time, .date").first().attr("datetime") ??
      item.find("time, .date").first().text().trim();

    if (!title || !href) return;
    if (!containsStrikeKeyword(`${title}`)) return;
    if (hasPastExplicitDmyDate(snippet)) return;

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

function articlesToStrikes(articles: ParsedArticle[]): ScrapedStrike[] {
  return articles.map(({ title, snippet, href, dateText }) => {
    const fullText = `${title} ${snippet}`;
    const articleReferenceDate = resolveArticleReferenceDate({
      title,
      snippet,
      href,
      dateText,
    });
    const strikeDates = keepTodayAndFutureDates(
      extractDatesFromText(`${fullText} ${dateText}`, articleReferenceDate),
    );

    return {
      title,
      description: snippet.slice(0, 300),
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
export async function scrapeObservador(
  browser: Browser,
): Promise<ScrapedStrike[]> {
  logger.info("Scraping Observador...", { url: OBSERVADOR_SEARCH });

  try {
    const html = await fetchPage(browser, OBSERVADOR_SEARCH, ".gsc-webResult");
    const $ = cheerio.load(html);
    const articles = parseObservadorCseResults($);
    const filtered = articles.filter(
      (a) => !`${a.title} ${a.snippet}`.toLowerCase().includes("opinião"),
    );
    const currentYearInLisbon = Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Lisbon",
        year: "numeric",
      }).format(dayjs().toDate()),
    );
    const yearFiltered = filtered.filter((a) => {
      const text = `${a.title} ${a.snippet}`.toLowerCase();
      const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) =>
        Number(m[1]),
      );
      if (years.length === 0) return true;
      return years.every((y) => y >= currentYearInLisbon);
    });

    const monthStart = startOfCurrentMonthISO();
    const monthFiltered = yearFiltered.filter((a) => {
      const text = `${a.title} ${a.snippet} ${a.dateText}`;
      const articleReferenceDate = resolveArticleReferenceDate(a);
      const dates = extractDatesFromText(text, articleReferenceDate);
      if (dates.length === 0) return true;
      return dates.some((d) => dateISOInLisbon(d) >= monthStart);
    });

    const results = articlesToStrikes(monthFiltered);
    logger.info(`Observador: found ${results.length} strike articles`);
    return results;
  } catch (err) {
    logger.error("Observador scraping failed", { err: (err as Error).message });
    return [];
  }
}
