"use server";

import { getAuth } from "@midday/auth/server";
import { LogEvents } from "@midday/events/events";
import { isLocalBackend } from "@midday/utils/backend";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const mfaVerifyAction = authActionClient
  .schema(
    z.union([
      z.object({
        factorId: z.string(),
        challengeId: z.string(),
        code: z.string(),
      }),
      z.discriminatedUnion("method", [
        z.object({
          method: z.literal("totp"),
          code: z.string().regex(/^\d{6}$/),
        }),
        z.object({
          method: z.literal("backup"),
          code: z.string().min(1).max(100),
        }),
      ]),
    ]),
  )
  .metadata({
    name: "mfa-verify",
    track: {
      event: LogEvents.MfaVerify.name,
      channel: LogEvents.MfaVerify.channel,
    },
  })
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    if (!isLocalBackend()) {
      if (!supabase || !("factorId" in parsedInput))
        throw new Error("Invalid Supabase MFA challenge");
      const { data, error } = await supabase.auth.mfa.verify(parsedInput);
      if (error) throw new Error(error.message);
      revalidatePath("/account/security");
      return { verified: !!data };
    }
    if (!("method" in parsedInput))
      throw new Error("Invalid local MFA challenge");
    const { code, method } = parsedInput;
    const auth = await getAuth();
    const h = await headers();
    // The shared plugin hooks limit attempts and elevate the surviving session.
    if (method === "backup")
      await auth.api.verifyBackupCode({ body: { code }, headers: h });
    else await auth.api.verifyTOTP({ body: { code }, headers: h });
    revalidatePath("/account/security");
    return { verified: true };
  });
