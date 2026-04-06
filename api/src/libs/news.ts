import * as cheerio from "cheerio";
import type { Browser } from "puppeteer";
import logger from "./logger";
import { extractDatesFromText } from "./dateParser";
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

async function fetchPage(browser: Browser, url: string): Promise<string> {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  );
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
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

function parseArticleCards(
  $: cheerio.CheerioAPI,
  selector: string,
  baseUrl: string,
): ParsedArticle[] {
  const articles: ParsedArticle[] = [];

  $(selector).each((_, el) => {
    const item = $(el);
    const title = item.find("h2, h3, .title, .headline").first().text().trim();
    const snippet = item.find("p, .lead, .summary").first().text().trim();
    const href = item.find("a").first().attr("href");
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
    const strikeDates = extractDatesFromText(`${fullText} ${dateText}`);

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

// ─── Público ──────────────────────────────────────────────────────────────────

const PUBLICO_SEARCH = "https://www.publico.pt/pesquisa/greve";

/**
 * Scrapes Público's search results for "greve".
 */
export async function scrapePUBLICO(
  browser: Browser,
): Promise<ScrapedStrike[]> {
  logger.info("Scraping Público...", { url: PUBLICO_SEARCH });

  try {
    const html = await fetchPage(browser, PUBLICO_SEARCH);
    const $ = cheerio.load(html);
    const articles = parseArticleCards(
      $,
      "article, li.card, .search-results__item",
      "https://www.publico.pt",
    );
    const results = articlesToStrikes(articles, "publico");
    logger.info(`Público: found ${results.length} strike articles`);
    return results;
  } catch (err) {
    logger.error("Público scraping failed", { err: (err as Error).message });
    return [];
  }
}

// ─── Jornal de Notícias ───────────────────────────────────────────────────────

const JN_SEARCH = "https://www.jn.pt/pesquisa/?query=greve";

/**
 * Scrapes Jornal de Notícias search results for "greve".
 */
export async function scrapeJN(browser: Browser): Promise<ScrapedStrike[]> {
  logger.info("Scraping Jornal de Notícias...", { url: JN_SEARCH });

  try {
    const html = await fetchPage(browser, JN_SEARCH);
    const $ = cheerio.load(html);
    const articles = parseArticleCards(
      $,
      "article, .article-item, .search-item",
      "https://www.jn.pt",
    );
    const results = articlesToStrikes(articles, "jornalnoticias");
    logger.info(`JN: found ${results.length} strike articles`);
    return results;
  } catch (err) {
    logger.error("JN scraping failed", { err: (err as Error).message });
    return [];
  }
}
