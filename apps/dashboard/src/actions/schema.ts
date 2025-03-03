import { isValid } from "date-fns";
import { z } from "zod";

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  locale: z.string().optional(),
  week_starts_on_monday: z.boolean().optional(),
  timezone: z.string().optional(),
  time_format: z.number().optional(),
  date_format: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]).optional(),
  revalidatePath: z.string().optional(),
});

export const createTagSchema = z.object({ name: z.string() });
export const createTransactionTagSchema = z.object({
  tagId: z.string(),
  transactionId: z.string(),
});

export const deleteTagSchema = z.object({
  id: z.string(),
});

export const updateTagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const deleteTransactionTagSchema = z.object({
  tagId: z.string(),
  transactionId: z.string(),
});

export const deleteProjectTagSchema = z.object({
  tagId: z.string(),
  projectId: z.string(),
});

export const createProjectTagSchema = z.object({
  tagId: z.string(),
  projectId: z.string(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

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

export const subscribeSchema = z.object({
  email: z.string().email(),
});

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

export const changeSpendingPeriodSchema = z.object({
  id: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const changeChartTypeSchema = z.enum([
  "profit",
  "revenue",
  "expense",
  "burn_rate",
]);

export const changeChartPeriodSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const changeTransactionsPeriodSchema = z.enum([
  "all",
  "income",
  "expense",
]);

export const createAttachmentsSchema = z.array(
  z.object({
    path: z.array(z.string()),
    name: z.string(),
    size: z.number(),
    transaction_id: z.string(),
    type: z.string(),
  }),
);

export const deleteAttachmentSchema = z.string();

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
      account_reference: z.string().nullable().optional(),
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

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  note: z.string().optional().nullable(),
  category_slug: z.string().optional(),
  tag_id: z.string().uuid().optional(),
  assigned_id: z.string().uuid().optional(),
  recurring: z.boolean().optional().nullable(),
  frequency: z.enum(["weekly", "monthly", "annually"]).optional().nullable(),
  status: z
    .enum(["deleted", "excluded", "posted", "completed", "archived"])
    .optional(),
  internal: z.boolean().optional().nullable(),
});

export type UpdateTransactionValues = z.infer<typeof updateTransactionSchema>;

export const deleteTransactionSchema = z.object({
  ids: z.array(z.string()),
});

export const deleteCategoriesSchema = z.object({
  ids: z.array(z.string()),
  revalidatePath: z.string(),
});

export const bulkUpdateTransactionsSchema = z.object({
  type: z.enum([
    "category",
    "note",
    "assigned",
    "status",
    "recurring",
    "tags",
    "archive",
  ]),
  data: z.array(updateTransactionSchema),
});

export const updateSimilarTransactionsCategorySchema = z.object({
  id: z.string(),
});

export const updateSimilarTransactionsRecurringSchema = z.object({
  id: z.string(),
});

export const updaterMenuSchema = z.array(
  z.object({
    path: z.string(),
    name: z.string(),
  }),
);

export const changeTeamSchema = z.object({
  teamId: z.string(),
  redirectTo: z.string(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  redirectTo: z.string().optional(),
});

export const changeUserRoleSchema = z.object({
  userId: z.string(),
  teamId: z.string(),
  role: z.enum(["owner", "member"]),
  revalidatePath: z.string().optional(),
});

export const deleteTeamMemberSchema = z.object({
  userId: z.string(),
  teamId: z.string(),
  revalidatePath: z.string().optional(),
});

export const leaveTeamSchema = z.object({
  teamId: z.string(),
  redirectTo: z.string().optional(),
  role: z.enum(["owner", "member"]),
  revalidatePath: z.string().optional(),
});

export const deleteTeamSchema = z.object({
  teamId: z.string(),
});

export const inviteTeamMembersSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email().optional(),
      role: z.enum(["owner", "member"]),
    }),
  ),
  redirectTo: z.string().optional(),
  revalidatePath: z.string().optional(),
});

export type InviteTeamMembersFormValues = z.infer<
  typeof inviteTeamMembersSchema
>;

export const createCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      vat: z.string().optional(),
    }),
  ),
});

export type CreateCategoriesFormValues = z.infer<typeof createCategoriesSchema>;

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string(),
  description: z.string().optional().nullable(),
  vat: z.string().optional().nullable(),
});

export type UpdateCategoriesFormValues = z.infer<typeof updateCategorySchema>;

export const deleteInviteSchema = z.object({
  id: z.string(),
  revalidatePath: z.string().optional(),
});

export const acceptInviteSchema = z.object({
  id: z.string(),
  revalidatePath: z.string().optional(),
});

export const declineInviteSchema = z.object({
  id: z.string(),
  revalidatePath: z.string().optional(),
});

export const inboxFilterSchema = z.enum(["done", "todo", "all"]);

export const updateInboxSchema = z.object({
  id: z.string(),
  status: z.enum(["deleted", "pending"]).optional(),
  display_name: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  transaction_id: z.string().nullable().optional(),
});

export type UpdateInboxFormValues = z.infer<typeof updateInboxSchema>;

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  estimate: z.number().optional(),
  billable: z.boolean().optional().default(false),
  rate: z.number().min(1).optional(),
  currency: z.string().optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional()
    .nullable(),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  estimate: z.number().optional(),
  billable: z.boolean().optional().default(false),
  rate: z.number().min(1).optional(),
  currency: z.string().optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional()
    .nullable(),
});

export const deleteProjectSchema = z.object({
  id: z.string().uuid(),
});

export const deleteEntriesSchema = z.object({
  id: z.string().uuid(),
});

export const createReportSchema = z.object({
  baseUrl: z.string().url(),
  from: z.string(),
  to: z.string(),
  type: changeChartTypeSchema,
  expiresAt: z.string().datetime().optional(),
});

export const createProjectReportSchema = z.object({
  baseUrl: z.string().url(),
  projectId: z.string().uuid(),
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
  connectionId: z.string().uuid(),
});

export const reconnectConnectionSchema = z.object({
  connectionId: z.string().uuid(),
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
});

export const reconnectEnableBankingLinkSchema = z.object({
  institutionId: z.string(),
  isDesktop: z.boolean(),
});

export const updateInstitutionUsageSchema = z.object({
  institutionId: z.string(),
});

export const verifyOtpSchema = z.object({
  token: z.string(),
  email: z.string(),
});

export const searchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(["inbox", "categories"]),
  limit: z.number().optional(),
});

export const inboxOrder = z.boolean();

export const getVatRateSchema = z.object({
  name: z.string().min(2),
});

export const createBankAccountSchema = z.object({
  name: z.string(),
  currency: z.string().optional(),
});

export const createTransactionsSchema = z.object({
  accountId: z.string().uuid(),
  currency: z.string(),
  transactions: z.array(
    z.object({
      internal_id: z.string(),
      bank_account_id: z.string().uuid(),
      date: z.coerce.date(),
      name: z.string(),
      amount: z.number(),
      currency: z.string(),
      team_id: z.string(),
      status: z.enum(["posted"]),
      method: z.enum(["other"]),
      manual: z.boolean(),
      category_slug: z.enum(["income"]).nullable(),
    }),
  ),
});

export type CreateTransactionsFormValues = z.infer<
  typeof createTransactionsSchema
>;

export const assistantSettingsSchema = z.object({
  enabled: z.boolean().optional(),
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

export const createTransactionSchema = z.object({
  name: z.string(),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  bank_account_id: z.string(),
  assigned_id: z.string().optional(),
  category_slug: z.string().optional(),
  note: z.string().optional(),
  attachments: z
    .array(
      z.object({
        path: z.array(z.string()),
        name: z.string(),
        size: z.number(),
        type: z.string(),
      }),
    )
    .optional(),
});

export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;

export const createCustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  email: z.string().email(),
  country: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional()
    .nullable(),
});

export const inboxUploadSchema = z.array(
  z.object({
    mimetype: z.string(),
    size: z.number(),
    file_path: z.array(z.string()),
  }),
);

export const deleteConnectionSchema = z.object({
  connectionId: z.string(),
});
