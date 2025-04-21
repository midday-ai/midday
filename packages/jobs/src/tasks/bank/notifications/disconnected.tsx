import { resend } from "@/utils/resend";
import ConnectionIssueEmail from "@midday/email/emails/connection-issue";
import { render } from "@react-email/components";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const disconnectedNotifications = schemaTask({
  id: "disconnected-notifications",
  maxDuration: 300,
  queue: {
    concurrencyLimit: 1,
  },
  schema: z.object({
    users: z.array(
      z.object({
        bankName: z.string(),
        teamName: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
          full_name: z.string(),
          locale: z.string(),
        }),
      }),
    ),
  }),
  run: async ({ users }) => {
    const emailPromises = users.map(async ({ user, bankName, teamName }) => {
      const html = await render(
        <ConnectionIssueEmail
          fullName={user.full_name}
          bankName={bankName}
          teamName={teamName}
        />,
      );

      return {
        from: "Middaybot <middaybot@midday.ai>",
        to: [user.email],
        subject: "Bank Connection Expiring Soon",
        html,
      };
    });

    const emails = await Promise.all(emailPromises);

    await resend.batch.send(emails);
  },
});
