import { Request, Response } from "express";

export const getHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.json({ ok: true });
};
