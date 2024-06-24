import * as crypto from "node:crypto";
import { getI18n } from "@midday/email/locales";
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
  const text = await req.clone().text();
  const signature = headers().get("x-supabase-signature");

  if (!signature) {
    return NextResponse.json({ message: "Missing signature" }, { status: 401 });
  }

  const decodedSignature = Buffer.from(signature, "base64");
  const calculatedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET_KEY!)
    .update(text)
    .digest();

  const hmacMatch = crypto.timingSafeEqual(
    decodedSignature,
    calculatedSignature
  );

  if (!hmacMatch) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = createClient({ admin: true });

  const { data: transactionData } = await supabase
    .from("transactions")
    .select("id, name")
    .eq("id", body.record.id)
    .eq("team_id", body.record.team_id)
    .single()
    .throwOnError();

  // NOTE: All inbox reciepts and invoices amount are
  // saved with positive values while transactions have signed values
  const { data: inboxData } = await supabase
    .from("inbox")
    .select("*")
    .eq("amount", Math.abs(body.record.amount))
    .eq("team_id", body.record.team_id)
    .eq("archived", false)
    .eq("trash", false)
    .gte("created_at", subDays(new Date(), 45).toISOString())
    .is("transaction_id", null);

  // NOTE: If we match more than one inbox record we can't be sure of a match
  if (inboxData && inboxData.length === 1) {
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

    const { data: usersData } = await supabase
      .from("users_on_team")
      .select(
        "id, team_id, user:users(id, full_name, avatar_url, email, locale)"
      )
      .eq("team_id", body.record.team_id);

    const notificationEvents = usersData.map(({ user }) => {
      const { t } = getI18n({ locale: user.locale });

      return {
        name: TriggerEvents.MatchNewInApp,
        payload: {
          recordId: updatedInboxData.transaction_id,
          description: t("notifications.match", {
            transactionName: transactionData.name,
            fileName: updatedInboxData.file_name,
          }),
          type: NotificationTypes.Match,
        },
        user: {
          subscriberId: user.id,
          teamId: updatedInboxData.team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    });

    triggerBulk(notificationEvents?.flat());
  }

  return NextResponse.json({ message: "success" });
}
