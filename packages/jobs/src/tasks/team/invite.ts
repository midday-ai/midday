import { resend } from "@jobs/utils/resend";
import { InviteEmail } from "@midday/email/emails/invite";
import { getI18n } from "@midday/email/locales";
import { render } from "@midday/email/render";
import { inviteTeamMembersSchema } from "@midday/jobs/schema";
import { schemaTask } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";

export const inviteTeamMembers = schemaTask({
  id: "invite-team-members",
  schema: inviteTeamMembersSchema,
  maxDuration: 30,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ ip, invites, locale }) => {
    const { t } = getI18n({ locale });

    const emails = invites?.map(async (invite) => ({
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
          ip,
          locale,
        }),
      ),
    }));

    const htmlEmails = await Promise.all(emails);

    await resend.batch.send(htmlEmails);
  },
});
