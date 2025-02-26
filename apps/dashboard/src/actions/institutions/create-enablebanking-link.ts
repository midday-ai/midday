"use server";

import { client } from "@midday/engine/client";
import { LogEvents } from "@midday/events/events";
import { getCountryCode } from "@midday/location";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { redirect } from "next/navigation";
import { authActionClient } from "../safe-action";
import { createEnableBankingLinkSchema } from "../schema";

export const createEnableBankingLinkAction = authActionClient
  .schema(createEnableBankingLinkSchema)
  .metadata({
    name: "create-enablebanking-link",
  })
  .action(
    async ({
      parsedInput: {
        institutionId,
        step = "account",
        maximumConsentValidity,
        country: countryCode,
        type,
      },
      ctx: { analytics, user },
    }) => {
      analytics.track({
        event: LogEvents.EnableBankingLinkCreated.name,
        institutionId,
        step,
      });

      const country = countryCode ?? getCountryCode();

      try {
        const linkResponse = await client.auth.enablebanking.link.$post({
          json: {
            institutionId,
            country,
            teamId: user.team_id,
            validUntil: new Date(Date.now() + maximumConsentValidity * 1000)
              .toISOString()
              .replace(/\.\d+Z$/, ".000000+00:00"),
            // NOTE: This is so we can track the type of link we are creating
            // and redirect the user to the correct page
            state: isDesktopApp() ? `desktop:${type}` : `web:${type}`,
          },
        });

        const { data: linkData } = await linkResponse.json();

        return redirect(linkData.url);
      } catch (error) {
        // Ignore NEXT_REDIRECT error in analytics
        if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
          analytics.track({
            event: LogEvents.EnableBankingLinkFailed.name,
            institutionId,
            step,
          });

          throw error;
        }

        throw error;
      }
    },
  );
