import type { ScrapedStrike } from "@/models/strike.model";
import { Strike, type IStrike } from "@/models/strike.model";
import { dateISOInLisbon } from "./dateParser.controller";

/** Words that appear in almost every strike headline — ignore for overlap. */
const STRIKE_BOILERPLATE = new Set([
  "greve",
  "greves",
  "paralisacao",
  "paralisacoes",
  "preaviso",
  "preavisos",
  "aviso",
]);

const PT_STOPWORDS = new Set([
  "com",
  "para",
  "por",
  "uma",
  "uns",
  "num",
  "numa",
  "dos",
  "das",
  "nos",
  "nas",
  "que",
  "mais",
  "muito",
  "sobre",
  "entre",
  "apos",
  "depois",
  "ante",
  "como",
  "quando",
  "onde",
  "este",
  "esta",
  "isto",
  "esse",
  "essa",
  "aquele",
  "aquela",
  "seu",
  "sua",
  "seus",
  "suas",
  "pelo",
  "pela",
  "pelos",
  "pelas",
  "aos",
  "sao",
  "foi",
  "ser",
  "tem",
  "ja",
  "nao",
  "há",
  "ha",
  "dia",
  "dias",
  "ano",
  "anos",
  "hora",
  "horas",
  "hoje",
  "amanha",
  "amanhã",
]);

/**
 * Temporal wording often changes between headlines describing the same strike.
 * We ignore these to focus similarity on operator/sector/location words.
 */
const TITLE_TEMPORAL_WORDS = new Set([
  "segunda",
  "terca",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "sábado",
  "domingo",
  "feira",
  "mes",
  "mês",
  "semana",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
  "janeiro",
  "fevereiro",
  "marco",
  "março",
  "proxima",
  "próxima",
  "proximo",
  "próximo",
  "esta",
  "este",
]);

/** Short sector / org codes that still identify the same strike when dates match. */
const ENTITY_SHORT_CODES = new Set(["cp", "tap", "ctt", "sns", "metro"]);

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function normalizeToken(raw: string): string {
  return stripDiacritics(raw.toLowerCase()).replace(/[^a-z0-9]/g, "");
}

/** Meaningful tokens extracted from a title for similarity matching. */
export function extractTitleWords(text: string): Set<string> {
  const normalized = stripDiacritics(text.toLowerCase());
  const words = normalized.match(/[a-záéíóúâêôãõç0-9]+/gi) ?? [];
  const out = new Set<string>();
  for (const w of words) {
    const t = normalizeToken(w);
    if (t.length < 2) continue;
    if (/^\d+[a-z]*$/i.test(t)) continue;
    if (STRIKE_BOILERPLATE.has(t)) continue;
    if (PT_STOPWORDS.has(t)) continue;
    if (TITLE_TEMPORAL_WORDS.has(t)) continue;
    out.add(t);
  }
  return out;
}

function strikeTitle(s: Pick<ScrapedStrike, "title">): string {
  return s.title;
}

/**
 * Similarity by meaningful title words.
 * Uses overlap ratio against the smaller set to handle short/long title variants.
 */
export function titleWordSetsSimilar(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  let interCount = 0;
  const interWords: string[] = [];
  for (const x of a) {
    if (b.has(x)) {
      interCount++;
      interWords.push(x);
    }
  }
  if (interCount === 0) return false;

  const minSize = Math.min(a.size, b.size);
  const overlapRatio = interCount / minSize;
  if (overlapRatio >= 0.6) return true;

  // Fallback for tiny titles, e.g. "Greve CP hoje" vs "CP em greve hoje".
  if (interCount >= 2 && minSize <= 3) return true;

  if (interCount === 1) {
    const [one] = interWords;
    if (one.length >= 5) return true;
    if (ENTITY_SHORT_CODES.has(one)) return true;
  }
  return false;
}

export function strikeDatesOverlapLisbon(a: Date[], b: Date[]): boolean {
  const ka = new Set(a.map(dateISOInLisbon));
  const kb = new Set(b.map(dateISOInLisbon));
  for (const x of ka) {
    if (kb.has(x)) return true;
  }
  return false;
}

export function isSameStrikeNews(
  a: Pick<ScrapedStrike, "title" | "description" | "strikeDates">,
  b: Pick<ScrapedStrike, "title" | "description" | "strikeDates">,
): boolean {
  if (!strikeDatesOverlapLisbon(a.strikeDates, b.strikeDates)) return false;
  const ta = extractTitleWords(strikeTitle(a));
  const tb = extractTitleWords(strikeTitle(b));
  return titleWordSetsSimilar(ta, tb);
}

/**
 * Drops later items that describe the same strike as an earlier one (search result order preserved).
 */
export function dedupeScrapedStrikes(
  strikes: ScrapedStrike[],
): ScrapedStrike[] {
  const kept: ScrapedStrike[] = [];
  for (const s of strikes) {
    const dup = kept.some((k) => isSameStrikeNews(s, k));
    if (!dup) kept.push(s);
  }
  return kept;
}

function docToComparable(
  doc: Pick<IStrike, "title" | "description" | "strikeDates">,
): Pick<ScrapedStrike, "title" | "description" | "strikeDates"> {
  return {
    title: doc.title,
    description: doc.description ?? "",
    strikeDates: doc.strikeDates,
  };
}

/**
 * Returns true if another strike already exists (different URL) for the same dates + similar title words.
 */
export async function hasDuplicateInDatabase(
  entry: ScrapedStrike,
): Promise<boolean> {
  if (entry.strikeDates.length === 0) return false;
  const times = entry.strikeDates.map((d) => d.getTime());
  const padMs = 72 * 3600 * 1000;
  const tMin = Math.min(...times) - padMs;
  const tMax = Math.max(...times) + padMs;

  const candidates = await Strike.find({
    url: { $ne: entry.url },
    strikeDates: {
      $elemMatch: { $gte: new Date(tMin), $lte: new Date(tMax) },
    },
  })
    .select({ title: 1, description: 1, strikeDates: 1, url: 1 })
    .lean()
    .limit(200);

  const e = entry;
  for (const c of candidates) {
    if (isSameStrikeNews(e, docToComparable(c))) return true;
  }
  return false;
}
