import type { Job } from "bullmq";
import { Resend } from "resend";
import { teamsQueue } from "../../queues/teams";
import type { CancellationEmailsPayload } from "../../schemas/teams";
import { BaseProcessor } from "../base";

const resend = new Resend(process.env.RESEND_API_KEY!);

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export class CancellationEmailsProcessor extends BaseProcessor<CancellationEmailsPayload> {
  async process(job: Job<CancellationEmailsPayload>): Promise<void> {
    const { teamId, email, fullName } = job.data;
    const firstName = fullName.split(" ").at(0) || "there";

    this.logger.info("Sending cancellation email", {
      jobId: job.id,
      teamId,
      email,
    });

    await resend.emails.send({
      from: "Pontus from Midday <pontus@midday.ai>",
      replyTo: "pontus@midday.ai",
      to: email,
      subject: "Thanks for being a customer",
      text: `Hey ${firstName},

I saw you canceled your Midday subscription — no hard feelings at all.

I genuinely appreciate you giving us a try. Your data is exactly where you left it, and your account stays active until the end of your billing period. If anything changes, you can reactivate in one click from settings.

All the best,

Pontus`,
    });

    this.logger.info("Cancellation email sent, scheduling follow-up", {
      jobId: job.id,
      teamId,
    });

    await teamsQueue.add("cancellation-email-followup", job.data, {
      delay: THREE_DAYS_MS,
    });
  }
}
