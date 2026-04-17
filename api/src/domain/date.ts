type PtMonthMap = Record<string, number>;

const PT_MONTHS: PtMonthMap = {
  janeiro: 0, fevereiro: 1, março: 2, abril: 3,
  maio: 4, junho: 5, julho: 6, agosto: 7,
  setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  // Abbreviations
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

export function parsePtDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  const compact = s.replace(/\s+/g, " ");

  const getLisbonYMD = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = Number(parts.find((p) => p.type === "year")?.value);
    const m = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    return { y, m, day };
  };

  const addLisbonDays = (base: Date, deltaDays: number): Date => {
    const { y, m, day } = getLisbonYMD(base);
    return new Date(Date.UTC(y, m - 1, day + deltaDays, 12, 0, 0));
  };

  if (/\bhoje\b/.test(compact)) return addLisbonDays(new Date(), 0);
  if (/\bontem\b/.test(compact)) return addLisbonDays(new Date(), -1);
  if (/\banteontem\b/.test(compact)) return addLisbonDays(new Date(), -2);

  const relativeMatch = compact.match(
    /\bh[aá]\s+(\d+)\s+(dia|dias|hora|horas|minuto|minutos)\b/i,
  );
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    if (!Number.isFinite(amount)) return null;
    if (unit.startsWith("dia")) return addLisbonDays(new Date(), -amount);
    if (unit.startsWith("hora") || unit.startsWith("minuto")) {
      return addLisbonDays(new Date(), 0);
    }
  }

  if (/^\d{4}-\d{2}-\d{2}(?:t.*)?$/.test(compact)) {
    const d = new Date(compact);
    return isNaN(d.getTime()) ? null : d;
  }

  const dmyMatch = compact.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  }

  const ptMatch = compact.match(
    /(\d{1,2})\s+(?:de\s+)?([a-záéíóúâêôãõç]+)\s+(?:de\s+)?(\d{4})/,
  );
  if (ptMatch) {
    const month = PT_MONTHS[ptMatch[2]];
    if (month !== undefined) {
      return new Date(Number(ptMatch[3]), month, Number(ptMatch[1]));
    }
  }

  return null;
}

export function extractDatesFromText(text: string, referenceDate: Date = new Date()): Date[] {
  const found = new Map<string, Date>();

  const keyInLisbon = (d: Date) =>
    d.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

  const referenceYearInLisbon = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
    }).format(referenceDate),
  );
  const referenceMonthInLisbon = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      month: "2-digit",
    }).format(referenceDate),
  );

  const inferYearForNoYearDate = (month1to12: number): number => {
    if (referenceMonthInLisbon >= 11 && month1to12 <= 2) {
      return referenceYearInLisbon + 1;
    }
    return referenceYearInLisbon;
  };

  const ptPattern = /\b(\d{1,2})\s+de\s+([a-záéíóúâêôãõç]+)\s+de\s+(\d{4})\b/gi;
  let m: RegExpExecArray | null;

  while ((m = ptPattern.exec(text)) !== null) {
    const d = parsePtDate(`${m[1]} de ${m[2]} de ${m[3]}`);
    if (d) found.set(keyInLisbon(d), d);
  }

  const dmyPattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  while ((m = dmyPattern.exec(text)) !== null) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!isNaN(d.getTime())) found.set(keyInLisbon(d), d);
  }

  const dmPattern = /\b(\d{1,2})\/(\d{1,2})\b/g;
  while ((m = dmPattern.exec(text)) !== null) {
    const month = Number(m[2]);
    const inferredYear = inferYearForNoYearDate(month);
    const d = new Date(inferredYear, month - 1, Number(m[1]));
    if (!isNaN(d.getTime())) found.set(keyInLisbon(d), d);
  }

  const ptNoYearPattern =
    /\b(\d{1,2})\s+(?:de\s+)?([a-záéíóúâêôãõç]+)\b/gi;
  while ((m = ptNoYearPattern.exec(text)) !== null) {
    const monthKey = (m[2] ?? "").toLowerCase();
    const month = PT_MONTHS[monthKey];
    const inferredYear =
      month === undefined
        ? referenceYearInLisbon
        : inferYearForNoYearDate(month + 1);
    const d = parsePtDate(`${m[1]} ${m[2]} ${inferredYear}`);
    if (d) found.set(keyInLisbon(d), d);
  }

  const isoPattern = /\b(\d{4}-\d{2}-\d{2})(?:t[0-9:.+-z]+)?\b/gi;
  while ((m = isoPattern.exec(text)) !== null) {
    const d = parsePtDate(m[0]);
    if (d) found.set(keyInLisbon(d), d);
  }

  const ymdSlashPattern = /\b(\d{4})\/(\d{2})\/(\d{2})\b/g;
  while ((m = ymdSlashPattern.exec(text)) !== null) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d.getTime())) found.set(keyInLisbon(d), d);
  }

  const WEEKDAY_TO_JS_DAY: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    "segunda-feira": 1,
    terca: 2,
    "terça": 2,
    "terca-feira": 2,
    "terça-feira": 2,
    quarta: 3,
    "quarta-feira": 3,
    quinta: 4,
    "quinta-feira": 4,
    sexta: 5,
    "sexta-feira": 5,
    sabado: 6,
    "sábado": 6,
    "sabado-feira": 6,
    "sábado-feira": 6,
  };

  const getLisbonYMD = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = Number(parts.find((p) => p.type === "year")?.value);
    const m = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    return { y, m, day };
  };

  const addDaysUTCNoonFromLisbonYMD = (
    y: number,
    m: number,
    day: number,
    addDays: number,
  ) => new Date(Date.UTC(y, m - 1, day + addDays, 12, 0, 0));

  const { y: refY, m: refM, day: refD } = getLisbonYMD(referenceDate);
  const refAtNoonUTC = new Date(Date.UTC(refY, refM - 1, refD, 12, 0, 0));
  const refDow = refAtNoonUTC.getUTCDay();

  const weekdayPattern =
    /\b(?:(esta|nesta|neste|na|no)\s+)?(?:(próxim[oa]|proxim[oa])\s+)?(segunda|ter[cç]a|quarta|quinta|sexta|s[áa]bado|domingo)(?:-?\s*feira)?\b/gi;

  while ((m = weekdayPattern.exec(text)) !== null) {
    const esta = (m[1] ?? "").toLowerCase();
    const proxima = (m[2] ?? "").toLowerCase();
    const wdRaw = (m[3] ?? "").toLowerCase();

    const normalizedWd =
      wdRaw
        .replace("ç", "c")
        .replace("á", "a")
        .replace("ã", "a")
        .replace("â", "a")
        .replace("é", "e")
        .replace("ê", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ô", "o")
        .replace("õ", "o")
        .replace("ú", "u") || wdRaw;

    const targetDow =
      WEEKDAY_TO_JS_DAY[wdRaw] ??
      WEEKDAY_TO_JS_DAY[`${wdRaw}-feira`] ??
      WEEKDAY_TO_JS_DAY[normalizedWd] ??
      WEEKDAY_TO_JS_DAY[`${normalizedWd}-feira`];
    if (targetDow === undefined) continue;

    let delta = (targetDow - refDow + 7) % 7;
    if (proxima) {
      if (delta === 0) delta = 7;
    } else if (esta) {
      // allows today
    }

    const d = addDaysUTCNoonFromLisbonYMD(refY, refM, refD, delta);
    found.set(keyInLisbon(d), d);
  }

  return [...found.values()];
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export function dateISOInLisbon(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export function keepTodayAndFutureDates(dates: Date[]): Date[] {
  const cutoff = todayISO();
  return dates
    .filter((d) => dateISOInLisbon(d) >= cutoff)
    .sort((a, b) => a.getTime() - b.getTime());
}
