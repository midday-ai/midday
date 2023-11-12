import { createClient } from "@midday/supabase/server";

export const runtime = "nodejs";

// async function verifySignature(req) {
//   const payload = await req.text();
//   const signature = crypto
//     .createHmac("sha1", process.env.VERCEL_WEBHOOK_SECRET)
//     .update(payload)
//     .digest("hex");

//   return signature === req.headers["x-vercel-signature"];
// }

export async function POST(req: Request) {
  // const valid = await verifySignature(req);
  const { payload, type } = await req.json();

  if (
    // valid &&
    type === "deployment.succeeded" &&
    payload.target === "production"
  ) {
    const supabase = createClient();

    await supabase.from("deployments").insert({
      deployment_id: payload.deployment.id,
    });
  }

  return Response.json({
    success: true,
  });
}
