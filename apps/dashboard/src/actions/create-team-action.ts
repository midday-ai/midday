"use server";

import { logger } from "@/utils/logger";
import { resend } from "@/utils/resend";
import { GetStartedEmail } from "@midday/email/emails/get-started";
import { TrialExpiringEmail } from "@midday/email/emails/trial-expiring";
import { LogEvents } from "@midday/events/events";
import { getCurrency } from "@midday/location";
import { createTeam, updateUser } from "@midday/supabase/mutations";
import { render } from "@react-email/render";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { createTeamSchema } from "./schema";

export const createTeamAction = authActionClient
  .schema(createTeamSchema)
  .metadata({
    name: "create-team",
    track: {
      event: LogEvents.CreateTeam.name,
      channel: LogEvents.CreateTeam.channel,
    },
  })
  .action(
    async ({
      parsedInput: { name, redirectTo },
      ctx: {
        supabase,
        user: { email, full_name },
      },
    }) => {
      const currency = getCurrency();
      const team_id = await createTeam(supabase, { name, currency });
      const user = await updateUser(supabase, { team_id });

      if (!user?.data) {
        return;
      }

      revalidateTag(`user_${user.data.id}`);
      revalidateTag(`teams_${user.data.id}`);

      if (email && full_name) {
        try {
          await resend.emails.send({
            from: "Pontus from Midday <pontus@midday.ai>",
            to: email,
            subject: "Get the most out of Midday",
            html: await render(
              GetStartedEmail({
                fullName: full_name,
              }),
            ),
            scheduledAt: "in 3 days",
          });

          await resend.emails.send({
            from: "Pontus from Midday <pontus@midday.ai>",
            to: email,
            subject: "Your trial is expiring soon",
            html: await render(
              TrialExpiringEmail({
                fullName: full_name,
              }),
            ),
            scheduledAt: "in 11 days",
          });
        } catch (error) {
          logger(error as string);
        }
      }

      if (redirectTo) {
        redirect(redirectTo);
      }

      return team_id;
    },
  );
