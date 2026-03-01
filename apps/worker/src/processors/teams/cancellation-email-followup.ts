import { hasTeamData, isTeamStillCanceled } from "@midday/db/queries";
import type { Job } from "bullmq";
import { Resend } from "resend";
import type { CancellationEmailsPayload } from "../../schemas/teams";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

const resend = new Resend(process.env.RESEND_API_KEY!);

export class CancellationEmailFollowupProcessor extends BaseProcessor<CancellationEmailsPayload> {
  async process(job: Job<CancellationEmailsPayload>): Promise<void> {
    const { teamId, email, fullName } = job.data;
    const firstName = fullName.split(" ").at(0) || "there";
    const db = getDb();

    const stillCanceled = await isTeamStillCanceled(db, teamId);
    if (!stillCanceled) {
      this.logger.info("Skipping follow-up: team reactivated or deleted", {
        jobId: job.id,
        teamId,
      });
      return;
    }

    const teamHasData = await hasTeamData(db, teamId);
    if (!teamHasData) {
      this.logger.info("Skipping follow-up: team has no data", {
        jobId: job.id,
        teamId,
      });
      return;
    }

    this.logger.info("Sending cancellation follow-up email", {
      jobId: job.id,
      teamId,
      email,
    });

    await resend.emails.send({
      from: "Pontus from Midday <pontus@midday.ai>",
      replyTo: "pontus@midday.ai",
      to: email,
      subject: "Quick question",
      text: `Hey ${firstName},

Quick question — was there one thing that would have made you stick around?

Every bit of feedback helps us improve, and I'd genuinely love to hear your thoughts.

Either way, your data is still there if you ever want to come back. This is the last email from us — I won't bother you again.

Pontus`,
    });

    this.logger.info("Cancellation follow-up email sent", {
      jobId: job.id,
      teamId,
    });
  }
}
