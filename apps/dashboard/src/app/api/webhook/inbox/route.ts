import { env } from "@/env.mjs";
import { getAllowedAttachments, prepareDocument } from "@midday/documents";
import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
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
      { status: 400 }
    );
  }

  const inboxId = getInboxIdFromEmail(parsedBody.data.OriginalRecipient);

  if (!inboxId) {
    return NextResponse.json(
      { error: "Invalid OriginalRecipient email" },
      { status: 400 }
    );
  }

  const logsnag = await setupLogSnag();

  logsnag.track({
    event: LogEvents.InboxInbound.name,
    icon: LogEvents.InboxInbound.icon,
    channel: LogEvents.InboxInbound.channel,
  });

  const supabase = createClient({ admin: true });

  try {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, inbox_email")
      .eq("inbox_id", inboxId)
      .single()
      .throwOnError();

    const teamId = teamData?.id;

    const { MessageID, FromFull, Subject, Attachments, TextBody, HtmlBody } =
      parsedBody.data;

    const fallbackName = Subject ?? FromFull?.Name;
    const forwardTo = teamData?.inbox_email;

    if (forwardTo) {
      const messageKey = `message-id:${MessageID}`;
      const isForwarded = await RedisClient.exists(messageKey);

      if (!isForwarded) {
        const { error } = await resend.emails.send({
          from: `${FromFull?.Name} <inbox@midday.ai>`,
          to: [forwardTo],
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

    // Transform and upload files
    const uploadedAttachments = allowedAttachments?.map(async (attachment) => {
      const { content, mimeType, size, fileName } = await prepareDocument(
        attachment
      );

      const { data } = await supabase.storage
        .from("vault")
        .upload(`${teamId}/inbox/${MessageID}/${fileName}`, content, {
          contentType: mimeType,
          upsert: true,
        });

      return {
        display_name: fallbackName,
        team_id: teamId,
        file_path: data?.path.split("/"),
        file_name: fileName,
        content_type: mimeType,
        forwarded_to: forwardTo,
        reference_id: `${MessageID}_${fileName}`,
        size,
      };
    });

    if (!uploadedAttachments) {
      // If no attachments we just want to forward the email
      if (forwardTo) {
        const messageKey = `message-id:${MessageID}`;
        const isForwarded = await RedisClient.exists(messageKey);
  
        if (!isForwarded) {
          const { error } = await resend.emails.send({
            from: `${FromFull?.Name} <inbox@midday.ai>`,
            to: [forwardTo],
            subject: fallbackName,
            text: TextBody,
            html: HtmlBody,
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

    const insertData = await Promise.all(uploadedAttachments);

    // Insert records
    const { data: inboxData } = await supabase
      .from("inbox")
      // TODO: Create custom upsert for encrypted values
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
        })
      )
    );
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: `Failed to create record for ${inboxId}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
