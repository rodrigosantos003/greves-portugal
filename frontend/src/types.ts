export type Strike = {
  _id: string;
  title: string;
  description?: string;
  url: string;
  strikeDates: Date[];
  sector?: string;
  workers?: string;
  confirmed: boolean;
  scrapedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
