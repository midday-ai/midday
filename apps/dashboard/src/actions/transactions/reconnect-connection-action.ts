"use server";

import { authActionClient } from "@/actions/safe-action";
import { LogEvents } from "@midday/events/events";
import type { ReconnectConnectionPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
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
    async ({ parsedInput: { connectionId, provider }, ctx: { teamId } }) => {
      const event = await tasks.trigger("reconnect-connection", {
        teamId: teamId!,
        connectionId,
        provider,
      } satisfies ReconnectConnectionPayload);

      return event;
    },
  );
