import { resend } from "@jobs/utils/resend";
import { MerchantPortalInviteEmail } from "@midday/email/emails/merchant-portal-invite";
import { render } from "@midday/email/render";
import { inviteMerchantToPortalSchema } from "@midday/jobs/schema";
import { schemaTask } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";

export const inviteMerchantToPortal = schemaTask({
  id: "invite-merchant-to-portal",
  schema: inviteMerchantToPortalSchema,
  maxDuration: 30,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({
    email,
    inviterName,
    teamName,
    teamLogoUrl,
    merchantName,
    inviteCode,
  }) => {
    const subject = `${inviterName} has invited you to access your merchant portal`;

    const html = await render(
      MerchantPortalInviteEmail({
        email,
        inviterName,
        teamName,
        teamLogoUrl: teamLogoUrl || undefined,
        merchantName,
        inviteCode,
      }),
    );

    await resend.emails.send({
      from: `${teamName} via Abacus <noreply@abacuslabs.co>`,
      to: [email],
      subject,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html,
    });
  },
});
