import { getUserById } from "@db/queries";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { z } from "zod";
import { getStartedEmailJob } from "./get-started-email";
import { trialEndedEmailJob } from "./trial-ended-email";
import { trialExpiringEmailJob } from "./trial-expiring-email";
import { welcomeEmailJob } from "./welcome-email";

export const onboardTeamSchema = z.object({
  userId: z.string().uuid(),
});

export const onboardTeamJob = job(
  "onboard-team",
  onboardTeamSchema,
  {
    queue: emailQueue,
    removeOnComplete: 100, // Override just this option - keep more onboarding logs
  },
  async ({ userId }, ctx) => {
    ctx.logger.info(`Starting onboarding for user ${userId}`);

    const user = await getUserById(ctx.db, userId);

    if (!user || !user.fullName || !user.email || !user.teamId) {
      throw new Error("User data is missing");
    }

    const [firstName, lastName] = user.fullName.split(" ") ?? [];

    await resend.contacts.create({
      email: user.email,
      firstName,
      lastName,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });

    ctx.logger.info(`Added ${user.email} to contacts`);

    const emailData = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      teamId: user.teamId,
    };

    // 1. Send welcome email after 1 min
    const welcomeJob = await welcomeEmailJob.triggerDelayed(
      emailData,
      60 * 1000,
    ); // wait 1 min

    // 2. Send get started email after 3 days
    const getStartedJob = await getStartedEmailJob.triggerDelayed(
      emailData,
      3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
    );

    // 3. Send trial expiring email after 14 days (11 + 3)
    const trialExpiringJob = await trialExpiringEmailJob.triggerDelayed(
      emailData,
      14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    );

    // 4. Send trial ended email after 30 days (15 + 14 + 1)
    const trialEndedJob = await trialEndedEmailJob.triggerDelayed(
      emailData,
      30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    );

    ctx.logger.info(`Onboarding sequence scheduled for user ${userId}`);

    return {
      userId,
      onboardingStarted: true,
      scheduledJobs: {
        welcome: welcomeJob.id,
        getStarted: getStartedJob.id,
        trialExpiring: trialExpiringJob.id,
        trialEnded: trialEndedJob.id,
      },
      startedAt: new Date(),
    };
  },
);
