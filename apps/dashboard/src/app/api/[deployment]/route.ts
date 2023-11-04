import { createClient } from "@midday/supabase/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const preferredRegion = "fra1";

export async function POST(req: Request) {
  const { payload, ...rest } = await req.json();
  console.log("webhook", rest);
  const headersList = headers();

  if (
    headersList.get("x-vercel-signature") ===
      process.env.VERCEL_WEBHOOK_SECRET &&
    payload.target === "production"
  ) {
    const supabase = createClient();

    console.log("here", 1);

    if (payload.target === "production") {
      await supabase.from("deployments").insert({
        deployment_id: payload.id,
        target: payload.target,
      });

      console.log("here", 2);
    }

    console.log("here", 3);
  }

  return Response.json({
    success: true,
  });
}
