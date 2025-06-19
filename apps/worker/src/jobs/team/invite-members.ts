import { InviteEmail } from "@midday/email/emails/invite";
import { getI18n } from "@midday/email/locales";
import { render } from "@midday/email/render";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { nanoid } from "nanoid";
import { z } from "zod";

const inviteTeamMembersSchema = z.object({
  teamId: z.string().uuid(),
  ip: z.string(),
  locale: z.string(),
  invites: z.array(
    z.object({
      email: z.string().email(),
      invitedByName: z.string(),
      invitedByEmail: z.string().email(),
      teamName: z.string(),
    }),
  ),
});

export const inviteTeamMembersJob = job(
  "invite-team-members",
  inviteTeamMembersSchema,
  {
    queue: emailQueue,
  },
  async (data, ctx) => {
    ctx.logger.info(
      `Sending team invites for team ${data.teamId} to ${data.invites.length} recipients`,
    );

    const { t } = getI18n({ locale: data.locale });

    const emails = data.invites.map((invite) => ({
      from: "Midday <middaybot@midday.ai>",
      to: [invite.email],
      subject: t("invite.subject", {
        invitedByName: invite.invitedByName,
        teamName: invite.teamName,
      }),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html: render(
        InviteEmail({
          invitedByEmail: invite.invitedByEmail,
          invitedByName: invite.invitedByName,
          email: invite.email,
          teamName: invite.teamName,
          ip: data.ip,
          locale: data.locale,
        }),
      ),
    }));

    await resend.batch.send(emails);

    ctx.logger.info(
      `Successfully sent ${emails.length} team invite emails for team ${data.teamId}`,
    );

    return {
      type: "team-invites",
      teamId: data.teamId,
      emailsSent: emails.length,
      sentAt: new Date(),
      recipients: data.invites.map((invite) => invite.email),
    };
  },
);
