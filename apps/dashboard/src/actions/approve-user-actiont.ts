"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { Events, client as trigger } from "@midday/jobs";
import { client as redis } from "@midday/kv";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { approveUserSchema } from "./schema";

export const approveUserAction = action(
  approveUserSchema,
  async ({ email, fullName }) => {
    await redis.append("approved", email);

    trigger.sendEvent({
      name: Events.ONBOARDING_EMAILS,
      payload: {
        fullName,
        email,
      },
    });

    logsnag.track({
      event: LogEvents.VerifiedEarlyAccess.name,
      icon: LogEvents.VerifiedEarlyAccess.icon,
      user_id: email,
      channel: LogEvents.VerifiedEarlyAccess.channel,
    });

    redirect("/");
  }
);
