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
    // await tasks.batchTrigger(
    //   "inbox-slack-upload",
    //   files.map((file) => ({
    //     payload: {
    //       teamId,
    //       token,
    //       channelId: event.channel,
    //       threadId: event.thread_ts,
    //       file: {
    //         id: file.id,
    //         name: file.name!,
    //         mimetype: file.mimetype,
    //         size: file.size,
    //         url: file.url!,
    //       },
    //     } satisfies InboxSlackUploadPayload,
    //   })),
    // );
  }
}
