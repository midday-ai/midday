"use server";

import { env } from "@/env.mjs";
import InviteEmail from "@midday/email/emails/invite";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { renderAsync } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { Resend } from "resend";
import { action } from "./safe-action";
import { inviteTeamMembersSchema } from "./schema";

const resend = new Resend(env.RESEND_API_KEY);
import { headers } from "next/headers";

export const inviteTeamMembersAction = action(
  inviteTeamMembersSchema,
  async ({ invites }) => {
    const supabase = createClient();
    const user = await getUser();

    const location = headers().get("x-vercel-ip-city") ?? "Unknown";
    const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";

    const data = invites.map((invite) => ({
      ...invite,
      team_id: user.data.team_id,
      invited_by: user.data.id,
    }));

    // TODO: Check if not already member/invited
    const { data: invtesData } = await supabase
      .from("user_invites")
      .insert(data)
      .select("email, code, user:invited_by(*), team:team_id(*)");

    revalidateTag(`team_invites_${user.data.team_id}`);

    const emails = invtesData.map(async (invites) => ({
      from: "Midday <middaybot@midday.ai>",
      to: [invites.email],
      subject: `${invites.user.full_name} invited you to the ${invites.team.name} team on Midday`,
      html: await renderAsync(
        InviteEmail({
          invitedByEmail: invites.user.email,
          invitedByName: invites.user.full_name,
          email: invites.email,
          teamName: invites.team.name,
          inviteCode: invites.code,
          ip,
          location,
        })
      ),
    }));

    const htmlEmails = await Promise.all(emails);

    await resend.batch.send(htmlEmails);
  }
);
