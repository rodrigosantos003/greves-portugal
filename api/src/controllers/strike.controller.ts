import { Request, Response } from "express";
import logger from "@/libs/logger";
import {
  getCurrentDayStrikesData,
  getFutureStrikesData,
} from "@/services/strikeQuery.service";

export const getCurrentDayStrikes = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = await getCurrentDayStrikesData();
    res.json({ strikes: data });
  } catch (err) {
    logger.error("GET /strikes failed", { err: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFutureStrikes = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = await getFutureStrikesData();
    res.json({ strikes: data });
  } catch (err) {
    logger.error("GET /strikes/future failed", { err: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
};
