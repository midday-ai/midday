"use server";

import { client } from "@midday/engine/client";
import { LogEvents } from "@midday/events/events";
import { redirect } from "next/navigation";
import { authActionClient } from "../safe-action";
import { reconnectEnableBankingLinkSchema } from "../schema";

export const reconnectEnableBankingLinkAction = authActionClient
  .schema(reconnectEnableBankingLinkSchema)
  .metadata({
    name: "reconnect-enablebanking-link",
  })
  .action(
    async ({
      parsedInput: { institutionId, isDesktop },
      ctx: { analytics, user },
    }) => {
      analytics.track({
        event: LogEvents.EnableBankingLinkReconnected.name,
        institutionId,
        isDesktop,
      });

      const institutionResponse = await client.institutions[":id"].$get({
        param: {
          id: institutionId,
        },
      });

      const { maximum_consent_validity, country, name } =
        await institutionResponse.json();

      try {
        const linkResponse = await client.auth.enablebanking.link.$post({
          json: {
            institutionId: name,
            country,
            teamId: user.team_id,
            validUntil: new Date(Date.now() + maximum_consent_validity * 1000)
              .toISOString()
              .replace(/\.\d+Z$/, ".000000+00:00"),
            state: isDesktop ? "desktop:reconnect" : "web:reconnect",
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
          });

          throw error;
        }

        throw error;
      }
    },
  );
