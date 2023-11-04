import { createClient } from "@midday/supabase/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const preferredRegion = "fra1";

export async function POST(req: Request) {
  const { payload, type } = await req.json();
  const headersList = headers();

  console.log("type", type);
  console.log(
    "signature valid",
    headersList.get("x-vercel-signature") === process.env.VERCEL_WEBHOOK_SECRET,
  );

  console.log("target", payload.target);

  if (
    type === "deployment.succeeded" &&
    headersList.get("x-vercel-signature") ===
      process.env.VERCEL_WEBHOOK_SECRET &&
    payload.target === "production"
  ) {
    const supabase = createClient();

    await supabase.from("deployments").insert({
      deployment_id: payload.deployment.id,
      target: payload.deployment.target,
    });
  }

  return Response.json({
    success: true,
  });
}
