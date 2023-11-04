import { createClient } from "@midday/supabase/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const preferredRegion = "fra1";

export async function POST(req: Request) {
  const { payload } = await req.json();
  const headersList = headers();

  if (
    headersList.get("x-vercel-signature") ===
      process.env.VERCEL_WEBHOOK_SECRET &&
    payload.target === "production"
  ) {
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
