import { Request, Response } from "express";
import { Strike } from "@/models/strike.model";
import logger from "@/libs/logger";
import dayjs from "dayjs";

export const getCurrentDayStrikes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const startOfToday = dayjs().startOf("day").toDate();
    const startOfTomorrow = dayjs(startOfToday).add(1, "day").toDate();

    const data = await Strike.find({
      strikeDates: {
        $elemMatch: { $gte: startOfToday, $lt: startOfTomorrow },
      },
    }).lean();

    if (data.length === 0) {
      res.json({ strikes: [] });
      return;
    }

    res.json({ strikes: data });
  } catch (err) {
    logger.error("GET /strikes failed", { err: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFutureStrikes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const startOfToday = dayjs().startOf("day").toDate();
    const startOfTomorrow = dayjs(startOfToday).add(1, "day").toDate();

    const data = await Strike.find({
      strikeDates: {
        $elemMatch: { $gte: startOfToday, $lt: startOfTomorrow },
      },
    }).lean();

    res.json({ strikes: data });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
