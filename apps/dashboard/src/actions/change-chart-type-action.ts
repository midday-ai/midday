"use server";

import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { changeChartTypeSchema } from "./schema";

export const changeChartTypeAction = action(
  changeChartTypeSchema,
  async (value) => {
    const user = await getUser();

    cookies().set({
      name: Cookies.ChartType,
      value,
    });

    revalidateTag(`chart_${user.data.team_id}`);

    return value;
  }
);
