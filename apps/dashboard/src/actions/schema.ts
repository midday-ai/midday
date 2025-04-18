import { isValid } from "date-fns";
import { z } from "zod";

export const deleteProjectTagSchema = z.object({
  tagId: z.string(),
  projectId: z.string(),
});

export const createProjectTagSchema = z.object({
  tagId: z.string(),
  projectId: z.string(),
});

export const trackingConsentSchema = z.boolean();

export const sendSupportSchema = z.object({
  subject: z.string(),
  priority: z.string(),
  type: z.string(),
  message: z.string(),
  url: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  inbox_email: z.string().email().optional().nullable(),
  inbox_forwarding: z.boolean().optional().nullable(),
  logo_url: z.string().url().optional(),
  base_currency: z.string().optional(),
  document_classification: z.boolean().optional(),
  revalidatePath: z.string().optional(),
});

export type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;

export const deleteBankAccountSchema = z.object({
  id: z.string().uuid(),
});

export const updateBankAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  balance: z.number().optional(),
  type: z
    .enum(["depository", "credit", "other_asset", "loan", "other_liability"])
    .optional()
    .nullable(),
});

export type DeleteBankAccountFormValues = z.infer<
  typeof deleteBankAccountSchema
>;

export const updateSubscriberPreferenceSchema = z.object({
  templateId: z.string(),
  teamId: z.string(),
  revalidatePath: z.string(),
  subscriberId: z.string(),
  type: z.string(),
  enabled: z.boolean(),
});

export const exportTransactionsSchema = z.array(z.string());

export const deleteFileSchema = z.object({
  id: z.string(),
  path: z.array(z.string()),
});

export const deleteFolderSchema = z.object({
  path: z.array(z.string()),
});

export const createFolderSchema = z.object({
  path: z.string(),
  name: z.string(),
});

export const unenrollMfaSchema = z.object({
  factorId: z.string(),
});

export const mfaVerifySchema = z.object({
  factorId: z.string(),
  challengeId: z.string(),
  code: z.string(),
});

export const shareFileSchema = z.object({
  filepath: z.string(),
  expireIn: z.number(),
});

export const connectBankAccountSchema = z.object({
  referenceId: z.string().nullable().optional(), // GoCardLess
  accessToken: z.string().nullable().optional(), // Teller
  enrollmentId: z.string().nullable().optional(), // Teller
  provider: z.enum(["gocardless", "plaid", "teller", "enablebanking"]),
  accounts: z.array(
    z.object({
      account_id: z.string(),
      bank_name: z.string(),
      balance: z.number().optional(),
      currency: z.string(),
      name: z.string(),
      institution_id: z.string(),
      account_reference: z.string().nullable().optional(), // EnableBanking & GoCardLess
      enabled: z.boolean(),
      logo_url: z.string().nullable().optional(),
      expires_at: z.string().nullable().optional(), // EnableBanking & GoCardLess
      type: z.enum([
        "credit",
        "depository",
        "other_asset",
        "loan",
        "other_liability",
      ]),
    }),
  ),
});

export const sendFeedbackSchema = z.object({
  feedback: z.string(),
});

export const changeTeamSchema = z.object({
  teamId: z.string(),
  redirectTo: z.string(),
});

export const deleteEntriesSchema = z.object({
  id: z.string().uuid(),
});

export const updateEntriesSchema = z.object({
  id: z.string().uuid().optional(),
  action: z.enum(["update", "create", "delete"]),
  date: z.string().optional(),
  duration: z.number().optional(),
  assigned_id: z.string().optional(),
  project_id: z.string().optional(),
  description: z.string().optional(),
  start: z.string().datetime().optional(),
  stop: z.string().datetime().optional(),
});

export const manualSyncTransactionsSchema = z.object({
  connectionId: z.string(),
});

export const reconnectConnectionSchema = z.object({
  connectionId: z.string(),
  provider: z.string(),
});

export const createGoCardLessLinkSchema = z.object({
  institutionId: z.string(),
  step: z.string().optional(),
  availableHistory: z.number(),
  redirectBase: z.string(),
});

export const createEnableBankingLinkSchema = z.object({
  institutionId: z.string(),
  maximumConsentValidity: z.number(),
  country: z.string().optional().nullable(),
  isDesktop: z.boolean(),
  type: z.enum(["personal", "business"]),
});

export const reconnectEnableBankingLinkSchema = z.object({
  institutionId: z.string(),
  isDesktop: z.boolean(),
  sessionId: z.string(),
});

export const updateInstitutionUsageSchema = z.object({
  institutionId: z.string(),
});

export const verifyOtpSchema = z.object({
  token: z.string(),
  email: z.string(),
});

export const getVatRateSchema = z.object({
  name: z.string().min(2),
});

export const createBankAccountSchema = z.object({
  name: z.string(),
  currency: z.string().optional(),
});

export const parseDateSchema = z
  .date()
  .transform((value) => new Date(value))
  .transform((v) => isValid(v))
  .refine((v) => !!v, { message: "Invalid date" });

export const filterTransactionsSchema = z.object({
  name: z.string().optional().describe("The name to search for"),
  start: parseDateSchema
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: parseDateSchema
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  attachments: z
    .enum(["exclude", "include"])
    .optional()
    .describe(
      "Whether to include or exclude results with attachments or receipts.",
    ),
  categories: z
    .array(z.string())
    .optional()
    .describe("The categories to filter by"),
  tags: z.array(z.string()).optional().describe("The tags to filter by"),
  recurring: z
    .array(z.enum(["all", "weekly", "monthly", "annually"]))
    .optional()
    .describe("The recurring to filter by"),
  amount_range: z
    .array(z.number())
    .optional()
    .describe("The amount range to filter by"),
});

export const filterVaultSchema = z.object({
  name: z.string().optional().describe("The name to search for"),
  tags: z.array(z.string()).optional().describe("The tags to filter by"),
  start: parseDateSchema
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: parseDateSchema
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  owners: z.array(z.string()).optional().describe("The owners to filter by"),
});

export const filterTrackerSchema = z.object({
  name: z.string().optional().describe("The name to search for"),
  start: parseDateSchema
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: parseDateSchema
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  status: z
    .enum(["in_progress", "completed"])
    .optional()
    .describe("The status to filter by"),
});

export const filterInvoiceSchema = z.object({
  name: z.string().optional().describe("The name to search for"),
  statuses: z
    .array(z.enum(["draft", "overdue", "paid", "unpaid", "canceled"]))
    .optional()
    .describe("The statuses to filter by"),
  start: parseDateSchema
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: parseDateSchema
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  customers: z
    .array(z.string())
    .optional()
    .describe("The customers to filter by"),
});

export const deleteConnectionSchema = z.object({
  connectionId: z.string(),
});
