import { triggerJob } from "@midday/job-client";
import type { FileShareMessageEvent } from "@slack/web-api";

export async function fileShare(
  event: FileShareMessageEvent,
  { teamId, token }: { teamId: string; token: string },
) {
  const files = event?.files?.map((file) => ({
    id: file.id,
    name: file.name,
    mimetype: file.mimetype,
    size: file.size,
    url: file.url_private_download,
  }));

  if (files && files.length > 0) {
    // Trigger jobs for each file
    await Promise.all(
      files.map((file) =>
        triggerJob(
          "slack-upload",
          {
            teamId,
            token,
            channelId: event.channel,
            threadId: event.thread_ts,
            messageTs: event.ts, // Message timestamp for reactions
            file: {
              id: file.id,
              name: file.name!,
              mimetype: file.mimetype ?? "application/octet-stream",
              size: file.size ?? 0,
              url: file.url!,
            },
          },
          "inbox",
        ),
      ),
    );
  }
}
