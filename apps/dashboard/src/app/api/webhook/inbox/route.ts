import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getInboxIdFromEmail, inboxWebhookPostSchema } from "@midday/inbox";
import { client as BackgroundClient, Events } from "@midday/jobs";
import { createClient } from "@midday/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// https://postmarkapp.com/support/article/800-ips-for-firewalls#webhooks
const ipRange = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
];

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

    const {
      MessageID,
      OriginalRecipient,
      FromFull,
      Subject,
      Attachments,
      TextBody,
      HtmlBody,
    } = parsedBody.data;

    const fallbackName = Subject.length > 0 ? Subject : FromFull?.Name;
    const forwardTo = teamData.inbox_email;

    if (teamData?.inbox_email) {
      BackgroundClient.sendEvent({
        name: Events.INBOX_FORWARD,
        id: MessageID,
        payload: {
          from: `${parsedBody.FromFull.Name} <inbox@midday.ai>`,
          to: forwardTo,
          subject,
          text: TextBody,
          html: HtmlBody,
          attachments: Attachments?.map((a) => ({
            filename: a.Name,
            content: a.Content,
          })),
        },
      });
    }

    BackgroundClient.sendEvent({
      name: Events.INBOX_PROCESS,
      payload: {
        teamId: teamData?.id,
        forwardTo,
        fallbackName,
        attachments: Attachments?.map((a) => ({
          filename: a.Name,
          content: a.Content,
          size: a.ContentLength,
        })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create record for ${inboxId}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
