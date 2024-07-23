"use server";

import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { changeChartPeriodSchema } from "./schema";

export const changeChartPeriodAction = authActionClient
  .schema(changeChartPeriodSchema)
  .metadata({
    name: "change-chart-period",
  })
  .action(async ({ parsedInput: value, ctx: { user } }) => {
    revalidateTag(`chart_${user.team_id}`);

    return value;
  });
