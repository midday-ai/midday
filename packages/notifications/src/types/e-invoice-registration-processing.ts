import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { eInvoiceRegistrationProcessingSchema } from "../schemas";

export const eInvoiceRegistrationProcessing: NotificationHandler = {
  schema: eInvoiceRegistrationProcessingSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_registration_processing",
    source: "system",
    priority: 3,
    metadata: {
      teamId: data.teamId,
      registrationUrl: data.registrationUrl,
    },
  }),

  createEmail: (data, user) => ({
    template: "e-invoice-verification",
    emailType: "owners",
    subject: "Complete your e-invoicing verification",
    user,
    data: {
      registrationUrl:
        data.registrationUrl ?? `${getAppUrl()}/settings/company#e-invoicing`,
    },
  }),
};
