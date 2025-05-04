import { logger } from "@/utils/logger";
import { getTeamId } from "@/utils/team";
import { setupAnalytics } from "@midday/events/server";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const actionClientWithMeta = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
      track: z
        .object({
          event: z.string(),
          channel: z.string(),
        })
        .optional(),
    });
  },
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const authActionClient = actionClientWithMeta
  .use(async ({ next, clientInput, metadata }) => {
    const result = await next({ ctx: {} });

    if (process.env.NODE_ENV === "development") {
      logger("Input ->", clientInput);
      logger("Result ->", result.data);
      logger("Metadata ->", metadata);

      return result;
    }

    return result;
  })
  .use(async ({ next, metadata }) => {
    const {
      data: { session },
    } = await getSession();

    const teamId = await getTeamId();

    const supabase = await createClient();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const analytics = await setupAnalytics({
      userId: session.user.id,
      fullName: session.user.user_metadata.full_name,
    });

    if (metadata?.track) {
      analytics.track(metadata.track);
    }

    return next({
      ctx: {
        supabase,
        analytics,
        user: session.user,
        teamId,
      },
    });
  });
