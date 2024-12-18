"use server";

import { addMonths, addWeeks, isAfter, isBefore, isToday } from "date-fns";
import { getChats } from "../storage";
import type { Chat } from "../types";

export async function getChatsAction() {
  const data = await getChats();

  if (!data.length) {
    return [];
  }

  const base: { "1d": Chat[]; "7d": Chat[]; "30d": Chat[] } = {
    "1d": [],
    "7d": [],
    "30d": [],
  };

  const now = new Date();
  const oneWeekAgo = addWeeks(now, -1);
  const oneMonthAgo = addMonths(now, -1);

  for (const obj of data) {
    const currentDate = new Date(obj.createdAt);

    if (isToday(currentDate)) {
      base["1d"].push(obj);
    }

    if (
      isBefore(currentDate, now) &&
      isAfter(currentDate, oneWeekAgo)
    ) {
      base["7d"].push(obj);
    }

    if (
      isBefore(currentDate, oneWeekAgo) &&
      isAfter(currentDate, oneMonthAgo)
    ) {
      base["30d"].push(obj);
    }
  }

  return base;
}
