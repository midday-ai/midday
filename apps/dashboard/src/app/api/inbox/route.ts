import { headers } from "next/headers";

export const runtime = "edge";

const ips = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
  "127.0.0.1",
];

export async function POST(req: Request) {
  const res = await request.json();
  const ip = headers().get("x-forwarded-for");

  if (ips.includes(ip)) {
  }
  // Get email
  // match email to team in db
  // get all attachments
  // Save attachment in vault/inbox
  // save in inbox with Sender, email, attachment_url, team_id
  return Response.json({ success: true });
}
