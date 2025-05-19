"use server";

import { engineClient } from "@midday/engine-client";
import { LogEvents } from "@midday/events/events";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const createGoCardLessLinkAction = authActionClient
  .schema(
    z.object({
      institutionId: z.string(),
      step: z.string().optional(),
      availableHistory: z.number(),
      redirectBase: z.string(),
    }),
  )
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
      ctx: { analytics },
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
        const agreementResponse =
          await engineClient.auth.gocardless.agreement.$post({
            json: {
              institutionId,
              transactionTotalDays: availableHistory,
            },
          });

        if (!agreementResponse.ok) {
          throw new Error("Failed to create agreement");
        }

        const { data: agreementData } = await agreementResponse.json();

        const linkResponse = await engineClient.auth.gocardless.link.$post({
          json: {
            agreement: agreementData.id,
            institutionId,
            redirect: redirectTo.toString(),
          },
        });

        if (!linkResponse.ok) {
          throw new Error("Failed to create link");
        }

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
