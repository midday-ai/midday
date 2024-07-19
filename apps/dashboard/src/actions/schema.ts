import { z } from "zod";

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(32).optional(),
  avatar_url: z.string().url().optional(),
  locale: z.string().optional(),
  week_starts_on_monday: z.boolean().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const trackingConsentSchema = z.boolean();

export const sendSupportSchema = z.object({
  subject: z.string(),
  priority: z.string(),
  type: z.string(),
  message: z.string(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  inbox_email: z.string().email().optional().nullable(),
  inbox_forwarding: z.boolean().optional().nullable(),
  logo_url: z.string().url().optional(),
  revalidatePath: z.string().optional(),
});

export type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;

export const subscribeSchema = z.object({
  email: z.string().email(),
  userGroup: z.string(),
});

export const deleteBankAccountSchema = z.object({
  id: z.string().uuid(),
});

export const updateBankAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  enabled: z.boolean().optional(),
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

export const changeChartCurrencySchema = z.string();
export const changeChartTypeSchema = z.enum(["profit", "revenue", "burn_rate"]);
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
  accessToken: z.string().nullable().optional(), // Teller
  enrollmentId: z.string().nullable().optional(), // Teller
  provider: z.enum(["gocardless", "plaid", "teller"]),
  accounts: z.array(
    z.object({
      account_id: z.string(),
      bank_name: z.string(),
      currency: z.string(),
      name: z.string(),
      institution_id: z.string(),
      enabled: z.boolean(),
      logo_url: z.string().nullable().optional(),
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

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  note: z.string().optional(),
  category_slug: z.string().optional(),
  assigned_id: z.string().uuid().optional(),
  status: z.enum(["deleted", "excluded", "posted", "completed"]).optional(),
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
  type: z.enum(["category", "note", "assigned", "status"]),
  data: z.array(updateTransactionSchema),
});

export const updateSimilarTransactionsSchema = z.object({
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
  currency: z.string(),
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
  accountId: z.string().uuid(),
});

export const createGoCardLessLinkSchema = z.object({
  institutionId: z.string(),
  countryCode: z.string(),
  availableHistory: z.number(),
  redirectBase: z.string(),
});

export const updateInstitutionUsageSchema = z.object({
  institutionId: z.string(),
});

export const importTransactionsSchema = z.object({
  filePath: z.array(z.string()),
});

export const setupUserSchema = z.object({
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  team_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

export const verifyOtpSchema = z.object({
  type: z.enum(["phone", "email"]),
  token: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
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
  provider: z.enum(["openai", "mistralai"]).optional(),
});

export const requestAccessSchema = z.void();
