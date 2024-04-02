"use server";

import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { closeMobileOverlaySchema } from "./schema";

export const closeMobileOverlayAction = action(
  closeMobileOverlaySchema,
  async ({ value }) => {
    cookies().set({
      name: Cookies.MobileOverlay,
      value: value.toString(),
    });
  }
);
