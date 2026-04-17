export type Strike = {
  _id: string;
  title: string;
  description?: string;
  url: string;
  strikeDates: Date[];
  sector?: string;
  scrapedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
