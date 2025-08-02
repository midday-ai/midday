import { logger } from "@/utils/logger";
import { resend } from "@api/services/resend";
import { getAllowedAttachments } from "@midday/documents";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getInboxIdFromEmail, inboxWebhookPostSchema } from "@midday/inbox";
import type { ProcessAttachmentPayload } from "@midday/jobs/schema";
import { createClient } from "@midday/supabase/server";
import { tasks } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// https://postmarkapp.com/support/article/800-ips-for-firewalls#webhooks
const ipRange = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
];

const FORWARD_FROM_EMAIL = "inbox@midday.ai";

// These are used by Google Workspace to forward emails to our inbox
const ALLOWED_FORWARDING_EMAILS = ["forwarding-noreply@google.com"];

export async function POST(req: Request) {
  const clientIp = (await headers()).get("x-forwarded-for") ?? "";

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
    OriginalRecipient,
    TextBody,
    HtmlBody,
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

  const supabase = await createClient({ admin: true });

  try {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, email")
      .eq("inbox_id", inboxId)
      .single()
      .throwOnError();

    const analytics = await setupAnalytics();

    analytics.track({
      event: LogEvents.InboxInbound.name,
      channel: LogEvents.InboxInbound.channel,
    });

    const teamId = teamData?.id;

    // If the email is forwarded from a Google Workspace account, we need to send a reply to the team email
    if (teamData?.email && ALLOWED_FORWARDING_EMAILS.includes(FromFull.Email)) {
      await resend.emails.send({
        from: `${FromFull?.Name} <${FORWARD_FROM_EMAIL}>`,
        to: teamData.email,
        subject: Subject ?? FromFull?.Name,
        text: TextBody,
        html: HtmlBody,
        react: null,
        headers: {
          "X-Entity-Ref-ID": nanoid(),
        },
      });

      return NextResponse.json({ success: true });
    }

    const allowedAttachments = getAllowedAttachments(Attachments);

    if (!allowedAttachments?.length) {
      logger("No allowed attachments");
      // No attachments
      return NextResponse.json({ success: true });
    }

    // Transform and upload files, filtering out attachments smaller than 100kb except PDFs
    // This helps avoid processing small images like logos, favicons and tracking pixels while keeping all PDFs for processing
    const uploadedAttachments = allowedAttachments
      ?.filter(
        (attachment) =>
          !(
            attachment.ContentLength < 100000 &&
            attachment.ContentType !== "application/pdf"
          ),
      )
      ?.map(async (attachment) => {
        // Add a random 4 character string to the end of the file name
        // to make it unique before the extension
        const uniqueFileName = attachment.Name.replace(
          /(\.[^.]+)$/,
          (ext) => `_${nanoid(4)}${ext}`,
        );

        const { data } = await supabase.storage
          .from("vault")
          .upload(
            `${teamId}/inbox/${uniqueFileName}`,
            Buffer.from(attachment.Content, "base64"),
            {
              contentType: attachment.ContentType,
              upsert: true,
            },
          );

        return {
          // NOTE: If we can't parse the name using OCR this will be the fallback name
          display_name: Subject || attachment.Name,
          team_id: teamId,
          file_path: data?.path.split("/"),
          file_name: uniqueFileName,
          content_type: attachment.ContentType,
          reference_id: `${MessageID}_${attachment.Name}`,
          size: attachment.ContentLength,
        };
      });

    if (!uploadedAttachments?.length) {
      logger("No uploaded attachments");

      return NextResponse.json({
        success: true,
      });
    }

    const insertData = await Promise.all(uploadedAttachments ?? []);

    await tasks.batchTrigger(
      "process-attachment",
      insertData.map((item) => ({
        payload: {
          filePath: item.file_path!,
          mimetype: item.content_type!,
          size: item.size!,
          teamId: teamId!,
        } satisfies ProcessAttachmentPayload,
      })),
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
