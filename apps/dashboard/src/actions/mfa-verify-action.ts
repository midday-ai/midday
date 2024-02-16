"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidatePath } from "next/cache";
import { action } from "./safe-action";
import { mfaVerifySchema } from "./schema";

export const mfaVerifyAction = action(
  mfaVerifySchema,
  async ({ factorId, challengeId, code }) => {
    const supabase = createClient();
    const user = await getUser();

    const { data } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    revalidatePath("/account/security");

    logsnag.track({
      event: LogEvents.MfaVerify.name,
      icon: LogEvents.MfaVerify.icon,
      user_id: user.data.id,
      channel: LogEvents.MfaVerify.channel,
    });

    return data;
  }
);
