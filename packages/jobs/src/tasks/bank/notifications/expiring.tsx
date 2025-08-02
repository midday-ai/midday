import { resend } from "@jobs/utils/resend";
import ConnectionExpireEmail from "@midday/email/emails/connection-expire";
import { render } from "@react-email/components";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const expiringNotifications = schemaTask({
  id: "expiring-notifications",
  maxDuration: 300,
  queue: {
    concurrencyLimit: 1,
  },
  schema: z.object({
    users: z.array(
      z.object({
        bankName: z.string(),
        teamName: z.string(),
        expiresAt: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
          fullName: z.string(),
          locale: z.string(),
        }),
      }),
    ),
  }),
  run: async ({ users }) => {
    const emailPromises = users.map(
      async ({ user, bankName, teamName, expiresAt }) => {
        const html = await render(
          <ConnectionExpireEmail
            fullName={user.fullName}
            bankName={bankName}
            teamName={teamName}
            expiresAt={expiresAt}
          />,
        );

        return {
          from: "Middaybot <middaybot@midday.ai>",
          to: [user.email],
          subject: "Bank Connection Expiring Soon",
          html,
        };
      },
    );

    const emails = await Promise.all(emailPromises);

    await resend.batch.send(emails);
  },
});
