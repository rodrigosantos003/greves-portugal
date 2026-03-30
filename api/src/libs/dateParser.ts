type PtMonthMap = Record<string, number>;

const PT_MONTHS: PtMonthMap = {
  janeiro: 0,  fevereiro: 1, março: 2,    abril: 3,
  maio: 4,     junho: 5,     julho: 6,    agosto: 7,
  setembro: 8, outubro: 9,   novembro: 10, dezembro: 11,
  // Abbreviations
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

/**
 * Try to parse a Portuguese date string into a JS Date.
 * Handles formats:
 *   "12 de março de 2026"
 *   "12/03/2026"
 *   "2026-03-12"
 */
export function parsePtDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();

  // ISO format: 2026-03-12
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s);
  }

  // DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  }

  // "12 de março de 2026" or "12 março 2026"
  const ptMatch = s.match(/(\d{1,2})\s+(?:de\s+)?([a-záéíóúâêôãõç]+)\s+(?:de\s+)?(\d{4})/);
  if (ptMatch) {
    const month = PT_MONTHS[ptMatch[2]];
    if (month !== undefined) {
      return new Date(Number(ptMatch[3]), month, Number(ptMatch[1]));
    }
  }

  return null;
}

/**
 * Extract all dates mentioned in a block of text.
 * Returns an array of Date objects, deduplicated by calendar day.
 */
export function extractDatesFromText(text: string): Date[] {
  const found = new Map<string, Date>();

  // Pattern: "12 de março de 2026"
  const ptPattern = /\b(\d{1,2})\s+de\s+([a-záéíóúâêôãõç]+)\s+de\s+(\d{4})\b/gi;
  let m: RegExpExecArray | null;

  while ((m = ptPattern.exec(text)) !== null) {
    const d = parsePtDate(`${m[1]} de ${m[2]} de ${m[3]}`);
    if (d) found.set(d.toDateString(), d);
  }

  // Pattern: DD/MM/YYYY
  const dmyPattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  while ((m = dmyPattern.exec(text)) !== null) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!isNaN(d.getTime())) found.set(d.toDateString(), d);
  }

  return [...found.values()];
}

/**
 * Returns true if the given date falls on today (ignoring time).
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Returns a YYYY-MM-DD string for today in the Lisbon timezone.
 */
export function todayISO(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' });
}
