import dayjs from "dayjs";
import {
  findCurrentDayStrikes,
  findFutureStrikes,
} from "@/infra/repositories/strike.repository";

export async function getCurrentDayStrikesData(): Promise<unknown[]> {
  const startOfToday = dayjs().startOf("day").toDate();
  const startOfTomorrow = dayjs(startOfToday).add(1, "day").toDate();
  return findCurrentDayStrikes(startOfToday, startOfTomorrow);
}

export async function getFutureStrikesData(): Promise<unknown[]> {
  const startOfTomorrow = dayjs().startOf("day").add(1, "day").toDate();
  const startOfTwoWeeks = dayjs(startOfTomorrow).add(2, "week").toDate();
  return findFutureStrikes(startOfTomorrow, startOfTwoWeeks);
}
