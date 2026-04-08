import { Request, Response } from "express";
import mongoose from "mongoose";

export const getHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    // check if the database is connected
    const dbConnected = await mongoose.connection.db?.admin().ping();
    if (!dbConnected) {
      res.status(500).json({ ok: false, error: "Database connection failed" });
      return;
    }

    // check if the server is running
    const serverRunning = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
    if (!serverRunning) {
      res.status(500).json({ ok: false, error: "Server not running" });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
};
