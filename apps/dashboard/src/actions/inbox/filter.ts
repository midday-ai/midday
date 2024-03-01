"use server";

import { action } from "@/actions/safe-action";
import { changeInboxFilterSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";

export const changeInboxFilterAction = action(
  changeInboxFilterSchema,
  async (status) => {
    const user = await getUser();

    cookies().set({
      name: Cookies.InboxFilter,
      value: status,
    });

    return status;
  }
);
