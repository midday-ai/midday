"use server";

import { LogEvents } from "@midday/events/events";
import { inboxUpload } from "jobs/tasks/inbox/upload";
import { authActionClient } from "./safe-action";
import { inboxUploadSchema } from "./schema";

export const inboxUploadAction = authActionClient
  .schema(inboxUploadSchema)
  .metadata({
    name: "inbox-upload",
    track: {
      event: LogEvents.InboxUpload.name,
      channel: LogEvents.InboxUpload.channel,
    },
  })
  .action(async ({ parsedInput: uploads, ctx: { user } }) => {
    if (!user.team_id) {
      throw new Error("No team id");
    }

    const results = await inboxUpload.batchTrigger(
      uploads.map((upload, idx) => ({
        payload: {
          ...upload,
          id: `upload-${idx}`,
          teamId: user.team_id!,
        },
      })),
    );

    return results;
  });
