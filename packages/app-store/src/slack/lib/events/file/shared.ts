import { Events, client } from "@midday/jobs";
import type { FileSharedEvent } from "@slack/web-api";

export async function fileShared(
  event: FileSharedEvent,
  { teamId, token }: { teamId: string; token: string },
) {
  const files = event?.files?.map((file) => ({
    id: file.id,
    name: file.name,
    mimetype: file.mimetype,
    size: file.size,
    url: file.url_private_download,
  }));

  await Promise.all(
    files.map((file) =>
      client.sendEvent({
        name: Events.INBOX_SLACK_UPLOAD,
        payload: {
          teamId,
          token,
          channelId: event.channel,
          threadId: event.thread_ts,
          file,
        },
      }),
    ),
  );
}
