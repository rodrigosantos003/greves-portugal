import { Strike, type IStrike, type ScrapedStrike } from "@/models/strike.model";
import dayjs from "dayjs";

export type StrikeComparableRecord = Pick<
  IStrike,
  "title" | "description" | "strikeDates" | "url"
>;

export async function findCurrentDayStrikes(
  startOfToday: Date,
  startOfTomorrow: Date,
): Promise<unknown[]> {
  return Strike.find({
    strikeDates: {
      $elemMatch: { $eq: startOfToday, $lt: startOfTomorrow },
    },
  }).lean();
}

export async function findFutureStrikes(
  startOfTomorrow: Date,
  startOfTwoWeeks: Date,
): Promise<unknown[]> {
  return Strike.find({
    strikeDates: {
      $elemMatch: { $gte: startOfTomorrow, $lt: startOfTwoWeeks },
    },
  }).lean();
}

export async function findPotentialDuplicatesByDateRange(
  entry: Pick<ScrapedStrike, "url" | "strikeDates">,
): Promise<StrikeComparableRecord[]> {
  const times = entry.strikeDates.map((d) => d.getTime());
  const padMs = 72 * 3600 * 1000;
  const tMin = Math.min(...times) - padMs;
  const tMax = Math.max(...times) + padMs;

  return Strike.find({
    url: { $ne: entry.url },
    strikeDates: {
      $elemMatch: { $gte: new Date(tMin), $lte: new Date(tMax) },
    },
  })
    .select({ title: 1, description: 1, strikeDates: 1, url: 1 })
    .lean()
    .limit(200);
}

export async function findCandidatesByStrikeDates(
  strikeDates: Date[],
): Promise<Array<Pick<IStrike, "_id" | "title" | "description" | "strikeDates" | "url">>> {
  const times = strikeDates.map((d) => d.getTime());
  const padMs = 72 * 3600 * 1000;
  const tMin = Math.min(...times) - padMs;
  const tMax = Math.max(...times) + padMs;

  return Strike.find({
    strikeDates: {
      $elemMatch: { $gte: new Date(tMin), $lte: new Date(tMax) },
    },
  })
    .select({ _id: 1, title: 1, description: 1, strikeDates: 1, url: 1 })
    .lean()
    .limit(200);
}

export async function deleteStrikesByIds(ids: IStrike["_id"][]): Promise<number> {
  const deleted = await Strike.deleteMany({ _id: { $in: ids } });
  return deleted.deletedCount ?? 0;
}

export async function upsertScrapedStrike(entry: ScrapedStrike): Promise<void> {
  await Strike.findOneAndUpdate(
    { url: entry.url },
    {
      $set: {
        title: entry.title.replace("Observador", "").trim(),
        description: entry.description,
        strikeDates: entry.strikeDates,
        sector: entry.sector,
        scrapedAt: dayjs().toDate(),
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

export async function findCgtpEntries(): Promise<IStrike[]> {
  return Strike.find({
    title: { $regex: "cgtp", $options: "i" },
  });
}

export async function replaceWithCanonicalCgtpTitle(entry: IStrike): Promise<void> {
  await Strike.deleteOne({ _id: entry._id });
  await Strike.create({
    url: entry.url,
    strikeDates: entry.strikeDates,
    sector: entry.sector,
    scrapedAt: dayjs().toDate(),
    title: "Greve da Função Pública (CGTP)",
    description: entry.description,
  });
}
