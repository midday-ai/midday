"use server";

import { env } from "@/env.mjs";
import InviteEmail from "@midday/email/emails/invite";
import { getI18n } from "@midday/email/locales";
import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { renderAsync } from "@react-email/components";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { action } from "./safe-action";
import { inviteTeamMembersSchema } from "./schema";

const resend = new Resend(env.RESEND_API_KEY);

export const inviteTeamMembersAction = action(
  inviteTeamMembersSchema,
  async ({ invites, redirectTo, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();

    const { t } = getI18n({ locale: user.data.locale });

    const location = headers().get("x-vercel-ip-city") ?? "Unknown";
    const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";

    const data = invites?.map((invite) => ({
      ...invite,
      team_id: user.data.team_id,
      invited_by: user.data.id,
    }));

    // TODO: Filter out members and previous invited emails
    const filteredInvites = data.filter((invite) => {
      if (invite.email === user.data.email) {
        return false;
      }

      return true;
    });

    const { data: invtesData } = await supabase
      .from("user_invites")
      .insert(filteredInvites)
      .select("email, code, user:invited_by(*), team:team_id(*)");

    const emails = invtesData?.map(async (invites) => ({
      from: "Midday <middaybot@midday.ai>",
      to: [invites.email],
      subject: t("invite.subject", {
        invitedByName: invites.user.full_name,
        teamName: invites.team.name,
      }),
      html: await renderAsync(
        InviteEmail({
          invitedByEmail: invites.user.email,
          invitedByName: invites.user.full_name,
          email: invites.email,
          teamName: invites.team.name,
          inviteCode: invites.code,
          ip,
          location,
          locale: user.data.locale,
        })
      ),
    }));

    const htmlEmails = await Promise.all(emails);

    await resend.batch.send(htmlEmails);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    if (redirectTo) {
      redirect(redirectTo);
    }

    logsnag.track({
      event: LogEvents.InviteTeamMembers.name,
      icon: LogEvents.InviteTeamMembers.icon,
      user_id: user.data.id,
      channel: LogEvents.InviteTeamMembers.channel,
    });
  }
);
