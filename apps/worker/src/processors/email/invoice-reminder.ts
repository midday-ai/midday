import type { PrimaryDatabase } from "@midday/db/client";
import type { Job } from "bullmq";
import { logger } from "../../monitoring/logger";
import type { InvoiceReminderData } from "../../types/email";
import { invoiceReminderSchema } from "../../types/email";

export async function invoiceReminderTask(
  job: Job<InvoiceReminderData>,
  db: PrimaryDatabase,
): Promise<void> {
  // Validate job data
  const data = invoiceReminderSchema.parse(job.data);
  const { recipientEmail, templateData, teamId } = data;

  console.log("Processing invoice reminder email", {
    recipientEmail,
    invoiceId: templateData.invoiceId,
    amount: templateData.amount,
  });

  await job.updateProgress(10);

  // EXAMPLE: Query database for invoice details
  // const invoice = await db.query.invoices.findFirst({
  //   where: eq(invoices.id, templateData.invoiceId)
  // });
  //
  // if (!invoice) {
  //   throw new Error(`Invoice ${templateData.invoiceId} not found`);
  // }

  await job.updateProgress(30);

  // EXAMPLE: Query team details for branding
  // const team = await db.query.teams.findFirst({
  //   where: eq(teams.id, teamId)
  // });

  await job.updateProgress(50);

  // EXAMPLE: Send invoice reminder email
  // const emailService = new EmailService();
  // await emailService.sendInvoiceReminder({
  //   to: recipientEmail,
  //   invoice: {
  //     id: templateData.invoiceId,
  //     number: templateData.invoiceNumber,
  //     amount: templateData.amount,
  //     dueDate: templateData.dueDate,
  //     customerName: templateData.customerName,
  //   },
  //   team: {
  //     name: team.name,
  //     logo: team.logo,
  //     brandColor: team.brandColor,
  //   },
  //   reminderType: 'overdue', // or 'upcoming'
  // });

  // Simulate email sending
  await new Promise((resolve) => setTimeout(resolve, 800));
  await job.updateProgress(90);

  // EXAMPLE: Log the reminder in database
  // await db.insert(emailLogs).values({
  //   id: generateId(),
  //   type: 'invoice_reminder',
  //   recipientEmail,
  //   invoiceId: templateData.invoiceId,
  //   teamId,
  //   sentAt: new Date(),
  //   status: 'sent'
  // });

  await job.updateProgress(100);

  logger.info("Invoice reminder email sent successfully", {
    to: recipientEmail,
    invoiceId: templateData.invoiceId,
    amount: templateData.amount,
  });
}
