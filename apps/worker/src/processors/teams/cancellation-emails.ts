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

I noticed you canceled your Midday subscription. I'd love to understand what didn't work for you or what was missing — even a one-line reply would be really helpful.

Thanks for giving us a try,

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
