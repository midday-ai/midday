"use server";

import { authActionClient } from "@/actions/safe-action";
import { reconnectConnectionSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { reconnectConnection } from "jobs/tasks/reconnect/connection";

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
      const event = await reconnectConnection.trigger({
        teamId: user.team_id!,
        connectionId,
        provider,
      });

      return event;
    },
  );
