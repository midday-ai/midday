"use server";

import { action } from "@/actions/safe-action";
import { inboxFilterSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";

export const changeInboxFilterAction = action(
  inboxFilterSchema,
  async (status) => {
    cookies().set({
      name: Cookies.InboxFilter,
      value: status,
    });

    return status;
  }
);
