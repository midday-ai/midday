import { env } from "@/env.mjs";
import { Events } from "@midday/jobs";
import { client } from "@midday/jobs/src/client";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { createClient } from "@midday/supabase/server";
import { decode } from "base64-arraybuffer";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 300; // 5min
export const dynamic = "force-dynamic";

const resend = new Resend(env.RESEND_API_KEY);

// https://postmarkapp.com/support/article/800-ips-for-firewalls#webhooks
const ipRange = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
];

export async function POST(req: Request) {
  const supabase = createClient({ admin: true });
  const res = await req.json();
  const clientIP = headers().get("x-forwarded-for");

  if (res?.To && ipRange.includes(clientIP)) {
    const email = res?.To;
    const [inboxId] = email.split("@");

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, inbox_email")
      .eq("inbox_id", inboxId)
      .single()
      .throwOnError();

    const attachments = res.Attachments;
    const subject = res.Subject ?? "No subject";

    try {
      // NOTE: Send original email to company email
      await resend.emails.send({
        from: `${res.FromFull.Name} <inbox@midday.ai>`,
        to: [teamData.inbox_email],
        subject,
        text: res.TextBody,
        html: res.HtmlBody,
        attachments: attachments.map((a) => ({
          filename: a.Name,
          content: a.Content,
        })),
        headers: {
          "X-Entity-Ref-ID": nanoid(),
        },
      });
    } catch (error) {
      console.log(error);
    }

    const records = attachments.map(async (attachment) => {
      console.log(attachment);

      const { data, error } = await supabase.storage
        .from("vault")
        .upload(
          `${teamData.id}/inbox/${attachment.Name}`,
          decode(attachment.Content),
          {
            contentType: attachment.ContentType,
            upsert: true,
          }
        );

      console.log(error);

      return {
        email: res.FromFull.Email,
        name: res.FromFull.Name,
        subject,
        team_id: teamData.id,
        file_path: data.path.split("/"),
        file_name: attachment.Name,
        content_type: attachment.ContentType,
        size: attachment.ContentLength,
        html: res.HtmlBody,
      };
    });

    const insertData = await Promise.all(records);

    const { data: inboxData } = await supabase
      .from("decrypted_inbox")
      .insert(insertData)
      .select("*, name:decrypted_name, subject:decrypted_subject");

    await Promise.all(
      inboxData.map((inbox) =>
        client.sendEvent({
          name: Events.PROCESS_INBOX,
          payload: {
            inboxId: inbox.id,
          },
        })
      )
    );

    revalidateTag(`inbox_${teamData.id}`);

    const { data: usersData } = await supabase
      .from("users_on_team")
      .select("team_id, user:user_id(id, full_name, avatar_url, email, locale)")
      .eq("team_id", teamData.id);

    const notificationEvents = await Promise.all(
      usersData?.map(async ({ user, team_id }) => {
        return inboxData.map((inbox) => ({
          name: TriggerEvents.InboxNewInApp,
          payload: {
            recordId: inbox.id,
            description: `${inbox.name} - ${inbox.subject}`,
            type: NotificationTypes.Inbox,
          },
          user: {
            subscriberId: user.id,
            teamId: team_id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
          },
        }));
      })
    );

    triggerBulk(notificationEvents?.flat());

    if (teamData?.inbox_email) {
      // NOTE: If we end up here the email was forwarded
      await supabase.from("inbox").upsert(
        inboxData.map((inbox) => ({
          id: inbox.id,
          forwarded_to: teamData.inbox_email,
        }))
      );

      revalidateTag(`inbox_${teamData.id}`);
    }
  }

  return Response.json({ success: true });
}
