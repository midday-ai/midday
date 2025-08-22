import { resend } from "@jobs/utils/resend";
import ConnectionIssueEmail from "@midday/email/emails/connection-issue";
import { render } from "@react-email/components";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const disconnectedNotifications = schemaTask({
  id: "disconnected-notifications",
  maxDuration: 10,
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
          fullName: z.string(),
          locale: z.string(),
        }),
      }),
    ),
  }),
  run: async ({ users }) => {
    const emailPromises = users.map(async ({ user, bankName, teamName }) => {
      const html = await render(
        <ConnectionIssueEmail
          fullName={user.fullName}
          bankName={bankName}
          teamName={teamName}
        />,
      );

      return {
        from: "Middaybot <middaybot@midday.ai>",
        to: [user.email],
        subject: "Bank Connection Disconnected",
        html,
      };
    });

    const emails = await Promise.all(emailPromises);

    await resend.batch.send(emails);
  },
});
