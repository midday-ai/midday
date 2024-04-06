"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { trackingConsentSchema } from "./schema";

export const trackingConsentAction = action(
  trackingConsentSchema,
  async (value) => {
    cookies().set({
      name: Cookies.TrackingConsent,
      value: value ? "1" : "0",
      expires: addYears(new Date(), 1),
    });

    return value;
  }
);
