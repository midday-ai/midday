"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { changeSpendingPeriodSchema } from "./schema";

export const changeSpendingPeriodAction = action(
  changeSpendingPeriodSchema,
  async (params) => {
    const user = await getUser();

    cookies().set({
      name: "spending-period",
      value: JSON.stringify(params),
    });

    revalidateTag(`spending-${user.data.team_id}`);

    return params;
  },
);
