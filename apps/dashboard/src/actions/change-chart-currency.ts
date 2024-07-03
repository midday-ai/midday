"use server";

import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { addYears } from "date-fns";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { changeChartCurrencySchema } from "./schema";

export const changeChartCurrencyAction = action(
  changeChartCurrencySchema,
  async (value) => {
    const user = await getUser();

    cookies().set({
      name: Cookies.ChartCurrency,
      value,
      expires: addYears(new Date(), 1),
    });

    revalidateTag(`metrics_${user.data.team_id}`);
    revalidateTag(`current_burn_rate_${user.data.team_id}`);
    revalidateTag(`burn_rate_${user.data.team_id}`);

    return value;
  }
);
