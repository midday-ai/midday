"use server";

import Midday from "@midday-ai/engine";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "../safe-action";

const engine = new Midday();

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
    }) => {
      await engine.institutions.usage.update(institutionId);

      const link = new URL(redirectTo);

      link.searchParams.append("id", id);

      if (isDesktop) {
        link.searchParams.append("desktop", "true");
      }

      const { data: agreementData } =
        await engine.auth.gocardless.agreement.create({
          institutionId,
          transactionTotalDays: availableHistory,
        });

      console.log(link.toString());

      const { data } = await engine.auth.gocardless.link({
        agreement: agreementData.id,
        institutionId,
        redirect: link.toString(),
      });

      return redirect(data.link);
    },
  );
