import mongoose, { Document, Model, Schema } from "mongoose";

export interface ScrapedStrike {
  title: string;
  description: string;
  url: string;
  strikeDates: Date[];
  sector: string;
}

export interface ScrapeSummary {
  durationSeconds: string;
  total: number;
  withDates: number;
  /** Extra articles in search results merged as same strike (dates + keywords) */
  searchDuplicatesSkipped: number;
  upserted: number;
  /** Not inserted: same strike already stored under a different URL */
  databaseDuplicatesSkipped: number;
  errors: number;
}

export interface IStrike extends Document {
  title: string;
  description?: string;
  url: string;
  strikeDates: Date[];
  sector?: string;
  scrapedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const strikeSchema = new Schema<IStrike>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    strikeDates: {
      type: [Date],
      required: true,
    },
    sector: {
      type: String,
      trim: true,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate entries for the same URL
strikeSchema.index({ url: 1 }, { unique: true });

// Fast lookup by date range
strikeSchema.index({ strikeDates: 1 });

export const Strike: Model<IStrike> = mongoose.model<IStrike>(
  "Strike",
  strikeSchema,
);

export default Strike;
