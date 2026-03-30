import mongoose from "mongoose";
import logger from "./logger";

export async function connectDB(): Promise<void> {
  const uri =
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/portugal_strikes";

  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err: Error) =>
    logger.error("MongoDB error", { err }),
  );
  mongoose.connection.on("disconnected", () =>
    logger.warn("MongoDB disconnected"),
  );

  await mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
}
