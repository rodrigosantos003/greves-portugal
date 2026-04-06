import { Request, Response } from "express";
import { Strike } from "@/models/strike.model";
import logger from "@/libs/logger";

export const getStrikes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { from, to, confirmed, limit, skip, sort } = req.query as Record<
      string,
      string | undefined
    >;

    const q: Record<string, unknown> = {};

    if (confirmed !== undefined) {
      q.confirmed = confirmed === "true" || confirmed === "1";
    }

    if (from || to) {
      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      if (fromDate && Number.isNaN(fromDate.getTime())) {
        res.status(400).json({ error: "Invalid 'from' date" });
        return;
      }
      if (toDate && Number.isNaN(toDate.getTime())) {
        res.status(400).json({ error: "Invalid 'to' date" });
        return;
      }

      const range: Record<string, Date> = {};
      if (fromDate) range.$gte = fromDate;
      if (toDate) range.$lte = toDate;
      q.strikeDates = { $elemMatch: range };
    }

    const safeLimit = Math.min(Math.max(Number(limit ?? 100), 1), 500);
    const safeSkip = Math.max(Number(skip ?? 0), 0);
    const sortKey = sort === "oldest" ? 1 : -1; // default newest first

    const data = await Strike.find(q)
      .sort({ scrapedAt: sortKey })
      .skip(safeSkip)
      .limit(safeLimit)
      .lean();

    res.json({ count: data.length, data });
  } catch (err) {
    logger.error("GET /strikes failed", { err: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
};
