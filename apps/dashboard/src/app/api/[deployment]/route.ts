import crypto from "crypto";
import { createClient } from "@midday/supabase/server";

export const runtime = "nodejs";

async function verifySignature(req) {
  const payload = await req.text();
  const signature = crypto
    .createHmac("sha1", process.env.VERCEL_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return signature === req.headers["x-vercel-signature"];
}

export async function POST(req: Request) {
  const { payload } = await req.json();
  const verified = await verifySignature(req);

  if (verified) {
    const supabase = createClient();

    if (payload.target === "production") {
      await supabase.from("deployments").insert({
        deployment_id: payload.id,
        target: payload.target,
      });
    }
  }

  return Response.json({
    success: true,
  });
}
