"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { authActionClient } from "./safe-action";
import { changeChartCurrencySchema } from "./schema";

export const changeChartCurrencyAction = authActionClient
  .schema(changeChartCurrencySchema)
  .metadata({
    name: "change-chart-currency",
  })
  .action(async ({ parsedInput: value, ctx: { user } }) => {
    cookies().set({
      name: Cookies.ChartCurrency,
      value,
      expires: addYears(new Date(), 1),
    });

    revalidateTag(`metrics_${user.team_id}`);
    revalidateTag(`current_burn_rate_${user.team_id}`);
    revalidateTag(`burn_rate_${user.team_id}`);

    return value;
  });
