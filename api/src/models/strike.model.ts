import mongoose, { Document, Model, Schema } from "mongoose";

export type StrikeSource = "publico" | "jornalnoticias" | "observador" | "lusa";

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

export interface IStrike extends Document {
  title: string;
  description?: string;
  source: StrikeSource;
  url: string;
  strikeDates: Date[];
  sector?: string;
  workers?: string;
  confirmed: boolean;
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
    source: {
      type: String,
      required: true,
      enum: [
        "publico",
        "jornalnoticias",
        "observador",
        "lusa",
      ] satisfies StrikeSource[],
    },
    url: {
      type: String,
      required: true,
    },
    strikeDates: {
      type: [Date],
      required: true,
      index: true,
    },
    sector: {
      type: String,
      trim: true,
    },
    workers: {
      type: String,
      trim: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
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

// Fast lookup by date range + confirmation status
strikeSchema.index({ strikeDates: 1, confirmed: 1 });

export const Strike: Model<IStrike> = mongoose.model<IStrike>(
  "Strike",
  strikeSchema,
);

export default Strike;
