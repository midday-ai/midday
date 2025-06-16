import type { Database } from "@midday/db/client";
import type { Job } from "bullmq";
import type { TeamInviteData } from "../../types/email";
import { teamInviteSchema } from "../../types/email";

export async function teamInviteTask(
  job: Job<TeamInviteData>,
  db: Database,
): Promise<void> {
  // Validate job data
  const data = teamInviteSchema.parse(job.data);
  const { recipientEmail, templateData, teamId } = data;

  console.log("Processing team invite email", {
    recipientEmail,
    teamName: templateData.teamName,
    inviterName: templateData.inviterName,
    role: templateData.role,
  });

  await job.updateProgress(10);

  // EXAMPLE: Check if user already exists
  // const existingUser = await db.query.users.findFirst({
  //   where: eq(users.email, recipientEmail)
  // });

  await job.updateProgress(25);

  // EXAMPLE: Query team details
  // const team = await db.query.teams.findFirst({
  //   where: eq(teams.id, teamId),
  //   with: {
  //     members: true,
  //     subscription: true,
  //   }
  // });
  //
  // if (!team) {
  //   throw new Error(`Team ${teamId} not found`);
  // }

  await job.updateProgress(40);

  // EXAMPLE: Generate invite link
  // const inviteLink = `${process.env.APP_URL}/invite/${templateData.inviteToken}`;

  await job.updateProgress(60);

  // EXAMPLE: Send team invitation email
  // const emailService = new EmailService();
  // await emailService.sendTeamInvite({
  //   to: recipientEmail,
  //   inviter: {
  //     name: templateData.inviterName,
  //     email: templateData.inviterEmail,
  //   },
  //   team: {
  //     name: templateData.teamName,
  //     memberCount: team.members.length,
  //     logo: team.logo,
  //   },
  //   invite: {
  //     link: inviteLink,
  //     role: templateData.role,
  //     expiresAt: templateData.expiresAt,
  //     personalMessage: templateData.personalMessage,
  //   },
  //   isExistingUser: !!existingUser,
  // });

  // Simulate email sending
  await new Promise((resolve) => setTimeout(resolve, 600));
  await job.updateProgress(85);

  // EXAMPLE: Update invite status in database
  // await db.update(teamInvites)
  //   .set({
  //     emailSentAt: new Date(),
  //     status: 'sent'
  //   })
  //   .where(eq(teamInvites.token, templateData.inviteToken));

  await job.updateProgress(100);

  console.log("Team invite email sent successfully", {
    to: recipientEmail,
    teamName: templateData.teamName,
    role: templateData.role,
    inviterName: templateData.inviterName,
  });
}
