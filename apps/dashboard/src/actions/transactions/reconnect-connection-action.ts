"use server";

import { authActionClient } from "@/actions/safe-action";
import { reconnectConnectionSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import type { reconnectConnection } from "@midday/jobs/tasks/reconnect/connection";
import { tasks } from "@trigger.dev/sdk/v3";

export const reconnectConnectionAction = authActionClient
  .schema(reconnectConnectionSchema)
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
