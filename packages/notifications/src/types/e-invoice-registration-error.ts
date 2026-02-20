import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { eInvoiceRegistrationErrorSchema } from "../schemas";

export const eInvoiceRegistrationError: NotificationHandler = {
  schema: eInvoiceRegistrationErrorSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_registration_error",
    source: "system",
    priority: 2,
    metadata: {
      teamId: data.teamId,
      errorMessage: data.errorMessage,
    },
  }),

  createEmail: (data, user) => ({
    template: "e-invoice-error",
    emailType: "owners",
    subject: "Your e-invoicing setup needs attention",
    user,
    data: {
      errorMessage: data.errorMessage,
      link: `${getAppUrl()}/settings/company#e-invoicing`,
    },
  }),
};
