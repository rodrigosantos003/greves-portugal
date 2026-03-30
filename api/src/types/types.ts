export type StrikeSource = 'dgert' | 'publico' | 'jornalnoticias' | 'observador' | 'lusa';

export interface ScrapedStrike {
  title: string;
  description: string;
  source: StrikeSource;
  url: string;
  strikeDates: Date[];
  sector: string;
  workers: string | null;
  confirmed: boolean;
}

export interface ScrapeSummary {
  durationSeconds: string;
  total: number;
  withDates: number;
  upserted: number;
  errors: number;
}
