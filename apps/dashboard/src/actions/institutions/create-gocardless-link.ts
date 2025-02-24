"use server";

import { client } from "@midday/engine/client";
import { LogEvents } from "@midday/events/events";
import { redirect } from "next/navigation";
import { authActionClient } from "../safe-action";
import { createGoCardLessLinkSchema } from "../schema";

export const createGoCardLessLinkAction = authActionClient
  .schema(createGoCardLessLinkSchema)
  .metadata({
    name: "create-gocardless-link",
  })
  .action(
    async ({
      parsedInput: {
        institutionId,
        availableHistory,
        redirectBase,
        step = "account",
      },
      ctx: { analytics, user },
    }) => {
      const redirectTo = new URL(redirectBase);

      redirectTo.searchParams.append("step", step);
      redirectTo.searchParams.append("provider", "gocardless");

      analytics.track({
        event: LogEvents.GoCardLessLinkCreated.name,
        institutionId,
        availableHistory,
        redirectBase,
        step,
      });

      try {
        const agreementResponse = await client.auth.gocardless.agreement.$post({
          json: {
            institutionId,
            transactionTotalDays: availableHistory,
          },
        });

        const { data: agreementData } = await agreementResponse.json();

        const linkResponse = await client.auth.gocardless.link.$post({
          json: {
            agreement: agreementData.id,
            institutionId,
            redirect: redirectTo.toString(),
          },
        });

        const { data: linkData } = await linkResponse.json();

        return redirect(linkData.link);
      } catch (error) {
        // Ignore NEXT_REDIRECT error in analytics
        if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
          analytics.track({
            event: LogEvents.GoCardLessLinkFailed.name,
            institutionId,
            availableHistory,
            redirectBase,
          });

          throw error;
        }

        throw error;
      }
    },
  );
