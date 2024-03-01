"use server";

import { action } from "@/actions/safe-action";
import { changeInboxFilterSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";

import { cookies } from "next/headers";

export const changeInboxFilterAction = action(
  changeInboxFilterSchema,
  async (status) => {
    cookies().set({
      name: Cookies.InboxFilter,
      value: status,
    });

    return status;
  }
);
