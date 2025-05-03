"use server";

import { client } from "@midday/engine/client";
import { LogEvents } from "@midday/events/events";
import { getCountryCode } from "@midday/location";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const createEnableBankingLinkAction = authActionClient
  .schema(
    z.object({
      institutionId: z.string(),
      maximumConsentValidity: z.number(),
      country: z.string().optional().nullable(),
      isDesktop: z.boolean(),
      type: z.enum(["personal", "business"]),
    }),
  )
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
        isDesktop,
        type,
      },
      ctx: { analytics, user },
    }) => {
      analytics.track({
        event: LogEvents.EnableBankingLinkCreated.name,
        institutionId,
        step,
        isDesktop,
      });

      const country = countryCode ?? (await getCountryCode());

      try {
        const linkResponse = await client.auth.enablebanking.link.$post({
          json: {
            institutionId,
            country,
            type,
            teamId: user.team_id,
            validUntil: new Date(Date.now() + maximumConsentValidity * 1000)
              .toISOString()
              .replace(/\.\d+Z$/, ".000000+00:00"),
            state: isDesktop ? "desktop:connect" : "web:connect",
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
