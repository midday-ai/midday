import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ipRange = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
];

export async function POST(req: Request) {
  const res = await req.json();
  const clientIP = headers().get("x-forwarded-for");

  console.log("clientIP", clientIP);

  if (ipRange.includes(clientIP)) {
    const email = res.To;
    const [inboxId] = email.split("@");

    console.log(inboxId);

    console.log("body", res);
  }
  // match inboxId to team in db
  // get all attachments
  // Save attachment in vault/inbox
  // save in inbox with Sender, email, attachment_url, team_id
  return Response.json({ success: true });
}
