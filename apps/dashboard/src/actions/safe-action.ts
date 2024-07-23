import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z
      .object({
        event: z.string(),
        channel: z.string(),
      })
      .optional();
  },
});

export const authActionClient = actionClient.use(async ({ next, metadata }) => {
  const user = await getUser();
  const supabase = createClient();

  if (!user?.data) {
    throw new Error("Unauthorized");
  }

  if (metadata) {
    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track(metadata);
  }

  return next({
    ctx: {
      user: user.data,
      supabase,
    },
  });
});
