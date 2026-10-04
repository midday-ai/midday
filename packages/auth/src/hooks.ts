import { primaryDb } from "@midday/db/client";
import { createUserProfile } from "@midday/db/queries/users";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import type { OnboardTeamPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
export async function onUserCreated(user: {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}) {
  await createUserProfile(primaryDb, {
    id: user.id,
    email: user.email,
    fullName: user.name,
    avatarUrl: user.image,
  });
  try {
    const analytics = await setupAnalytics();
    analytics.track({
      event: LogEvents.Registered.name,
      channel: LogEvents.Registered.channel,
    });
    if (process.env.TRIGGER_SECRET_KEY)
      await tasks.trigger(
        "onboard-team",
        { userId: user.id } satisfies OnboardTeamPayload,
        { delay: "10m" },
      );
  } catch (error) {
    console.error("[auth] Post-registration task failed", error);
  }
}
