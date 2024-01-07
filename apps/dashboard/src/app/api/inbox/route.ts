import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ips = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
  "127.0.0.1",
];

export async function POST(req: Request) {
  const res = await req.json();
  const ip = headers().get("x-forwarded-for");

  console.log("body", res);

  if (ips.includes(ip)) {
    const email = res.To;
    const [inboxId] = email.split("@");

    console.log(inboxId);
  }
  // match inboxId to team in db
  // get all attachments
  // Save attachment in vault/inbox
  // save in inbox with Sender, email, attachment_url, team_id
  return Response.json({ success: true });
}
