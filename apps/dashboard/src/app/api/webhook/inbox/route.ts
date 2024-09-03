import { env } from "@/env.mjs";
import { logger } from "@/utils/logger";
import { getAllowedAttachments, prepareDocument } from "@midday/documents";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getInboxIdFromEmail, inboxWebhookPostSchema } from "@midday/inbox";
import { client as BackgroundClient, Events } from "@midday/jobs";
import { client as RedisClient } from "@midday/kv";
import { createClient } from "@midday/supabase/server";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 300; // 5min

// https://postmarkapp.com/support/article/800-ips-for-firewalls#webhooks
const ipRange = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
];

const FORWARD_FROM_EMAIL = "inbox@midday.ai";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(req: Request) {
  const clientIp = headers().get("x-forwarded-for") ?? "";

  if (
    process.env.NODE_ENV !== "development" &&
    (!clientIp || !ipRange.includes(clientIp))
  ) {
    return NextResponse.json({ error: "Invalid IP address" }, { status: 403 });
  }

  const parsedBody = inboxWebhookPostSchema.safeParse(await req.json());

  if (!parsedBody.success) {
    const errors = parsedBody.error.errors.map((error) => ({
      path: error.path.join("."),
      message: error.message,
    }));

    return NextResponse.json(
      { error: "Invalid request body", errors },
      { status: 400 },
    );
  }

  const {
    MessageID,
    FromFull,
    Subject,
    Attachments,
    TextBody,
    HtmlBody,
    OriginalRecipient,
  } = parsedBody.data;

  const inboxId = getInboxIdFromEmail(OriginalRecipient);

  if (!inboxId) {
    return NextResponse.json(
      { error: "Invalid OriginalRecipient email" },
      { status: 400 },
    );
  }

  // Ignore emails from our own domain to fix infinite loop
  if (FromFull.Email === FORWARD_FROM_EMAIL) {
    return NextResponse.json({ success: true });
  }

  const supabase = createClient({ admin: true });

  try {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, inbox_email, inbox_forwarding")
      .eq("inbox_id", inboxId)
      .single()
      .throwOnError();

    const analytics = await setupAnalytics();

    analytics.track({
      event: LogEvents.InboxInbound.name,
      channel: LogEvents.InboxInbound.channel,
    });

    const teamId = teamData?.id;

    const fallbackName = Subject ?? FromFull?.Name;
    const forwardEmail = teamData?.inbox_email;
    const forwardingEnabled = teamData?.inbox_forwarding && forwardEmail;

    if (forwardingEnabled) {
      const messageKey = `message-id:${MessageID}`;
      const isForwarded = await RedisClient.exists(messageKey);

      if (!isForwarded) {
        const { error } = await resend.emails.send({
          from: `${FromFull?.Name} <${FORWARD_FROM_EMAIL}>`,
          to: [forwardEmail],
          subject: fallbackName,
          text: TextBody,
          html: HtmlBody,
          attachments: Attachments?.map((a) => ({
            filename: a.Name,
            content: a.Content,
          })),
          react: null,
          headers: {
            "X-Entity-Ref-ID": nanoid(),
          },
        });

        if (!error) {
          await RedisClient.set(messageKey, true, { ex: 9600 });
        }
      }
    }

    const allowedAttachments = getAllowedAttachments(Attachments);

    // If no attachments we just want to forward the email
    if (!allowedAttachments?.length && forwardEmail) {
      const messageKey = `message-id:${MessageID}`;
      const isForwarded = await RedisClient.exists(messageKey);

      if (!isForwarded) {
        const { error } = await resend.emails.send({
          from: `${FromFull?.Name} <${FORWARD_FROM_EMAIL}>`,
          to: [forwardEmail],
          subject: fallbackName,
          text: TextBody,
          html: HtmlBody,
          attachments: Attachments?.map((a) => ({
            filename: a.Name,
            content: a.Content,
          })),
          react: null,
          headers: {
            "X-Entity-Ref-ID": nanoid(),
          },
        });

        if (!error) {
          await RedisClient.set(messageKey, true, { ex: 9600 });
        }
      }

      return NextResponse.json({
        success: true,
      });
    }

    // Transform and upload files
    const uploadedAttachments = allowedAttachments?.map(async (attachment) => {
      const { content, mimeType, size, fileName, name } =
        await prepareDocument(attachment);

      const uniqueFileName = `${fileName}_${nanoid(4)}`;

      const { data } = await supabase.storage
        .from("vault")
        .upload(`${teamId}/inbox/${uniqueFileName}`, content, {
          contentType: mimeType,
          upsert: true,
        });

      return {
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        display_name: Subject || name,
        team_id: teamId,
        file_path: data?.path.split("/"),
        file_name: uniqueFileName,
        content_type: mimeType,
        forwarded_to: forwardingEnabled ? forwardEmail : null,
        reference_id: `${MessageID}_${uniqueFileName}`,
        size,
      };
    });

    const insertData = await Promise.all(uploadedAttachments ?? []);

    // Insert records
    const { data: inboxData } = await supabase
      .from("inbox")
      .insert(insertData)
      .select("id")
      .throwOnError();

    if (!inboxData?.length) {
      throw Error("No records");
    }

    await Promise.all(
      inboxData?.map((inbox) =>
        BackgroundClient.sendEvent({
          name: Events.INBOX_DOCUMENT,
          payload: {
            recordId: inbox.id,
            teamId,
          },
        }),
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger(message);

    return NextResponse.json(
      { error: `Failed to create record for ${inboxId}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
