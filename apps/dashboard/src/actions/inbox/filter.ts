"use server";

import { action } from "@/actions/safe-action";
import { changeInboxFilterSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export const changeInboxFilterAction = action(
  changeInboxFilterSchema,
  async (status) => {
    const user = await getUser();

    cookies().set({
      name: Cookies.InboxFilter,
      value: status,
    });

    revalidateTag(`inbox_${user?.data?.team_id}`);

    return status;
  }
);
