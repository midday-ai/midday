"use server";

import { LogEvents } from "@midday/events/events";
import { revalidatePath } from "next/cache";
import { authActionClient } from "./safe-action";
import { mfaVerifySchema } from "./schema";

export const mfaVerifyAction = authActionClient
  .schema(mfaVerifySchema)
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
