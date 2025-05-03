"use server";

import { LogEvents } from "@midday/events/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const mfaVerifyAction = authActionClient
  .schema(
    z.object({
      factorId: z.string(),
      challengeId: z.string(),
      code: z.string(),
    }),
  )
  .metadata({
    name: "mfa-verify",
    track: {
      event: LogEvents.MfaVerify.name,
      channel: LogEvents.MfaVerify.channel,
    },
  })
  .action(
    async ({
      parsedInput: { factorId, challengeId, code },
      ctx: { supabase },
    }) => {
      const { data } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      revalidatePath("/account/security");

      return data;
    },
  );
