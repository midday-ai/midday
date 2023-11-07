"use server";

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
      name: "chart-type",
      value,
    });

    revalidateTag(`chart-${user.data.team_id}`);

    return value;
  },
);
