"use server";

import { action } from "@/actions/safe-action";
import { changeInboxFilterChema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export const changeInboxFilterAction = action(
  changeInboxFilterChema,
  async (status) => {
    const user = await getUser();

    cookies().set({
      name: Cookies.InboxFilter,
      value: status,
    });

    console.log(`inbox_${user?.data?.team_id}`);

    revalidateTag(`inbox_${user?.data?.team_id}`);

    return status;
  }
);
