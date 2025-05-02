"use server";

import { authActionClient } from "@/actions/safe-action";
import { LogEvents } from "@midday/events/events";
import type { reconnectConnection } from "@midday/jobs/tasks/reconnect/connection";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const reconnectConnectionAction = authActionClient
  .schema(
    z.object({
      connectionId: z.string(),
      provider: z.string(),
    }),
  )
  .metadata({
    name: "reconnect-connection",
    track: {
      event: LogEvents.ReconnectConnection.name,
      channel: LogEvents.ReconnectConnection.channel,
    },
  })
  .action(
    async ({ parsedInput: { connectionId, provider }, ctx: { user } }) => {
      const event = await tasks.trigger<typeof reconnectConnection>(
        "reconnect-connection",
        {
          teamId: user.team_id!,
          connectionId,
          provider,
        },
      );

      return event;
    },
  );
