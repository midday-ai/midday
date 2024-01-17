import { env } from "@/env.mjs";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { updateInboxById } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { subDays } from "date-fns";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 300; // 5min
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = headers().get("x-api-key");

  if (key !== env.API_ROUTE_SECRET) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  const supabase = createClient({ admin: true });

  const body = await req.json();

  // NOTE: All inbox reciepts and invoices amount are saved with positive values while transactions have signed values
  const { data: inboxData } = await supabase
    .from("inbox")
    .select("*")
    .eq("amount", Math.abs(body.record.amount))
    .eq("team_id", body.record.team_id)
    .gte("created_at", subDays(new Date(), 45).toISOString())
    .is("transaction_id", null);

  // NOTE: If we match more than one inbox record we can't be sure of a match
  if (inboxData.length === 1) {
    const inbox = inboxData.at(0);

    const { data: attachmentData } = await supabase
      .from("transaction_attachments")
      .insert({
        type: inbox.content_type,
        path: inbox.file_path,
        transaction_id: body.record.id,
        team_id: inbox.team_id,
        size: inbox.size,
        name: inbox.file_name,
      })
      .select()
      .single();

    const { data: updatedInboxData } = await updateInboxById(supabase, {
      id: inbox.id,
      attachment_id: attachmentData.id,
      transaction_id: body.record.id,
      read: true,
    });

    revalidateTag(`transactions_${inbox.team_id}`);
    revalidateTag(`inbox_${inbox.team_id}`);

    const { data: usersData } = await supabase
      .from("users_on_team")
      .select("id, team_id, user:user_id(id, avatar_url, full_name, email)")
      .eq("team_id", body.record.team_id);

    const notificationEvents = usersData.map((user) => ({
      name: TriggerEvents.MatchNewInApp,
      payload: {
        recordId: updatedInboxData.transaction_id,
        description: `We just matched the transaction “Vercel Pro $40” against “${updatedInboxData.file_name}”`,
        type: NotificationTypes.Match,
      },
      user: {
        subscriberId: user.id,
        teamId: updatedInboxData.team_id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
      },
    }));

    if (notificationEvents?.length) {
      triggerBulk(notificationEvents.flat());
    }
  }

  return NextResponse.json({ message: "success" });
}
