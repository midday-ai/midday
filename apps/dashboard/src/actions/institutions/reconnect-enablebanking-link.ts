"use server";

import { engineClient } from "@midday/engine-client";
import { LogEvents } from "@midday/events/events";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const reconnectEnableBankingLinkAction = authActionClient
  .schema(
    z.object({
      institutionId: z.string(),
      isDesktop: z.boolean(),
      sessionId: z.string(),
    }),
  )
  .metadata({
    name: "reconnect-enablebanking-link",
  })
  .action(
    async ({
      parsedInput: { institutionId, isDesktop, sessionId },
      ctx: { analytics, teamId },
    }) => {
      analytics.track({
        event: LogEvents.EnableBankingLinkReconnected.name,
        institutionId,
        isDesktop,
      });

      const institutionResponse = await engineClient.institutions[":id"].$get({
        param: {
          id: institutionId,
        },
      });

      if (!institutionResponse.ok) {
        throw new Error("Failed to get institution");
      }

      const { maximum_consent_validity, country, name, type } =
        await institutionResponse.json();

      try {
        const linkResponse = await engineClient.auth.enablebanking.link.$post({
          json: {
            institutionId: name,
            country,
            teamId: teamId!,
            type,
            validUntil: new Date(Date.now() + maximum_consent_validity * 1000)
              .toISOString()
              .replace(/\.\d+Z$/, ".000000+00:00"),
            state: isDesktop
              ? `desktop:reconnect:${sessionId}`
              : `web:reconnect:${sessionId}`,
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
