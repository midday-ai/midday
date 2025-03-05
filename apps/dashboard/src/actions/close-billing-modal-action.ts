"use server";

import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const closeBillingModalAction = actionClient
  .schema(z.void())
  .metadata({
    name: "close-billing-modal",
  })
  .action(async () => {
    cookies().set(Cookies.UpgradeModalShown, "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  });
