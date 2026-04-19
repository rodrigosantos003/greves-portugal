import mongoose from "mongoose";
import logger from "./logger";

export async function connectDB(): Promise<void> {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}`;

  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err: Error) =>
    logger.error("MongoDB error", { err }),
  );
  mongoose.connection.on("disconnected", () =>
    logger.warn("MongoDB disconnected"),
  );

  await mongoose.connect(uri, { dbName: process.env.DB_NAME ?? "test" });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
}
