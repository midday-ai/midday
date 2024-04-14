"use server";

import { action } from "@/actions/safe-action";
import { inboxFilter } from "@/actions/schema";
import { Cookies } from "@/utils/constants";

import { cookies } from "next/headers";

export const changeInboxFilterAction = action(inboxFilter, async (status) => {
  cookies().set({
    name: Cookies.InboxFilter,
    value: status,
  });

  return status;
});
