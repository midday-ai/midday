"use server";

import { engineClient } from "@midday/engine-client";
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
        maximumConsentValidity,
        country: countryCode,
        isDesktop,
        type,
      },
      ctx: { analytics, teamId },
    }) => {
      analytics.track({
        event: LogEvents.EnableBankingLinkCreated.name,
        institutionId,
        isDesktop,
      });

      const country = countryCode ?? (await getCountryCode());

      try {
        const linkResponse = await engineClient.auth.enablebanking.link.$post({
          json: {
            institutionId,
            country,
            type,
            teamId: teamId!,
            validUntil: new Date(Date.now() + maximumConsentValidity * 1000)
              .toISOString()
              .replace(/\.\d+Z$/, ".000000+00:00"),
            state: isDesktop ? "desktop:connect" : "web:connect",
          },
        });

        if (!linkResponse.ok) {
          throw new Error("Failed to create link");
        }

        const { data: linkData } = await linkResponse.json();

        return redirect(linkData.url);
      } catch (error) {
        // Ignore NEXT_REDIRECT error in analytics
        if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
          analytics.track({
            event: LogEvents.EnableBankingLinkFailed.name,
            institutionId,
          });

          throw error;
        }

        throw error;
      }
    },
  );
