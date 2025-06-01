"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const setWeeklyCalendarAction = actionClient
  .schema(z.boolean())
  .action(async ({ parsedInput: value }) => {
    (await cookies()).set({
      name: Cookies.WeeklyCalendar,
      value: value ? "true" : "false",
      expires: addYears(new Date(), 1),
    });

    return value;
  });
