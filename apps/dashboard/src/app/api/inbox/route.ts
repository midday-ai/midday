import { createClient } from "@midday/supabase/server";
import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// https://postmarkapp.com/support/article/800-ips-for-firewalls#webhooks
const ipRange = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
  "127.0.0.1",
];

export async function POST(req: Request) {
  const supabase = createClient();
  const res = await req.json();
  const clientIP = headers().get("x-forwarded-for");

  if (res?.To && ipRange.includes(clientIP)) {
    const email = res?.To;
    const [inboxId] = email.split("@");

    const { data: teamData } = await supabase
      .from("teams")
      .select("id")
      .eq("inbox_id", inboxId)
      .single();

    const attachments = res.Attachments;

    const ppromises = attachments.map(async (attachment) => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(
          `vault/${teamData.id}/inbox/${attachment.name}`,
          attachment.Content,
          {
            contentType: attachment.ContentType,
          }
        );

      console.log(error);
      return data;
    });

    console.log(await Promise.all(ppromises));
  }
  // get all attachments
  // save each in inbox vault
  // save in documents
  // save in inbox with Sender, email, attachment_url, team_id
  return Response.json({ success: true });
}
