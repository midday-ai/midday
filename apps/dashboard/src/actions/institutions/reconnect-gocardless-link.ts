"use server";

import { engineClient } from "@/utils/engine-client";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const reconnectGoCardLessLinkAction = authActionClient
  .schema(
    z.object({
      id: z.string(),
      institutionId: z.string(),
      availableHistory: z.number(),
      isDesktop: z.boolean(),
      redirectTo: z.string(),
    }),
  )
  .metadata({
    name: "create-gocardless-link",
  })
  .action(
    async ({
      parsedInput: {
        id,
        institutionId,
        availableHistory,
        redirectTo,
        isDesktop,
      },
      ctx: { teamId },
    }) => {
      const reference = `${teamId}:${nanoid()}`;

      const link = new URL(redirectTo);

      link.searchParams.append("id", id);

      if (isDesktop) {
        link.searchParams.append("desktop", "true");
      }

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
          redirect: link.toString(),
          // In the reconnect flow we need the reference based on the team
          // so we can find the correct requestion id on success and update the current reference
          reference,
        },
      });

      if (!linkResponse.ok) {
        throw new Error("Failed to create link");
      }

      const { data: linkData } = await linkResponse.json();

      if (!linkResponse.ok) {
        throw new Error("Failed to create link");
      }

      return redirect(linkData.link);
    },
  );
