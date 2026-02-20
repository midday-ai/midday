import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { eInvoiceRegistrationCompleteSchema } from "../schemas";

export const eInvoiceRegistrationComplete: NotificationHandler = {
  schema: eInvoiceRegistrationCompleteSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_registration_complete",
    source: "system",
    priority: 3,
    metadata: {
      teamId: data.teamId,
      peppolId: data.peppolId,
    },
  }),

  createEmail: (data, user) => ({
    template: "e-invoice-registered",
    emailType: "owners",
    subject: "E-invoicing is now active",
    user,
    data: {
      peppolId: data.peppolId,
      link: `${getAppUrl()}/settings/company#e-invoicing`,
    },
  }),
};
