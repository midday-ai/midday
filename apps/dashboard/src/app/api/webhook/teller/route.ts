import { validateTellerSignature } from "@/utils/teller";
import type { syncConnection } from "@midday/jobs/tasks/bank/sync/connection";
import { createClient } from "@midday/supabase/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { isAfter, subDays } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const webhookSchema = z.object({
  id: z.string(),
  payload: z.object({
    enrollment_id: z.string().optional(),
    reason: z.string().optional(),
  }),
  timestamp: z.string(),
  type: z.enum([
    "enrollment.disconnected",
    "transactions.processed",
    "account.number_verification.processed",
    "webhook.test",
  ]),
});

export async function POST(req: NextRequest) {
  const text = await req.clone().text();
  const body = await req.json();

  const signatureValid = validateTellerSignature({
    signatureHeader: req.headers.get("teller-signature"),
    text,
  });

  if (!signatureValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  // Parse and validate webhook body
  const result = webhookSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid webhook payload", details: result.error.issues },
      { status: 400 },
    );
  }

  const { type, payload } = result.data;

  if (type === "webhook.test") {
    return NextResponse.json({ success: true });
  }

  if (!payload.enrollment_id) {
    return NextResponse.json(
      { error: "Missing enrollment_id" },
      { status: 400 },
    );
  }

  const supabase = await createClient({ admin: true });

  const { data: connectionData, error: connectionError } = await supabase
    .from("bank_connections")
    .select("id, created_at")
    .eq("enrollment_id", payload.enrollment_id)
    .single();

  console.log("payload", payload);
  console.log("connectionData", connectionData);
  console.log("connectionError", connectionError);

  if (!connectionData) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 },
    );
  }

  switch (type) {
    case "transactions.processed":
      {
        // Only run manual sync if the connection was created in the last 24 hours
        const manualSync = isAfter(
          new Date(connectionData.created_at),
          subDays(new Date(), 1),
        );

        await tasks.trigger<typeof syncConnection>("sync-connection", {
          connectionId: connectionData.id,
          manualSync,
        });
      }
      break;
  }

  return NextResponse.json({ success: true });
}
