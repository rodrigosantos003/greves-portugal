import dayjs from "dayjs";
import * as cheerio from "cheerio";
import { type ScrapedStrike } from "@/models/strike.model";
import {
  dateISOInLisbon,
  extractDatesFromText,
  keepTodayAndFutureDates,
  parsePtDate,
  todayISO,
} from "@/domain/date";

const STRIKE_KEYWORDS_PT = [
  "greve",
  "greves",
  "paralisação",
  "paralisações",
  "pré-aviso de greve",
] as const;

interface ParsedArticle {
  title: string;
  snippet: string;
  href: string;
  dateText: string;
}

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
  if (
    /\b(professor|escola|docente|ensino|educação|universidade|fenprof|s.t.o.p)\b/.test(
      t,
    )
  )
    return "Educação";
  if (/\b(lixo|resíduos|higiene urbana|municipal)\b/.test(t))
    return "Serviços Municipais";
  if (/\b(correios?|ctt\b|postal)\b/.test(t)) return "Correios";
  if (/\b(banco|financ|seguros?)\b/.test(t)) return "Banca e Finanças";
  if (/\b(avião|aeroporto|tap\b|ryanair|pilotos?)\b/.test(t)) return "Aviação";
  if (/\b(procuradores|mp|justiça)\b/.test(t)) return "Justiça";
  return "Outros";
}

function extractDateFromObservadorUrl(href: string): Date | null {
  const m = href.match(/\/(20\d{2})\/(\d{2})\/(\d{2})\//);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const candidate = new Date(y, mo - 1, d);
  if (
    candidate.getFullYear() !== y ||
    candidate.getMonth() !== mo - 1 ||
    candidate.getDate() !== d
  ) {
    return null;
  }
  return candidate;
}

function parseArticlePublishedDate(article: ParsedArticle): Date | null {
  return (
    extractDateFromObservadorUrl(article.href) ?? parsePtDate(article.dateText)
  );
}

function resolveArticleReferenceDate(article: ParsedArticle): Date {
  return parseArticlePublishedDate(article) ?? new Date();
}

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
    // ignore invalid URL
  }
  return raw;
}

function hasPastExplicitDmyDate(text: string): boolean {
  const monthStart = startOfCurrentMonthISO();
  const dmyPattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;

  for (const match of text.matchAll(dmyPattern)) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year)
    )
      continue;

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

export function parseObservadorCseResults(
  $: cheerio.CheerioAPI,
): ParsedArticle[] {
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
    if (hasPastExplicitDmyDate(`${title} ${snippet}`)) return;

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

export function filterCurrentOrFutureArticles(
  articles: ParsedArticle[],
): ParsedArticle[] {
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
    const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
    if (years.length === 0) return true;
    return years.every((y) => y >= currentYearInLisbon);
  });

  const todayCutoff = todayISO();
  const publishFiltered = yearFiltered.filter((a) => {
    const pub = parseArticlePublishedDate(a);
    if (!pub) return true;
    return dateISOInLisbon(pub) >= todayCutoff;
  });

  return publishFiltered.filter((a) => {
    const text = `${a.title} ${a.snippet} ${a.dateText}`;
    const articleReferenceDate = resolveArticleReferenceDate(a);
    const dates = extractDatesFromText(text, articleReferenceDate);
    if (dates.length === 0) return true;
    return dates.some((d) => dateISOInLisbon(d) >= todayCutoff);
  });
}

export function articlesToStrikes(articles: ParsedArticle[]): ScrapedStrike[] {
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
    };
  });
}
