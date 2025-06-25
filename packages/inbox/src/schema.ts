import { z } from "zod";

export const inboxAttachment = z.object({
  Name: z.string(),
  Content: z.string(),
  ContentType: z.string(),
  ContentID: z.string(),
  ContentLength: z.number(),
});

export const inboxWebhookPostSchema = z.object({
  OriginalRecipient: z.union([
    z
      .string({ required_error: "OriginalRecipient is required" })
      .email({ message: "Invalid email format" })
      .endsWith("@inbox.midday.ai", { message: "Invalid email domain" }),
    z
      .string({ required_error: "OriginalRecipient is required" })
      .email({ message: "Invalid email format" })
      .endsWith("@inbox.staging.midday.ai", {
        message: "Invalid email domain",
      }),
  ]),
  Attachments: z.array(inboxAttachment).optional(),
  Subject: z.string().optional(),
  TextBody: z.string().optional(),
  HtmlBody: z.string().optional(),
  FromFull: z.object({
    Name: z.string(),
    Email: z.string(),
  }),
  MessageID: z.string({ required_error: "MessageID is required" }),
});

export type Attachment = z.infer<typeof inboxAttachment>;
