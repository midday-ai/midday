import { eventTrigger } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";
import { client, resend } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.INBOX_FORWARD,
  name: "Inbox - Forward",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.INBOX_FORWARD,
    schema: z.object({
      to: z.string().email(),
      from: z.string(),
      subject: z.string(),
      text: z.string().optional(),
      html: z.string().optional(),
      attachments: z
        .array(
          z.object({
            Name: z.string(),
            Content: z.string(),
          })
        )
        .optional(),
    }),
  }),
  integrations: {
    resend,
  },
  run: async (payload, io, ctx) => {
    const { to, from, subject, text, html, attachments } = payload;

    await io.resend.emails.send(ctx.event.id, {
      from: `${from} <inbox@midday.ai>`,
      to: [to],
      subject,
      text,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.Name,
        content: a.Content,
      })),
      react: null,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });
  },
});
