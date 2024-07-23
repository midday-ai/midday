"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { authActionClient } from "./safe-action";
import { trackingConsentSchema } from "./schema";

export const trackingConsentAction = authActionClient
  .schema(trackingConsentSchema)
  .metadata({
    name: "tracking-consent",
  })
  .action(async ({ parsedInput: value }) => {
    cookies().set({
      name: Cookies.TrackingConsent,
      value: value ? "1" : "0",
      expires: addYears(new Date(), 1),
    });

    return value;
  });
