"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { changeChartPeriodSchema } from "./schema";

export const changeChartPeriodAction = action(
  changeChartPeriodSchema,
  async (value) => {
    const user = await getUser();

    revalidateTag(`chart_${user.data.team_id}`);

    return value;
  }
);
