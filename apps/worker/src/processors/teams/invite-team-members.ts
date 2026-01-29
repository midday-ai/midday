import { InviteEmail } from "@midday/email/emails/invite";
import { getI18n } from "@midday/email/locales";
import { render } from "@midday/email/render";
import type { Job } from "bullmq";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import {
  inviteTeamMembersSchema,
  type InviteTeamMembersPayload,
} from "../../schemas/teams";
import { BaseProcessor } from "../base";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends invitation emails to new team members
 */
export class InviteTeamMembersProcessor extends BaseProcessor<InviteTeamMembersPayload> {
  protected getPayloadSchema() {
    return inviteTeamMembersSchema;
  }

  async process(job: Job<InviteTeamMembersPayload>): Promise<void> {
    const { ip, invites, locale } = job.data;

    if (!invites || invites.length === 0) {
      this.logger.info("No invites to send");
      return;
    }

    const { t } = getI18n({ locale });

    this.logger.info("Sending team invites", {
      count: invites.length,
      locale,
    });

    const emails = await Promise.all(
      invites.map(async (invite) => ({
        from: "Midday <middaybot@midday.ai>",
        to: [invite.email],
        subject: t("invite.subject", {
          invitedByName: invite.invitedByName,
          teamName: invite.teamName,
        }),
        headers: {
          "X-Entity-Ref-ID": nanoid(),
        },
        html: await render(
          InviteEmail({
            invitedByEmail: invite.invitedByEmail,
            invitedByName: invite.invitedByName,
            email: invite.email,
            teamName: invite.teamName,
            ip,
            locale,
          }),
        ),
      })),
    );

    await resend.batch.send(emails);

    this.logger.info("Team invites sent", {
      count: emails.length,
    });
  }
}
