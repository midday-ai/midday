"use server";

import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { updaterMenuSchema } from "./schema";

export const updateMenuAction = action(updaterMenuSchema, async (value) => {
  cookies().set({
    name: Cookies.MenuConfig,
    value: JSON.stringify(value),
  });

  return value;
});
